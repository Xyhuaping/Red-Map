from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class FenceTrigger(Base):
    __tablename__ = "fence_triggers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    fence_id = Column(Integer, ForeignKey("geo_fences.id"), nullable=False, index=True)
    figure_id = Column(Integer, ForeignKey("red_figures.id"), nullable=True)
    trigger_type = Column(String(20), default="heartbeat", nullable=False)
    latitude = Column(DECIMAL(10, 7), nullable=True)
    longitude = Column(DECIMAL(10, 7), nullable=True)
    is_notified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="triggers", lazy="selectin")
    fence = relationship("GeoFence", lazy="selectin")
    figure = relationship("RedFigure", lazy="selectin")
