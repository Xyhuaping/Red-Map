from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PolygonCoord(BaseModel):
    lng: float = Field(..., ge=-180, le=180)
    lat: float = Field(..., ge=-90, le=90)


class GeoFenceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    shape_type: str = Field("circle", pattern="^(circle|polygon)$")
    figure_id: Optional[int] = None
    center_lng: Optional[float] = Field(None, ge=-180, le=180)
    center_lat: Optional[float] = Field(None, ge=-90, le=90)
    radius: Optional[int] = Field(None, ge=1)
    polygon_coords: Optional[list[PolygonCoord]] = None
    audio_url: Optional[str] = None
    trigger_prompt: Optional[str] = None
    description: Optional[str] = None
    color: str = "#D93025"
    is_active: bool = True


class GeoFenceCreate(GeoFenceBase):
    pass


class GeoFenceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    shape_type: Optional[str] = Field(None, pattern="^(circle|polygon)$")
    figure_id: Optional[int] = None
    center_lng: Optional[float] = Field(None, ge=-180, le=180)
    center_lat: Optional[float] = Field(None, ge=-90, le=90)
    radius: Optional[int] = Field(None, ge=1)
    polygon_coords: Optional[list[PolygonCoord]] = None
    audio_url: Optional[str] = None
    trigger_prompt: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


class GeoFenceResponse(GeoFenceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    figure: Optional["RedFigureBrief"] = None

    model_config = {"from_attributes": True}


class RedFigureBrief(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class FenceCheckRequest(BaseModel):
    longitude: float = Field(..., ge=-180, le=180)
    latitude: float = Field(..., ge=-90, le=90)


class FenceCheckResponse(BaseModel):
    triggered: bool
    fence: Optional[GeoFenceResponse] = None
    figure: Optional[RedFigureBrief] = None
    distance: Optional[float] = None


GeoFenceResponse.model_rebuild()
