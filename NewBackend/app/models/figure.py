from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class RedFigure(Base):
    __tablename__ = "red_figures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, index=True)
    title = Column(String(100))
    category = Column(String(20), default="figure", nullable=False)
    birth_year = Column(Integer)
    death_year = Column(Integer)
    location = Column(String(100))
    brief_intro = Column(Text)
    full_bio = Column(Text)
    avatar_url = Column(String(255))
    vr_model_url = Column(String(255))
    prompt_template = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    fences = relationship("GeoFence", back_populates="figure", lazy="selectin")
    tracks = relationship("UserTrack", back_populates="figure", lazy="selectin")
    conversations = relationship("Conversation", back_populates="figure", lazy="selectin")
