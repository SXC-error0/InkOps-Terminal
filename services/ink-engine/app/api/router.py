"""API 路由聚合"""
from fastapi import APIRouter

from app.api.quest import router as quest_router
from app.api.pages import router as pages_router
from app.api.system import router as system_router
from app.api.devices import router as devices_router
from app.api.launch import router as launch_router
from app.api.terminal import router as terminal_router
from app.api.monitors import router as monitors_router
from app.api.signals import router as signals_router
from app.api.director import router as director_router

api_router = APIRouter()

api_router.include_router(quest_router, prefix="/quest", tags=["Quest"])
api_router.include_router(pages_router, prefix="/pages", tags=["Pages"])
api_router.include_router(system_router, prefix="/system", tags=["System"])
api_router.include_router(devices_router, prefix="/devices", tags=["Devices"])
api_router.include_router(launch_router, prefix="/launch", tags=["Launch"])
api_router.include_router(terminal_router, prefix="/terminal", tags=["Terminal"])
api_router.include_router(monitors_router, prefix="", tags=["Monitors"])
api_router.include_router(signals_router, prefix="/signals", tags=["Signals"])
api_router.include_router(director_router, prefix="/director", tags=["Director"])
