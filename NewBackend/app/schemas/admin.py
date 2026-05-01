from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class DashboardData(BaseModel):
    total_users: int = 0
    total_figures: int = 0
    total_fences: int = 0
    total_conversations: int = 0
    total_tracks: int = 0
    active_users_today: int = 0
    conversations_today: int = 0


class AdminUserResponse(BaseModel):
    id: int
    username: str
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "user"
    is_active: bool = True
    last_login_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminConversationResponse(BaseModel):
    id: int
    user_id: int
    figure_id: int
    role: str
    content: str
    created_at: datetime
    username: Optional[str] = None
    figure_name: Optional[str] = None

    model_config = {"from_attributes": True}


class SystemConfigResponse(BaseModel):
    id: int
    config_key: str
    config_value: str
    description: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class SystemConfigUpdate(BaseModel):
    config_value: str


class AdminLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    detail: Optional[Any] = None
    ip_address: Optional[str] = None
    created_at: datetime
    username: Optional[str] = None

    model_config = {"from_attributes": True}


class GlobalStats(BaseModel):
    total_users: int = 0
    total_figures: int = 0
    total_fences: int = 0
    total_tracks: int = 0
    total_conversations: int = 0
    active_users_today: int = 0
    active_users_week: int = 0
    conversations_today: int = 0
    tracks_today: int = 0
