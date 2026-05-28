"""APScheduler 定时任务: 周期检测监控目标, 自动生成告警/恢复页面"""
import logging
from datetime import datetime
from sqlmodel import Session, select

from app.models.database import engine
from app.models.monitor import Monitor
from app.models.incident import Incident
from app.models.page import Page
from app.monitors.http_checker import check_http
from app.render.system_alert import get_alert_renderer
from app.api.system import add_event
from app.agents.director import auto_push_if_needed

logger = logging.getLogger(__name__)


async def run_all_health_checks() -> None:
    """遍历所有 Monitor 并执行健康检测"""
    with Session(engine) as session:
        monitors = session.exec(select(Monitor)).all()

    for monitor in monitors:
        try:
            result = await check_http(monitor.endpoint, timeout=monitor.timeout_seconds)

            with Session(engine) as session:
                m = session.get(Monitor, monitor.id)
                if not m:
                    continue

                m.status = result["status"]
                m.last_checked_at = result["checked_at"]

                if result["status"] in ("offline", "timeout", "error"):
                    m.consecutive_failures += 1
                    # 达到阈值, 生成告警
                    if m.consecutive_failures >= m.alert_threshold:
                        # 检查是否已有未恢复的告警
                        existing = session.exec(
                            select(Incident)
                            .where(Incident.monitor_id == monitor.id, Incident.recovered_at.is_(None))  # type: ignore[arg-type]
                        ).first()
                        if not existing:
                            incident = Incident(
                                monitor_id=monitor.id,
                                level="P1" if result["status"] == "offline" else "P2",
                                summary=f"{m.name} 检测失败 ({result['status']})",
                                first_action="检查服务器状态与网络连通性",
                            )
                            session.add(incident)
                            session.commit()
                            session.refresh(incident)

                            # 自动生成 SYSTEM_ALERT 页面
                            _generate_alert_page(m, result, incident)
                            add_event("alert", f"告警触发: {m.name} → {result['status']}")
                            logger.warning("告警页面已生成: %s", m.name)
                else:
                    # 恢复: 关闭告警, 生成恢复页面
                    if m.consecutive_failures > 0:
                        active_incidents = session.exec(
                            select(Incident)
                            .where(Incident.monitor_id == monitor.id, Incident.recovered_at.is_(None))  # type: ignore[arg-type]
                        ).all()
                        now = datetime.utcnow()
                        for inc in active_incidents:
                            inc.recovered_at = now
                            session.add(inc)
                            _generate_recovery_page(m, inc)
                            add_event("system", f"服务恢复: {m.name}")
                            logger.info("恢复页面已生成: %s", m.name)
                    m.consecutive_failures = 0

                session.add(m)
                session.commit()
        except Exception as e:
            logger.error("Monitor 检测异常 [%s]: %s", monitor.name, e)

    # 每次检测后运行 Director 自动推送检查
    try:
        auto_push_if_needed()
    except Exception as e:
        logger.error("Director 自动推送异常: %s", e)


def _generate_alert_page(monitor: Monitor, result: dict, incident: Incident) -> None:
    """生成 SYSTEM_ALERT 页面"""
    payload = {
        "level": incident.level,
        "name": monitor.name,
        "endpoint": monitor.endpoint,
        "status": result["status"].upper(),
        "diagnosis": f"{monitor.name} 服务不可达, 请检查网络或服务器状态",
        "first_action": incident.first_action or "检查 Nginx 与服务状态",
        "checked_at": result["checked_at"].isoformat() if isinstance(result["checked_at"], datetime) else str(result["checked_at"]),
    }
    try:
        renderer = get_alert_renderer()
        image_path = renderer.render(payload)
        with Session(engine) as session:
            page = Page(
                type="alert",
                template_id="SYSTEM_ALERT",
                priority=0,
                urgency="critical",
                interruptible=False,
                trigger_source=f"monitor:{monitor.name}",
                reason=f"自动告警: {monitor.name} {result['status']}",
                payload=payload,
                image_path=str(image_path),
                status="ready",
            )
            session.add(page)
            session.commit()
    except Exception as e:
        logger.error("告警页面渲染失败: %s", e)


def _generate_recovery_page(monitor: Monitor, incident: Incident) -> None:
    """生成服务恢复页面"""
    payload = {
        "level": "RECOVERY",
        "name": monitor.name,
        "endpoint": monitor.endpoint,
        "status": "RECOVERED",
        "diagnosis": f"{monitor.name} 服务已恢复正常",
        "first_action": "无需操作, 系统已自动恢复",
        "checked_at": datetime.utcnow().isoformat(),
    }
    try:
        renderer = get_alert_renderer()
        image_path = renderer.render(payload)
        with Session(engine) as session:
            page = Page(
                type="alert",
                template_id="SYSTEM_ALERT",
                priority=1,
                urgency="normal",
                trigger_source=f"monitor:{monitor.name}",
                reason=f"自动恢复: {monitor.name} 已恢复",
                payload=payload,
                image_path=str(image_path),
                status="ready",
            )
            session.add(page)
            session.commit()
    except Exception as e:
        logger.error("恢复页面渲染失败: %s", e)
