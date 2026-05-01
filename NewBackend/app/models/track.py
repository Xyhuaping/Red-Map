from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserTrack(Base):
    __tablename__ = "user_tracks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    fence_id = Column(Integer, ForeignKey("geo_fences.id"), nullable=False, index=True)
    figure_id = Column(Integer, ForeignKey("red_figures.id"), nullable=True)
    triggered_at = Column(DateTime, server_default=func.now(), nullable=False)
    interaction_duration = Column(Integer, default=0)
    conversation_rounds = Column(Integer, default=0)

    user = relationship("User", back_populates="tracks", lazy="selectin")
    fence = relationship("GeoFence", back_populates="tracks", lazy="selectin")
    figure = relationship("RedFigure", back_populates="tracks", lazy="selectin")
