from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FileUploadResponse(BaseModel):
    id: int
    original_name: str
    stored_name: str
    file_path: str
    file_type: str
    file_size: int
    mime_type: Optional[str] = None
    url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FileListParams(BaseModel):
    file_type: Optional[str] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
