import os
import re
from datetime import datetime
from typing import Optional


def generate_stored_filename(original_name: str, prefix: str = "file") -> str:
    ext = ""
    if "." in original_name:
        ext = original_name.rsplit(".", 1)[-1].lower()
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    import uuid
    random_suffix = uuid.uuid4().hex[:6]
    return f"{prefix}_{timestamp}_{random_suffix}.{ext}" if ext else f"{prefix}_{timestamp}_{random_suffix}"


def ensure_directory(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path


def sanitize_filename(filename: str) -> str:
    filename = re.sub(r'[^\w\s.-]', '', filename)
    filename = re.sub(r'[\s]+', '_', filename)
    return filename


def get_file_extension(filename: str) -> Optional[str]:
    if "." in filename:
        return filename.rsplit(".", 1)[-1].lower()
    return None
