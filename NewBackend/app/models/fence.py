from sqlalchemy import Column, Integer, String, Text, Boolean, DECIMAL, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class GeoFence(Base):
    __tablename__ = "geo_fences"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    shape_type = Column(String(20), default="circle", nullable=False, index=True)
    figure_id = Column(Integer, ForeignKey("red_figures.id"), nullable=True)
    center_lng = Column(DECIMAL(10, 7), nullable=True)
    center_lat = Column(DECIMAL(10, 7), nullable=True)
    radius = Column(Integer, nullable=True)
    polygon_coords = Column(JSON, nullable=True)
    audio_url = Column(String(255))
    trigger_prompt = Column(Text)
    description = Column(Text, nullable=True)
    color = Column(String(20), default="#D93025", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    figure = relationship("RedFigure", back_populates="fences", lazy="selectin")
    tracks = relationship("UserTrack", back_populates="fence", lazy="selectin")
