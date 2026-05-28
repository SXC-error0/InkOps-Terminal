"""Terminal 作战终端 API"""
import logging
from fastapi import APIRouter
from sqlmodel import Session, select

from app.models.database import engine
from app.models.project import Project
from app.connectors.github import get_today_commits

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/summary")
async def get_terminal_summary() -> dict:
    """获取终端状态摘要"""
    with Session(engine) as session:
        projects = session.exec(select(Project).where(Project.status == "active")).all()

    active_project = projects[0].name if projects else "InkOps Terminal"

    # GitHub 数据
    github = await get_today_commits()

    # 计算总体 MVP 进度
    if projects:
        mvp_progress = sum(p.progress for p in projects) // max(len(projects), 1)
        current_focus = projects[0].goal or "先交付, 再完美."
    else:
        mvp_progress = 15
        current_focus = "完成 Quest 卷轴上屏"

    return {
        "activeProject": active_project,
        "githubStreak": github["streak"],
        "todayCommits": github["count"],
        "serverStatus": "ONLINE",
        "mvpProgress": mvp_progress,
        "currentFocus": current_focus,
    }
