"""
scorer.py - 栽培適性スコアリングモジュール
画像解析結果と栽培適性マスタを照合して適性スコアを返す。
"""

from typing import Any


def score_crops(analysis: dict, masters: list[dict]) -> list[dict]:
    """
    圃場解析結果と栽培適性マスタを照合してスコアリングする。

    Args:
        analysis: analyze_field_image() の戻り値
        masters: 栽培適性マスタのリスト（masters.json の内容）
                 各エントリは以下の形式:
                 {
                   "crop_name": "大根",
                   "suitable_soil_types": ["loam", "sandy"],
                   "max_abandonment_level": 3,
                   "suitable_drainage": ["moderate", "good"],
                   "suitable_slopes": ["flat", "gentle"]
                 }

    Returns:
        上位5件のスコアリスト:
        [{"crop_name": "大根", "score": 85, "rank": 1, "reason": "..."}, ...]
    """
    results = []

    soil_type = analysis.get("soil_type", "unknown")
    abandonment_level = analysis.get("abandonment_level", 5)
    drainage = analysis.get("drainage_estimate", "moderate")
    slope = analysis.get("slope", "flat")

    for master in masters:
        score = 0
        reasons = []

        # 土壌タイプ合致: +40点
        suitable_soils = master.get("suitable_soil_types", [])
        if soil_type in suitable_soils:
            score += 40
            reasons.append(f"土壌タイプ({soil_type})が適合")
        elif soil_type == "unknown":
            score += 15  # 不明の場合は部分点
            reasons.append("土壌タイプ不明（部分点）")
        else:
            reasons.append(f"土壌タイプ({soil_type})が不適合")

        # 荒廃度が許容範囲内: +30点
        max_abandonment = master.get("max_abandonment_level", 3)
        if abandonment_level <= max_abandonment:
            score += 30
            reasons.append(f"荒廃度({abandonment_level})が許容範囲内(≤{max_abandonment})")
        else:
            reasons.append(f"荒廃度({abandonment_level})が許容範囲超過(>{max_abandonment})")

        # 排水性合致: +20点
        suitable_drainage = master.get("suitable_drainage", [])
        if drainage in suitable_drainage:
            score += 20
            reasons.append(f"排水性({drainage})が適合")
        else:
            reasons.append(f"排水性({drainage})が不適合")

        # 傾斜合致: +10点
        suitable_slopes = master.get("suitable_slopes", [])
        if slope in suitable_slopes:
            score += 10
            reasons.append(f"傾斜({slope})が適合")
        else:
            reasons.append(f"傾斜({slope})が不適合")

        results.append({
            "crop_name": master.get("crop_name", "不明"),
            "score": score,
            "reason": "、".join(reasons),
        })

    # スコア降順でソートし上位5件
    results.sort(key=lambda x: x["score"], reverse=True)
    top5 = results[:5]

    # ランク付け
    for i, item in enumerate(top5):
        item["rank"] = i + 1

    return top5


# デフォルトの栽培適性マスタ（masters.jsonが存在しない場合のフォールバック）
DEFAULT_MASTERS = [
    {
        "crop_name": "大根",
        "suitable_soil_types": ["loam", "sandy", "silt"],
        "max_abandonment_level": 3,
        "suitable_drainage": ["moderate", "good"],
        "suitable_slopes": ["flat", "gentle"],
    },
    {
        "crop_name": "じゃがいも",
        "suitable_soil_types": ["loam", "sandy"],
        "max_abandonment_level": 3,
        "suitable_drainage": ["good"],
        "suitable_slopes": ["flat", "gentle", "moderate"],
    },
    {
        "crop_name": "にんじん",
        "suitable_soil_types": ["loam", "sandy", "silt"],
        "max_abandonment_level": 2,
        "suitable_drainage": ["moderate", "good"],
        "suitable_slopes": ["flat", "gentle"],
    },
    {
        "crop_name": "キャベツ",
        "suitable_soil_types": ["loam", "clay", "silt"],
        "max_abandonment_level": 3,
        "suitable_drainage": ["moderate"],
        "suitable_slopes": ["flat", "gentle"],
    },
    {
        "crop_name": "さつまいも",
        "suitable_soil_types": ["sandy", "loam"],
        "max_abandonment_level": 4,
        "suitable_drainage": ["good"],
        "suitable_slopes": ["flat", "gentle", "moderate"],
    },
    {
        "crop_name": "玉ねぎ",
        "suitable_soil_types": ["loam", "silt"],
        "max_abandonment_level": 2,
        "suitable_drainage": ["moderate", "good"],
        "suitable_slopes": ["flat"],
    },
    {
        "crop_name": "ほうれん草",
        "suitable_soil_types": ["loam", "clay", "silt"],
        "max_abandonment_level": 2,
        "suitable_drainage": ["moderate"],
        "suitable_slopes": ["flat", "gentle"],
    },
    {
        "crop_name": "ブロッコリー",
        "suitable_soil_types": ["loam", "clay"],
        "max_abandonment_level": 3,
        "suitable_drainage": ["moderate", "good"],
        "suitable_slopes": ["flat", "gentle"],
    },
]
