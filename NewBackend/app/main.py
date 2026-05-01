import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.middleware import setup_logging, request_logging_middleware
from app.core.limiter import limiter
from app.core.exceptions import AppException
from app.core.exception_handlers import app_exception_handler, generic_exception_handler
from app.api.v1 import auth, figures, fences, chat, tracks, media, admin, triggers
from app.api.ws import chat as ws_chat

setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    debug=settings.DEBUG,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(request_logging_middleware)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(figures.router, prefix="/api/figures", tags=["红色人物"])
app.include_router(fences.router, prefix="/api/fences", tags=["围栏"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI对话"])
app.include_router(tracks.router, prefix="/api/tracks", tags=["轨迹"])

app.include_router(auth.router, prefix="/api/v1/auth", tags=["认证 v1"])
app.include_router(figures.router, prefix="/api/v1/figures", tags=["红色人物 v1"])
app.include_router(fences.router, prefix="/api/v1/fences", tags=["围栏 v1"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["AI对话 v1"])
app.include_router(tracks.router, prefix="/api/v1/tracks", tags=["轨迹 v1"])
app.include_router(media.router, prefix="/api/v1/media", tags=["文件管理"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["后台管理"])
app.include_router(triggers.router, prefix="/api/v1", tags=["围栏触发"])

app.include_router(ws_chat.router, prefix="/ws", tags=["WebSocket"])

media_dir = settings.media_root_abs
if os.path.isdir(media_dir):
    app.mount("/media", StaticFiles(directory=media_dir), name="media")


@app.get("/")
async def root():
    return {
        "message": f"欢迎使用{settings.APP_NAME}",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
