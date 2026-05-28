"""FastAPI 应用入口"""

import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import settings
from app.models.database import init_db
from app.api.system import add_event

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期: 启动时初始化数据库与目录, 注册定时监控"""
    global _scheduler
    settings.ensure_directories()
    init_db()
    add_event("system", "Ink Engine 启动")

    # 启动定时监控 (每 60 秒检测一次)
    from app.scheduler import run_all_health_checks
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(run_all_health_checks, "interval", seconds=60, id="health_check")
    _scheduler.start()
    logger.info("监控调度器已启动 (每 60 秒)")

    yield

    # 关闭调度器
    if _scheduler:
        _scheduler.shutdown(wait=False)
        logger.info("监控调度器已停止")


app = FastAPI(
    title="InkOps Terminal - Ink Engine",
    description="AI 驱动的墨水屏页面引擎",
    version="0.1.0",
    lifespan=lifespan,
)

# 允许上位机跨域访问 (Tauri 开发端口 1420, Vite 开发端口 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "tauri://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "online",
        "service": "ink-engine",
        "version": "0.1.0",
        "llm_available": settings.is_llm_available,
    }


# 注册路由模块 (后续逐步挂载)
from app.api.router import api_router
app.include_router(api_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
