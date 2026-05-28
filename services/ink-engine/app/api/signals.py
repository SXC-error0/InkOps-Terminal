"""Signals 信号箱 API: 留言二维码 + 明信片生成"""
import logging
import uuid
import qrcode
from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select

from app.models.database import engine
from app.models.message import Message
from app.models.page import Page
from app.render.postcard import get_postcard_renderer
from app.api.system import add_event
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# 简易敏感词列表 (MVP)
_BLOCKED_WORDS = ["色情", "赌博", "广告", "诈骗", "政治敏感"]


def _safety_check(text: str) -> tuple[bool, str]:
    """内容安全检查: 返回 (通过, 原因)"""
    if len(text) > 80:
        return False, "留言超过 80 字限制"
    for word in _BLOCKED_WORDS:
        if word in text:
            return False, f"内容包含敏感词: {word}"
    return True, "ok"


@router.get("/qr")
async def generate_qr() -> dict:
    """生成留言入口二维码图片"""
    # 生成唯一留言密钥
    msg_key = str(uuid.uuid4())[:8]

    # 二维码内容: 前端留言页面 URL (本机)
    qr_data = f"inkops://message?key={msg_key}"

    qr_img = qrcode.make(qr_data)
    qr_path = settings.PREVIEWS_DIR / f"qr_msg_{msg_key}.png"
    qr_img.save(qr_path)

    logger.info("留言二维码已生成: %s", qr_path)
    add_event("message", f"留言二维码已生成 (key={msg_key})")

    return {
        "key": msg_key,
        "qr_data": qr_data,
        "qr_image_path": str(qr_path),
    }


@router.post("/message")
async def submit_message(data: dict) -> dict:
    """提交访客留言, AI 审核后生成明信片"""
    sender = (data.get("sender_name") or "").strip()
    text = (data.get("text") or "").strip()

    if not text:
        raise HTTPException(status_code=422, detail="留言内容不能为空")

    # 安全过滤
    passed, reason = _safety_check(text)
    safety_status = "approved" if passed else "rejected"

    with Session(engine) as session:
        msg = Message(
            sender_name=sender if sender else None,
            text=text,
            safety_status=safety_status,
        )
        session.add(msg)
        session.commit()
        session.refresh(msg)

        if passed:
            # 生成 POSTCARD 页面
            renderer = get_postcard_renderer()
            payload = {
                "text": text,
                "sender_name": sender or "Anonymous",
                "created_at": str(msg.created_at),
            }
            image_path = renderer.render(payload)

            page = Page(
                type="postcard",
                template_id="POSTCARD",
                priority=3,
                urgency="normal",
                trigger_source="signal",
                reason=f"来自 {sender or '匿名'} 的留言",
                payload=payload,
                image_path=str(image_path),
                status="ready",
            )
            session.add(page)
            msg.page_id = page.id
            session.add(msg)
            session.commit()

            add_event("message", f"新留言来自 {sender or '匿名'}: {text[:20]}...")
            return {"message": msg.model_dump(), "page_id": page.id, "approved": True}
        else:
            add_event("system", f"留言被拒绝: {reason}")
            return {"message": msg.model_dump(), "approved": False, "reason": reason}


@router.get("/messages")
async def get_messages(limit: int = 20) -> list[dict]:
    """获取留言列表"""
    with Session(engine) as session:
        msgs = session.exec(
            select(Message).order_by(Message.created_at.desc()).limit(limit)  # type: ignore[arg-type]
        ).all()
    return [m.model_dump() for m in msgs]
