import os
import uuid
import shutil
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import NotFoundException, ValidationException
from app.models.uploaded_file import UploadedFile
from app.schemas.media import FileUploadResponse, FileListParams
from app.schemas.common import PaginatedResponse


ALLOWED_EXTENSIONS = {
    "image": {"jpg", "jpeg", "png", "webp"},
    "audio": {"mp3", "wav", "ogg"},
    "model": {"glb", "gltf", "vrm"},
}

MAX_SIZES = {
    "image": 5 * 1024 * 1024,
    "audio": 20 * 1024 * 1024,
    "model": 50 * 1024 * 1024,
}

TYPE_PREFIXES = {
    "image": "img",
    "audio": "aud",
    "model": "mdl",
}


class MediaService:
    def __init__(self, db: Session):
        self.db = db

    def upload_file(self, file, uploader_id: int) -> FileUploadResponse:
        original_name = file.filename
        ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""

        file_type = self._detect_file_type(ext)
        if not file_type:
            raise ValidationException(f"不支持的文件格式: {ext}")

        content = file.file.read()
        file_size = len(content)
        max_size = MAX_SIZES.get(file_type, settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024)
        if file_size > max_size:
            raise ValidationException(f"文件大小超过限制: {max_size // 1024 // 1024}MB")

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_suffix = uuid.uuid4().hex[:6]
        prefix = TYPE_PREFIXES.get(file_type, "file")
        stored_name = f"{prefix}_{timestamp}_{random_suffix}.{ext}"

        type_dir = os.path.join(settings.media_root_abs, f"{file_type}s")
        os.makedirs(type_dir, exist_ok=True)
        file_path = os.path.join(type_dir, stored_name)

        with open(file_path, "wb") as f:
            f.write(content)

        relative_path = f"{file_type}s/{stored_name}"
        db_file = UploadedFile(
            original_name=original_name,
            stored_name=stored_name,
            file_path=relative_path,
            file_type=file_type,
            file_size=file_size,
            mime_type=file.content_type,
            uploader_id=uploader_id,
        )
        self.db.add(db_file)
        self.db.commit()
        self.db.refresh(db_file)

        resp = FileUploadResponse.model_validate(db_file)
        resp.url = f"/media/{relative_path}"
        return resp

    def get_files(self, params: FileListParams) -> PaginatedResponse:
        query = self.db.query(UploadedFile)
        if params.file_type:
            query = query.filter(UploadedFile.file_type == params.file_type)

        total = query.count()
        files = query.order_by(UploadedFile.created_at.desc()).offset(
            (params.page - 1) * params.page_size
        ).limit(params.page_size).all()

        items = []
        for f in files:
            resp = FileUploadResponse.model_validate(f)
            resp.url = f"/media/{f.file_path}"
            items.append(resp)

        return PaginatedResponse.create(
            items=items, total=total, page=params.page, page_size=params.page_size
        )

    def delete_file(self, file_id: int) -> bool:
        db_file = self.db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
        if not db_file:
            raise NotFoundException("文件不存在")

        full_path = os.path.join(settings.media_root_abs, db_file.file_path)
        if os.path.exists(full_path):
            os.remove(full_path)

        self.db.delete(db_file)
        self.db.commit()
        return True

    def _detect_file_type(self, ext: str) -> str | None:
        for file_type, extensions in ALLOWED_EXTENSIONS.items():
            if ext in extensions:
                return file_type
        return None
