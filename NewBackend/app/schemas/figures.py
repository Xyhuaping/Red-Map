from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RedFigureBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    title: Optional[str] = Field(None, max_length=100)
    category: str = Field("figure", pattern="^(figure|site)$")
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    location: Optional[str] = Field(None, max_length=100)
    brief_intro: Optional[str] = None
    full_bio: Optional[str] = None
    avatar_url: Optional[str] = None
    vr_model_url: Optional[str] = None
    prompt_template: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class RedFigureCreate(RedFigureBase):
    pass


class RedFigureUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    title: Optional[str] = None
    category: Optional[str] = Field(None, pattern="^(figure|site)$")
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    location: Optional[str] = None
    brief_intro: Optional[str] = None
    full_bio: Optional[str] = None
    avatar_url: Optional[str] = None
    vr_model_url: Optional[str] = None
    prompt_template: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class RedFigureResponse(RedFigureBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class FigureSearchParams(BaseModel):
    keyword: Optional[str] = None
    category: Optional[str] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size
