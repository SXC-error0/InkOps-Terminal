"""页面管理 API"""
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from app.models.database import engine
from app.models.page import Page
from app.models.display_log import DisplayLog
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/current")
async def get_current_page():
    """获取当前显示页与待推送页"""
    with Session(engine) as session:
        pushed = session.exec(
            select(Page)
            .where(Page.status == "pushed")
            .order_by(Page.pushed_at.desc())  # type: ignore[arg-type]
            .limit(1)
        ).first()

        candidates = session.exec(
            select(Page)
            .where(Page.status == "ready")
            .order_by(Page.priority.asc(), Page.created_at.desc())  # type: ignore[arg-type]
            .limit(10)
        ).all()

    return {
        "current": pushed.model_dump() if pushed else None,
        "candidates": [p.model_dump() for p in candidates],
    }


@router.get("/history")
async def get_page_history(
    limit: int = Query(default=20, ge=1, le=100),
    page_type: str | None = None,
):
    """获取历史页面"""
    with Session(engine) as session:
        stmt = select(Page).order_by(Page.created_at.desc())  # type: ignore[arg-type]
        if page_type:
            stmt = stmt.where(Page.type == page_type)  # type: ignore[assignment]
        stmt = stmt.limit(limit)  # type: ignore[assignment]
        pages = session.exec(stmt).all()

    return {"pages": [p.model_dump() for p in pages], "total": len(pages)}


@router.post("")
async def create_page(data: dict):
    """创建新页面 (前端直接调用)"""
    payload = data.get("payload", {})
    page = Page(
        type=data.get("type", "quest"),
        template_id=data.get("template_id", "QUEST_SCROLL"),
        priority=data.get("priority", 2),
        urgency=data.get("urgency", "normal"),
        interruptible=data.get("interruptible", True),
        display_duration=data.get("display_duration"),
        emotion=data.get("emotion"),
        trigger_source=data.get("trigger_source", "user"),
        reason=data.get("reason", ""),
        payload=payload,
        status="ready",
    )
    with Session(engine) as session:
        session.add(page)
        session.commit()
        session.refresh(page)
        return page.model_dump()


@router.get("/{page_id}")
async def get_page(page_id: str):
    """获取单个页面详情"""
    with Session(engine) as session:
        page = session.get(Page, page_id)
        if not page:
            raise HTTPException(status_code=404, detail="页面不存在")
    return page.model_dump()


@router.get("/{page_id}/image")
async def get_page_image(page_id: str):
    """获取页面的渲染图片"""
    with Session(engine) as session:
        page = session.get(Page, page_id)
        if not page:
            raise HTTPException(status_code=404, detail="页面不存在")
        if not page.image_path:
            raise HTTPException(status_code=404, detail="页面尚未渲染")

    path = Path(page.image_path)
    if not path.exists():
        # 尝试相对于项目根目录
        path = settings.PROJECT_ROOT / page.image_path
    if not path.exists():
        raise HTTPException(status_code=404, detail="图片文件不存在")

    return FileResponse(path, media_type="image/png")


@router.post("/{page_id}/push")
async def push_page(page_id: str, data: dict | None = None):
    """推送页面到设备, 记录推送日志"""
    device_id = (data or {}).get("device_id", "default")
    with Session(engine) as session:
        page = session.get(Page, page_id)
        if not page:
            raise HTTPException(status_code=404, detail="页面不存在")

        page.status = "pushed"
        page.pushed_at = None  # SQLModel will use default, let's import datetime
        from datetime import datetime
        page.pushed_at = datetime.utcnow()

        log = DisplayLog(
            page_id=page_id,
            device_id=device_id,
            result="success",
        )
        session.add(page)
        session.add(log)
        session.commit()

        return {"result": "success", "page": page.model_dump()}


def _render_page(template_id: str, payload: dict) -> Path:
    """根据模板 ID 路由到对应渲染器"""
    match template_id:
        case "QUEST_SCROLL":
            from app.schemas.quest import QuestPayload
            from app.render.quest_scroll import get_quest_renderer
            return get_quest_renderer().render(QuestPayload.model_validate(payload))
        case "TERMINAL_STATUS":
            from app.render.terminal_status import get_terminal_renderer
            return get_terminal_renderer().render(payload)
        case "LAUNCH_PANEL":
            from app.render.launch_panel import get_launch_renderer
            return get_launch_renderer().render(payload)
        case "SYSTEM_ALERT":
            from app.render.system_alert import get_alert_renderer
            return get_alert_renderer().render(payload)
        case "POSTCARD":
            from app.render.postcard import get_postcard_renderer
            return get_postcard_renderer().render(payload)
        case "RELEASE_NEWS":
            from app.render.release_news import get_release_renderer
            return get_release_renderer().render(payload)
        case _:
            raise ValueError(f"不支持的模板: {template_id}")


@router.post("/{page_id}/re-render")
async def re_render_page(page_id: str):
    """使用已有 payload 重新渲染页面图片"""
    with Session(engine) as session:
        page = session.get(Page, page_id)
        if not page:
            raise HTTPException(status_code=404, detail="页面不存在")

        try:
            image_path = _render_page(page.template_id, page.payload)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        page.image_path = str(image_path)
        page.status = "ready"
        session.add(page)
        session.commit()
        session.refresh(page)

    return page.model_dump()


@router.get("/{page_id}/bitmap")
async def get_page_bitmap(page_id: str):
    """获取页面的原始位图数据 (供 ESP8266 直接推屏)"""
    from fastapi.responses import Response
    from PIL import Image as PILImage
    from app.render.base import RendererBase

    with Session(engine) as session:
        page = session.get(Page, page_id)
        if not page:
            raise HTTPException(status_code=404, detail="页面不存在")
        if not page.image_path:
            raise HTTPException(status_code=404, detail="页面尚未渲染")

    path = Path(page.image_path)
    if not path.exists():
        path = settings.PROJECT_ROOT / page.image_path
    if not path.exists():
        raise HTTPException(status_code=404, detail="图片文件不存在")

    # 加载 PNG 并导出原始位图
    img = PILImage.open(path)
    base = RendererBase()
    bitmap = base.to_bitmap(img)

    return Response(
        content=bitmap,
        media_type="application/octet-stream",
        headers={"X-Bitmap-Size": str(len(bitmap)), "X-Dimensions": "400x300"},
    )
