from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TrackCreate(BaseModel):
    fence_id: int
    figure_id: Optional[int] = None
    interaction_duration: Optional[int] = Field(0, ge=0)
    conversation_rounds: Optional[int] = Field(0, ge=0)


class TrackResponse(BaseModel):
    id: int
    fence_id: int
    figure_id: Optional[int] = None
    triggered_at: datetime
    interaction_duration: Optional[int] = 0
    conversation_rounds: Optional[int] = 0

    model_config = {"from_attributes": True}


class TrackStats(BaseModel):
    total_visits: int = 0
    unique_figures: int = 0
    total_duration: int = 0
    total_rounds: int = 0
    today_visits: int = 0
    week_visits: int = 0


class AdminTrackResponse(TrackResponse):
    user_id: int
    username: Optional[str] = None

    model_config = {"from_attributes": True}
