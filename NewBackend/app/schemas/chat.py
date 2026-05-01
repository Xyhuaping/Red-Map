from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChatMessage(BaseModel):
    figure_id: int
    message: str = Field(..., min_length=1, max_length=2000)
    history: Optional[list[dict]] = []


class ChatResponse(BaseModel):
    message: str
    audio_url: Optional[str] = None


class ChatStartResponse(BaseModel):
    figure_id: int
    figure_name: str
    initial_message: str
    audio_url: Optional[str] = None


class ChatHistoryItem(BaseModel):
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class WsChatMessage(BaseModel):
    figure_id: int
    message: str = Field(..., min_length=1, max_length=2000)


class WsChatChunk(BaseModel):
    type: str = "chunk"
    text: str


class WsChatDone(BaseModel):
    type: str = "done"
    full_text: str


class WsChatError(BaseModel):
    type: str = "error"
    message: str
