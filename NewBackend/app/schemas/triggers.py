from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FenceTriggerCreate(BaseModel):
    fence_id: int
    figure_id: Optional[int] = None
    trigger_type: str = Field("heartbeat", pattern="^(heartbeat|manual)$")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_notified: bool = False


class FenceTriggerResponse(BaseModel):
    id: int
    user_id: int
    fence_id: int
    figure_id: Optional[int] = None
    trigger_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_notified: bool
    created_at: datetime
    fence: Optional["FenceTriggerFenceBrief"] = None
    figure: Optional["FenceTriggerFigureBrief"] = None

    model_config = {"from_attributes": True}


class FenceTriggerFenceBrief(BaseModel):
    id: int
    name: str
    shape_type: str
    trigger_prompt: Optional[str] = None

    model_config = {"from_attributes": True}


class FenceTriggerFigureBrief(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ActiveFenceCompact(BaseModel):
    id: int
    name: str
    shape_type: str
    center_lng: Optional[float] = None
    center_lat: Optional[float] = None
    radius: Optional[int] = None
    polygon_coords: Optional[list[dict]] = None
    trigger_prompt: Optional[str] = None
    figure_id: Optional[int] = None
    figure_name: Optional[str] = None
    figure_avatar: Optional[str] = None

    model_config = {"from_attributes": True}


FenceTriggerResponse.model_rebuild()
