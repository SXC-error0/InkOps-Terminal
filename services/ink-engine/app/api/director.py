"""Display Director API"""
import logging
from fastapi import APIRouter

from app.agents.director import get_recommendation, auto_push_if_needed

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/recommendation")
async def get_display_recommendation() -> dict:
    """获取 AI Display Director 推荐: 当前最该显示哪一页"""
    return get_recommendation()


@router.post("/auto-push")
async def trigger_auto_push() -> dict:
    """手动触发自动推送检查 (调度器也会周期调用)"""
    pushed = auto_push_if_needed()
    return {"pushed": pushed}
