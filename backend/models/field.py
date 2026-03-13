"""
SQLAlchemy モデル定義
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    address = Column(Text, nullable=False)
    prefecture = Column(Text, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    area_sqm = Column(Float)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    analyses = relationship("Analysis", back_populates="field", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    photo_path = Column(Text, nullable=False)
    analyzed_at = Column(DateTime, default=_utcnow)
    soil_type = Column(Text)
    soil_color = Column(Text)
    vegetation = Column(Text)  # JSON array stored as string
    abandonment_level = Column(Integer)
    drainage_estimate = Column(Text)
    slope = Column(Text)
    stones_present = Column(Integer, default=0)
    raw_description = Column(Text)
    confidence = Column(Float)
    created_at = Column(DateTime, default=_utcnow)

    field = relationship("Field", back_populates="analyses")
    crop_suitability = relationship("CropSuitability", back_populates="analysis", cascade="all, delete-orphan")


class CropSuitability(Base):
    __tablename__ = "crop_suitability"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(Text, nullable=False)
    score = Column(Integer, nullable=False)
    rank = Column(Integer, nullable=False)
    reason = Column(Text)
    created_at = Column(DateTime, default=_utcnow)

    analysis = relationship("Analysis", back_populates="crop_suitability")
