import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "fanchangjiang_ar"

    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 43200

    ZHIPU_API_KEY: str = ""
    AMAP_KEY: str = ""
    AMAP_SECURITY_CODE: str = ""

    APP_NAME: str = "红色文化AR教育平台"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    MEDIA_ROOT: str = "./media"
    MAX_UPLOAD_SIZE_MB: int = 50

    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "./logs"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def media_root_abs(self) -> str:
        return os.path.abspath(self.MEDIA_ROOT)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
