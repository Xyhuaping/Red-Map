from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.services.figures import FigureService
from app.schemas.figures import (
    RedFigureCreate, RedFigureUpdate, RedFigureResponse, FigureSearchParams,
)
from app.schemas.common import ResponseBase, PaginatedResponse

router = APIRouter()


@router.get("", response_model=ResponseBase[list[RedFigureResponse]])
def get_figures(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    service = FigureService(db)
    figures = service.get_figures(skip, limit)
    return ResponseBase(data=figures)


@router.get("/search", response_model=PaginatedResponse)
def search_figures(
    keyword: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = FigureService(db)
    params = FigureSearchParams(keyword=keyword, category=category, page=page, page_size=page_size)
    return service.search_figures(params)


@router.get("/{figure_id}", response_model=ResponseBase[RedFigureResponse])
def get_figure(figure_id: int, db: Session = Depends(get_db)):
    service = FigureService(db)
    figure = service.get_figure(figure_id)
    return ResponseBase(data=figure)


@router.post("", response_model=ResponseBase[RedFigureResponse], status_code=201)
def create_figure(
    data: RedFigureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = FigureService(db)
    figure = service.create_figure(data)
    return ResponseBase(data=figure, message="创建成功")


@router.put("/{figure_id}", response_model=ResponseBase[RedFigureResponse])
def update_figure(
    figure_id: int,
    data: RedFigureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = FigureService(db)
    figure = service.update_figure(figure_id, data)
    return ResponseBase(data=figure, message="更新成功")


@router.delete("/{figure_id}", response_model=ResponseBase)
def delete_figure(
    figure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = FigureService(db)
    service.delete_figure(figure_id)
    return ResponseBase(message="删除成功")
