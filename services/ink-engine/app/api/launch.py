"""Launch 发射台 API"""
import logging
from fastapi import APIRouter, HTTPException
from sqlmodel import Session

from app.models.database import engine
from app.models.project import Project
from app.schemas.launch import ProjectRequest, BriefingRequest
from app.agents.launch_coach import generate_launch_payload
from app.api.system import add_event

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/projects")
async def create_project(request: ProjectRequest) -> dict:
    """创建产品项目"""
    with Session(engine) as session:
        project = Project(name=request.name, status="active", progress=0)
        session.add(project)
        session.commit()
        session.refresh(project)
        add_event("launch", f"项目创建: {project.name}")
        return project.model_dump()


@router.get("/projects")
async def list_projects() -> list[dict]:
    """列出所有项目"""
    from sqlmodel import select
    with Session(engine) as session:
        projects = session.exec(select(Project)).all()
        return [p.model_dump() for p in projects]


@router.post("/{project_id}/briefing")
async def get_briefing(project_id: str, request: BriefingRequest = BriefingRequest()) -> dict:
    """生成 AI 发射台简报"""
    with Session(engine) as session:
        project = session.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="项目不存在")

        # AI 生成发射台 payload
        payload = await generate_launch_payload(
            project_name=project.name,
            raw_text=request.raw_text,
        )

        # 更新项目进度信息
        project.progress = payload.progress
        project.goal = payload.today_instruction
        session.add(project)
        session.commit()

    return {
        "project": project.model_dump(),
        "payload": payload.model_dump(),
        "today_instruction": payload.today_instruction,
        "countdown_days": payload.countdown_days,
        "blockers": payload.blockers,
    }
