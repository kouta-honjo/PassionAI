"""
Pydantic スキーマ定義
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FieldCreate(BaseModel):
    name: str
    address: str
    prefecture: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_sqm: Optional[float] = None


class CropSuitabilityResponse(BaseModel):
    crop_name: str
    score: int
    rank: int
    reason: Optional[str] = None

    model_config = {"from_attributes": True}


class AnalysisResponse(BaseModel):
    id: int
    field_id: int
    photo_path: str
    analyzed_at: Optional[datetime] = None
    soil_type: Optional[str] = None
    soil_color: Optional[str] = None
    vegetation: Optional[list[str]] = None
    abandonment_level: Optional[int] = None
    drainage_estimate: Optional[str] = None
    slope: Optional[str] = None
    stones_present: bool = False
    raw_description: Optional[str] = None
    confidence: Optional[float] = None
    crop_suitability: list[CropSuitabilityResponse] = []

    model_config = {"from_attributes": True}


class FieldResponse(BaseModel):
    id: int
    name: str
    address: str
    prefecture: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_sqm: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FieldDetailResponse(FieldResponse):
    analyses: list[AnalysisResponse] = []


class FieldListItemResponse(FieldResponse):
    latest_analysis: Optional[AnalysisResponse] = None
