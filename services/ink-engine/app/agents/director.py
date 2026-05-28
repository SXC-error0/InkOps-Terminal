"""AI Display Director: 页面优先级决策引擎"""
import logging
from sqlmodel import Session, select

from app.models.database import engine
from app.models.page import Page
from app.api.system import add_event

logger = logging.getLogger(__name__)

# 优先级中文标签
PRIORITY_LABELS = {
    0: "紧急异常",
    1: "关键成果",
    2: "日常核心",
    3: "社交互动",
    4: "轻内容",
    5: "待机页面",
}


def get_recommendation() -> dict:
    """基于规则的 Display Director Lite
    返回推荐页面、理由和是否自动推送
    """
    with Session(engine) as session:
        # 获取所有 ready 状态的候选页面, 按优先级排序
        candidates = session.exec(
            select(Page)
            .where(Page.status == "ready")
            .order_by(Page.priority.asc(), Page.created_at.desc())  # type: ignore[arg-type]
        ).all()

    if not candidates:
        return {
            "recommended": None,
            "auto_push": False,
            "reason": "无候选页面, 等待内容生成",
            "candidate_count": 0,
            "candidates": [],
        }

    top = candidates[0]

    # 自动推送规则: P0 且不可中断 → 立即推送
    auto_push = top.priority == 0 and not top.interruptible

    # 生成推荐理由
    priority_label = PRIORITY_LABELS.get(top.priority, "未知")
    reason = _build_reason(top, priority_label, candidates)

    return {
        "recommended": top.model_dump(),
        "auto_push": auto_push,
        "reason": reason,
        "candidate_count": len(candidates),
        "candidates": [p.model_dump() for p in candidates[:10]],
    }


def _build_reason(top: Page, label: str, all_candidates: list[Page]) -> str:
    """构造 AI 风格的推荐理由"""
    template_names = {
        "SYSTEM_ALERT": "系统告警",
        "QUEST_SCROLL": "任务卷轴",
        "TERMINAL_STATUS": "作战终端",
        "LAUNCH_PANEL": "发射台",
        "POSTCARD": "电子明信片",
        "RELEASE_NEWS": "发布战报",
    }
    template_cn = template_names.get(top.template_id, top.template_id)

    match top.priority:
        case 0:
            return f"检测到{label}: {top.trigger_source}, 建议立即显示 {template_cn} 页面"
        case 1:
            return f"关键成果待展示: {top.reason}, 推荐显示 {template_cn}"
        case 2:
            return f"日常核心页面 {template_cn} 已就绪, 共 {len(all_candidates)} 个候选"
        case 3:
            return f"新的社交互动: {top.reason}, 空闲时可展示"
        case _:
            return f"候选页面 {template_cn} (P{top.priority}), 共 {len(all_candidates)} 个可选"


def auto_push_if_needed() -> bool:
    """执行自动推送检查: 如果存在 P0 不可中断页面, 自动标记为 pushed"""
    rec = get_recommendation()
    if rec["auto_push"] and rec["recommended"]:
        page_id = rec["recommended"]["id"]
        with Session(engine) as session:
            page = session.get(Page, page_id)
            if page:
                from datetime import datetime
                page.status = "pushed"
                page.pushed_at = datetime.utcnow()
                session.add(page)
                session.commit()
                add_event("alert", f"自动推送: {page.template_id} (P0 告警)")
                logger.info("Director: 自动推送 P0 页面 %s", page_id)
                return True
    return False
