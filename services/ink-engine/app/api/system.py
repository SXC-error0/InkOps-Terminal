"""系统状态 API"""
import logging
from fastapi import APIRouter

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# 内存事件存储 (后续可落库)
_events: list[dict] = []


def add_event(event_type: str, message: str) -> None:
    """向事件流添加记录"""
    import uuid
    from datetime import datetime

    _events.append({
        "id": str(uuid.uuid4()),
        "type": event_type,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
    })
    # 最多保留 500 条
    if len(_events) > 500:
        _events.pop(0)


@router.get("/mode")
async def detect_system_mode() -> dict:
    """检测系统运行模式"""
    checks = {
        "llm": settings.is_llm_available,
        "device": False,  # 暂无设备检测
        "network": True,  # 假设有网络
    }

    if all(checks.values()):
        mode = "full"
        label = "全部系统正常"
    elif not checks["llm"]:
        mode = "no_ai"
        label = "AI 引擎离线 - 使用手动编辑模式"
    elif not checks["device"]:
        mode = "no_device"
        label = "设备未连接 - 仅预览模式"
    elif not checks["network"]:
        mode = "offline"
        label = "离线模式 - 仅本地可用"
    else:
        mode = "safe_mode"
        label = "安全模式 - 仅预览和手动推送"

    return {"mode": mode, "label": label}


@router.get("/events")
async def get_events(limit: int = 20) -> list[dict]:
    """获取事件流"""
    return _events[-limit:][::-1]  # 最新在前
