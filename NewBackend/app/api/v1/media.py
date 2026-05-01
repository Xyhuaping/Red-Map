from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.services.media import MediaService
from app.schemas.media import FileUploadResponse, FileListParams
from app.schemas.common import ResponseBase, PaginatedResponse

router = APIRouter()


@router.post("/upload", response_model=ResponseBase[FileUploadResponse], status_code=201)
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = MediaService(db)
    result = service.upload_file(file, current_user.id)
    return ResponseBase(data=result, message="上传成功")


@router.get("", response_model=PaginatedResponse)
def get_files(
    file_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = MediaService(db)
    params = FileListParams(file_type=file_type, page=page, page_size=page_size)
    return service.get_files(params)


@router.delete("/{file_id}", response_model=ResponseBase)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = MediaService(db)
    service.delete_file(file_id)
    return ResponseBase(message="删除成功")
