"""
routers/fields.py - 圃場関連エンドポイント
"""

import io
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models.field import Field, Analysis, CropSuitability
from schemas.field import (
    FieldCreate,
    FieldResponse,
    FieldDetailResponse,
    FieldListItemResponse,
    AnalysisResponse,
    CropSuitabilityResponse,
)
from analyzer import analyze_field_image
from scorer import score_crops, DEFAULT_MASTERS
from export import generate_report

router = APIRouter()

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
MASTERS_PATH = Path(os.getenv("MASTERS_PATH", "/app/data/masters.json"))

# --- 排水性・傾斜の変換テーブル ---
_DRAINAGE_ORDER = {"poor": 0, "moderate": 1, "good": 2}
_SLOPE_ORDER = {"flat": 0, "gentle": 1, "moderate": 2, "steep": 3}


def _load_masters() -> list[dict]:
    """masters.json からマスタデータを読み込み、scorer.py 形式に変換する。"""
    if not MASTERS_PATH.exists():
        return DEFAULT_MASTERS

    with open(MASTERS_PATH) as f:
        data = json.load(f)

    crops = data.get("crops", [])
    result = []
    for crop in crops:
        # required_drainage -> suitable_drainage
        req_drain = crop.get("required_drainage", "moderate")
        req_level = _DRAINAGE_ORDER.get(req_drain, 1)
        suitable_drainage = [k for k, v in _DRAINAGE_ORDER.items() if v >= req_level]

        # slope_tolerance -> suitable_slopes
        slope_tol = crop.get("slope_tolerance", "gentle")
        tol_level = _SLOPE_ORDER.get(slope_tol, 1)
        suitable_slopes = [k for k, v in _SLOPE_ORDER.items() if v <= tol_level]

        result.append({
            "crop_name": crop["name"],
            "suitable_soil_types": crop.get("suitable_soil_types", []),
            "max_abandonment_level": crop.get("max_abandonment_level", 3),
            "suitable_drainage": suitable_drainage,
            "suitable_slopes": suitable_slopes,
        })
    return result


def _analysis_to_response(analysis: Analysis) -> AnalysisResponse:
    """Analysis ORM オブジェクトを AnalysisResponse に変換する。"""
    vegetation = []
    if analysis.vegetation:
        try:
            vegetation = json.loads(analysis.vegetation)
        except json.JSONDecodeError:
            vegetation = []

    crops = [
        CropSuitabilityResponse(
            crop_name=c.crop_name,
            score=c.score,
            rank=c.rank,
            reason=c.reason,
        )
        for c in analysis.crop_suitability
    ]

    return AnalysisResponse(
        id=analysis.id,
        field_id=analysis.field_id,
        photo_path=analysis.photo_path,
        analyzed_at=analysis.analyzed_at,
        soil_type=analysis.soil_type,
        soil_color=analysis.soil_color,
        vegetation=vegetation,
        abandonment_level=analysis.abandonment_level,
        drainage_estimate=analysis.drainage_estimate,
        slope=analysis.slope,
        stones_present=bool(analysis.stones_present),
        raw_description=analysis.raw_description,
        confidence=analysis.confidence,
        crop_suitability=crops,
    )


# ----- エンドポイント -----


@router.post("/fields", response_model=FieldResponse)
def create_field(field: FieldCreate, db: Session = Depends(get_db)):
    """圃場を登録する。"""
    db_field = Field(**field.model_dump())
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    return db_field


@router.post("/fields/{field_id}/analyze", response_model=AnalysisResponse)
async def analyze_field(
    field_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """画像をアップロードして圃場を解析する。"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="圃場が見つかりません")

    # ファイル保存
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"{field_id}_{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / filename
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # 画像解析
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY が設定されていません")

    try:
        result = analyze_field_image(str(file_path), api_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"画像解析に失敗しました: {e}")

    # 栽培適性スコアリング
    masters = _load_masters()
    crop_scores = score_crops(result, masters)

    # DB保存
    vegetation_json = json.dumps(result.get("vegetation", []), ensure_ascii=False)
    analysis = Analysis(
        field_id=field_id,
        photo_path=str(file_path),
        analyzed_at=datetime.now(timezone.utc),
        soil_type=result.get("soil_type"),
        soil_color=result.get("soil_color"),
        vegetation=vegetation_json,
        abandonment_level=result.get("abandonment_level"),
        drainage_estimate=result.get("drainage_estimate"),
        slope=result.get("slope"),
        stones_present=1 if result.get("stones_present") else 0,
        raw_description=result.get("raw_description"),
        confidence=result.get("confidence"),
    )
    db.add(analysis)
    db.flush()

    for cs in crop_scores:
        db.add(CropSuitability(
            analysis_id=analysis.id,
            crop_name=cs["crop_name"],
            score=cs["score"],
            rank=cs["rank"],
            reason=cs.get("reason"),
        ))

    db.commit()
    db.refresh(analysis)

    return _analysis_to_response(analysis)


@router.get("/fields", response_model=list[FieldListItemResponse])
def list_fields(db: Session = Depends(get_db)):
    """圃場一覧を取得する（最新解析サマリー付き）。"""
    fields = db.query(Field).order_by(Field.id).all()
    result = []
    for f in fields:
        latest = (
            db.query(Analysis)
            .filter(Analysis.field_id == f.id)
            .order_by(Analysis.analyzed_at.desc())
            .first()
        )
        item = FieldListItemResponse.model_validate(f)
        if latest:
            item.latest_analysis = _analysis_to_response(latest)
        result.append(item)
    return result


@router.get("/export")
def export_excel(db: Session = Depends(get_db)):
    """圃場一覧を Excel (.xlsx) でエクスポートする。"""
    fields = db.query(Field).order_by(Field.id).all()
    export_data = []

    for f in fields:
        latest = (
            db.query(Analysis)
            .filter(Analysis.field_id == f.id)
            .order_by(Analysis.analyzed_at.desc())
            .first()
        )
        entry = {
            "id": f.id,
            "name": f.name,
            "address": f.address,
            "analyzed_at": (
                latest.analyzed_at.strftime("%Y-%m-%d")
                if latest and latest.analyzed_at
                else None
            ),
            "soil_type": latest.soil_type if latest else None,
            "abandonment_level": latest.abandonment_level if latest else None,
            "crop_suitability": None,
        }
        if latest:
            crops = (
                db.query(CropSuitability)
                .filter(CropSuitability.analysis_id == latest.id)
                .order_by(CropSuitability.rank)
                .all()
            )
            entry["crop_suitability"] = [
                {"crop_name": c.crop_name, "score": c.score, "rank": c.rank}
                for c in crops
            ]
        export_data.append(entry)

    excel_bytes = generate_report(export_data)
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=fields_report.xlsx"},
    )


@router.get("/fields/{field_id}", response_model=FieldDetailResponse)
def get_field(field_id: int, db: Session = Depends(get_db)):
    """圃場詳細を取得する（全解析履歴付き）。"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="圃場が見つかりません")

    analyses = (
        db.query(Analysis)
        .filter(Analysis.field_id == field_id)
        .order_by(Analysis.analyzed_at.desc())
        .all()
    )

    resp = FieldDetailResponse.model_validate(field)
    resp.analyses = [_analysis_to_response(a) for a in analyses]
    return resp
