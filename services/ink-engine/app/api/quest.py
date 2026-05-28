"""Quest 任务卷轴 API"""
import logging
from fastapi import APIRouter, HTTPException
from sqlmodel import Session

from app.schemas.quest import QuestRequest, QuestResponse, QuestPayload
from app.agents.quest_writer import generate_quest
from app.render.quest_scroll import get_quest_renderer
from app.models.database import engine
from app.models.task import Task
from app.models.page import Page
from app.api.system import add_event

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=QuestResponse)
async def create_quest(request: QuestRequest) -> QuestResponse:
    """生成 RPG 任务卷轴: AI 结构化输出 + 模板渲染"""
    # 1. AI 生成结构化任务 payload
    try:
        payload: QuestPayload = await generate_quest(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Quest 生成异常")
        raise HTTPException(status_code=500, detail=f"AI 引擎异常: {str(e)}")

    # 2. 渲染图片
    try:
        renderer = get_quest_renderer()
        image_path = renderer.render(payload)
    except Exception as e:
        logger.exception("Quest 渲染异常")
        raise HTTPException(status_code=500, detail=f"页面渲染失败: {str(e)}")

    # 3. 持久化任务记录 + 页面记录 (在 session 内提取 id)
    with Session(engine) as session:
        task = Task(
            date=request.raw_text[:10],
            raw_text=request.raw_text,
            persona=request.persona,
            quest_payload=payload.model_dump(),
        )
        session.add(task)

        page = Page(
            type="quest",
            template_id="QUEST_SCROLL",
            priority=2,
            urgency="normal",
            trigger_source="user",
            reason="用户手动生成每日任务卷轴",
            payload=payload.model_dump(),
            image_path=str(image_path),
            status="ready",
        )
        session.add(page)
        session.commit()
        session.refresh(page)
        task_id = task.id
        page_id = page.id

    add_event("quest", f"任务卷轴生成: {payload.main_quest}")
    return QuestResponse(
        task_id=task_id,
        page_id=page_id,
        payload=payload,
        image_path=str(image_path),
    )
