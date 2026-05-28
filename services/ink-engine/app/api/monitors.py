"""Watcher 监控 API"""
import logging
from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select

from app.models.database import engine
from app.models.monitor import Monitor
from app.models.incident import Incident
from app.monitors.http_checker import check_http

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/monitors")
async def get_monitors() -> list[dict]:
    """获取所有监控"""
    with Session(engine) as session:
        monitors = session.exec(select(Monitor)).all()
    return [m.model_dump() for m in monitors]


@router.post("/monitors")
async def create_monitor(data: dict) -> dict:
    """创建监控目标"""
    name = data.get("name", "")
    target_type = data.get("target_type", "http")
    endpoint = data.get("endpoint", "")

    if not name or not endpoint:
        raise HTTPException(status_code=422, detail="name 和 endpoint 必填")

    with Session(engine) as session:
        monitor = Monitor(
            name=name,
            target_type=target_type,
            endpoint=endpoint,
        )
        session.add(monitor)
        session.commit()
        session.refresh(monitor)
        return monitor.model_dump()


@router.post("/monitors/{monitor_id}/check")
async def run_health_check(monitor_id: str) -> dict:
    """执行单次健康检测"""
    with Session(engine) as session:
        monitor = session.get(Monitor, monitor_id)
        if not monitor:
            raise HTTPException(status_code=404, detail="监控不存在")

        # 执行检测
        result = await check_http(monitor.endpoint, timeout=monitor.timeout_seconds)

        # 更新 monitor 状态
        monitor.status = result["status"]
        monitor.last_checked_at = result["checked_at"]  # type: ignore[assignment]
        from datetime import datetime

        if result["status"] in ("offline", "timeout", "error"):
            monitor.consecutive_failures += 1
            # 达到告警阈值时创建 incident
            if monitor.consecutive_failures >= monitor.alert_threshold:
                incident = Incident(
                    monitor_id=monitor_id,
                    level="P1" if result["status"] == "offline" else "P2",
                    summary=f"{monitor.name} 检测失败 ({result['status']})",
                    first_action="检查服务器状态与网络连通性",
                )
                session.add(incident)
                logger.warning("告警触发: %s → %s", monitor.name, result["status"])
        else:
            # 恢复
            if monitor.consecutive_failures > 0:
                # 关闭未恢复的告警
                active_incidents = session.exec(
                    select(Incident)
                    .where(Incident.monitor_id == monitor_id, Incident.recovered_at.is_(None))  # type: ignore[arg-type]
                ).all()
                for inc in active_incidents:
                    inc.recovered_at = datetime.utcnow()
                    session.add(inc)
            monitor.consecutive_failures = 0

        session.add(monitor)
        session.commit()

        return {**result, "consecutive_failures": monitor.consecutive_failures}


@router.get("/incidents/active")
async def get_active_incidents() -> list[dict]:
    """获取活跃告警"""
    with Session(engine) as session:
        incidents = session.exec(
            select(Incident).where(Incident.recovered_at.is_(None))  # type: ignore[arg-type]
        ).all()
    return [i.model_dump() for i in incidents]


@router.get("/incidents")
async def get_incidents() -> list[dict]:
    """获取所有告警"""
    with Session(engine) as session:
        incidents = session.exec(select(Incident).order_by(Incident.opened_at.desc())).all()  # type: ignore[arg-type]
    return [i.model_dump() for i in incidents]
