"""
analyzer.py - 圃場写真解析モジュール
Claude Vision API を使って圃場写真から土壌・植生情報を抽出する。
"""

import base64
import json
import logging
import os
import re
from pathlib import Path

import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential, before_log, after_log

# エラーログ設定
log_dir = Path(__file__).parent
log_file = log_dir / "error.log"
logging.basicConfig(
    filename=str(log_file),
    level=logging.ERROR,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5")

SYSTEM_PROMPT = """あなたは農業・土壌科学の専門家です。
圃場の写真を分析し、以下の情報を正確に抽出してください。

必ず以下のJSONスキーマに従って回答してください（余分なテキストなし）:
{
  "soil_type": "loam|clay|sandy|silt|unknown のいずれか",
  "soil_color": "dark_brown|brown|red|gray|unknown のいずれか",
  "vegetation": ["検出された植生のリスト（日本語）"],
  "abandonment_level": 1から5の整数（1=良好・管理された農地、5=完全放棄・荒廃），
  "drainage_estimate": "poor|moderate|good のいずれか",
  "slope": "flat|gentle|moderate|steep のいずれか",
  "stones_present": trueまたはfalse,
  "raw_description": "圃場全体の詳細な日本語説明（200字程度）",
  "confidence": 0.0から1.0の浮動小数点（判定の確信度）
}

判定基準:
- soil_type: loam=ローム質（バランス良い）、clay=粘土質（重い）、sandy=砂質（軽い）、silt=シルト質
- abandonment_level: 1=整備済み、2=軽度放棄、3=中度放棄、4=重度放棄、5=完全荒廃
- drainage_estimate: 地形・土壌・植生から排水性を推定
- confidence: 写真の品質・情報量から総合的な確信度を設定
"""


def _encode_image(image_path: str) -> tuple[str, str]:
    """画像をbase64エンコードしてメディアタイプとともに返す。"""
    path = Path(image_path)
    suffix = path.suffix.lower()
    media_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    media_type = media_type_map.get(suffix, "image/jpeg")
    with open(image_path, "rb") as f:
        data = base64.standard_b64encode(f.read()).decode("utf-8")
    return data, media_type


def _parse_json_response(text: str) -> dict:
    """APIレスポンステキストからJSONを抽出してパースする。"""
    # コードブロック除去
    text = re.sub(r"```(?:json)?\s*", "", text).strip()
    text = re.sub(r"```\s*$", "", text).strip()
    return json.loads(text)


def _validate_schema(result: dict) -> dict:
    """戻り値のスキーマを検証・補完する。"""
    soil_types = {"loam", "clay", "sandy", "silt", "unknown"}
    soil_colors = {"dark_brown", "brown", "red", "gray", "unknown"}
    drainage_values = {"poor", "moderate", "good"}
    slope_values = {"flat", "gentle", "moderate", "steep"}

    result.setdefault("soil_type", "unknown")
    result.setdefault("soil_color", "unknown")
    result.setdefault("vegetation", [])
    result.setdefault("abandonment_level", 3)
    result.setdefault("drainage_estimate", "moderate")
    result.setdefault("slope", "flat")
    result.setdefault("stones_present", False)
    result.setdefault("raw_description", "")
    result.setdefault("confidence", 0.5)

    if result["soil_type"] not in soil_types:
        result["soil_type"] = "unknown"
    if result["soil_color"] not in soil_colors:
        result["soil_color"] = "unknown"
    if result["drainage_estimate"] not in drainage_values:
        result["drainage_estimate"] = "moderate"
    if result["slope"] not in slope_values:
        result["slope"] = "flat"
    result["abandonment_level"] = max(1, min(5, int(result["abandonment_level"])))
    result["confidence"] = max(0.0, min(1.0, float(result["confidence"])))
    if not isinstance(result["vegetation"], list):
        result["vegetation"] = []
    result["stones_present"] = bool(result["stones_present"])

    return result


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    before=before_log(logger, logging.ERROR),
    after=after_log(logger, logging.ERROR),
    reraise=True,
)
def _call_api(client: anthropic.Anthropic, image_data: str, media_type: str) -> str:
    """Claude Vision API を呼び出す（リトライ付き）。"""
    model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5")
    message = client.messages.create(
        model=model,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": "この圃場写真を分析してください。必ずJSONのみで回答してください。",
                    },
                ],
            }
        ],
    )
    return message.content[0].text


def analyze_field_image(image_path: str, api_key: str | None = None) -> dict:
    """
    圃場写真を解析して土壌・植生情報を返す。

    Args:
        image_path: 解析する画像ファイルのパス（JPEG/PNG）
        api_key: Anthropic API キー（Noneの場合は環境変数から取得）

    Returns:
        構造化JSON（soil_type, soil_color, vegetation, abandonment_level,
                    drainage_estimate, slope, stones_present, raw_description, confidence）

    Raises:
        FileNotFoundError: 画像ファイルが存在しない場合
        RuntimeError: API呼び出しが全リトライ失敗した場合
    """
    if not Path(image_path).exists():
        raise FileNotFoundError(f"画像ファイルが見つかりません: {image_path}")

    if api_key is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY が設定されていません")

    client = anthropic.Anthropic(api_key=api_key)

    try:
        image_data, media_type = _encode_image(image_path)
        raw_text = _call_api(client, image_data, media_type)
        result = _parse_json_response(raw_text)
        return _validate_schema(result)
    except json.JSONDecodeError as e:
        logger.error("JSONパースエラー: %s", e)
        raise RuntimeError(f"APIレスポンスのJSONパースに失敗しました: {e}") from e
    except anthropic.APIError as e:
        logger.error("Anthropic APIエラー: %s", e)
        raise RuntimeError(f"API呼び出しに失敗しました: {e}") from e
