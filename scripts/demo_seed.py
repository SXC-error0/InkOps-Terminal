#!/usr/bin/env python3
"""InkOps Terminal 演示数据填充脚本
一键生成 6 种模板的演示页面, 为录屏和展示准备数据
用法: cd services/ink-engine && python ../../scripts/demo_seed.py
"""

import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "services" / "ink-engine"))

from app.schemas.quest import QuestPayload
from app.render.quest_scroll import get_quest_renderer
from app.render.terminal_status import get_terminal_renderer
from app.render.launch_panel import get_launch_renderer
from app.render.system_alert import get_alert_renderer
from app.render.postcard import get_postcard_renderer
from app.render.release_news import get_release_renderer
from app.models.database import init_db, engine
from app.models.page import Page
from app.models.task import Task
from app.models.project import Project
from app.models.monitor import Monitor
from app.models.message import Message
from app.config import settings
from sqlmodel import Session


def seed_demo_data():
    """填充演示数据到数据库"""
    settings.ensure_directories()
    init_db()

    print("=" * 50)
    print("InkOps Terminal - 演示数据生成器")
    print("=" * 50)

    with Session(engine) as session:
        # 1. QUEST_SCROLL - 任务卷轴
        print("\n[1/6] 生成 QUEST_SCROLL...")
        quest_payload = QuestPayload(
            main_quest="完成墨水屏自动推送接口",
            side_quests=["修复留言二维码入口", "完成一次力量训练"],
            boss_name="需求膨胀魔王",
            boss_weakness="先交付, 再增加功能",
            ban="今天禁止开新坑",
            reward="解锁首支演示视频",
            declaration="Build. Ship. Display.",
        )
        renderer = get_quest_renderer()
        path = renderer.render(quest_payload)
        page = Page(type="quest", template_id="QUEST_SCROLL", priority=2,
                    trigger_source="user", reason="演示: 今日任务卷轴",
                    payload=quest_payload.model_dump(), image_path=str(path), status="ready")
        session.add(page)
        print(f"  → {path}")

        # 2. TERMINAL_STATUS - 作战终端
        print("\n[2/6] 生成 TERMINAL_STATUS...")
        payload = {"project_name": "InkOps Terminal", "today_commits": 7,
                   "github_streak": 3, "server_status": "ONLINE",
                   "mvp_progress": 65, "current_focus": "完成 Quest 卷轴上屏"}
        path = get_terminal_renderer().render(payload)
        page = Page(type="terminal", template_id="TERMINAL_STATUS", priority=2,
                    trigger_source="scheduled", reason="演示: 终端状态",
                    payload=payload, image_path=str(path), status="ready")
        session.add(page)
        print(f"  → {path}")

        # 3. LAUNCH_PANEL - 发射台
        print("\n[3/6] 生成 LAUNCH_PANEL...")
        payload = {"project_name": "InkOps Terminal", "target_version": "V0.2",
                   "countdown_days": 14, "completed": ["Quest API", "Bridge UI", "E-Ink Preview"],
                   "blockers": ["CI/CD 流水线未就绪"], "progress": 65,
                   "today_instruction": "修复 CI/CD 部署脚本错误"}
        path = get_launch_renderer().render(payload)
        page = Page(type="launch", template_id="LAUNCH_PANEL", priority=2,
                    trigger_source="user", reason="演示: 上线发射台",
                    payload=payload, image_path=str(path), status="ready")
        session.add(page)
        print(f"  → {path}")

        # 4. SYSTEM_ALERT - 告警
        print("\n[4/6] 生成 SYSTEM_ALERT...")
        payload = {"level": "P1", "name": "xzspace.tech",
                   "endpoint": "https://xzspace.tech", "status": "OFFLINE",
                   "diagnosis": "服务不可达, 请检查 Nginx 与服务器状态",
                   "first_action": "检查 Nginx 站点与服务状态",
                   "checked_at": "2026-05-28T14:05:00"}
        path = get_alert_renderer().render(payload)
        page = Page(type="alert", template_id="SYSTEM_ALERT", priority=0,
                    urgency="critical", interruptible=False,
                    trigger_source="monitor:xzspace.tech", reason="演示: 告警页面",
                    payload=payload, image_path=str(path), status="ready")
        session.add(page)
        print(f"  → {path}")

        # 5. POSTCARD - 明信片
        print("\n[5/6] 生成 POSTCARD...")
        payload = {"text": "加油! 你正在创造很棒的东西。保持专注, 先交付再完美。",
                   "sender_name": "未来的你", "created_at": "2026-05-28T20:30:00"}
        path = get_postcard_renderer().render(payload)
        page = Page(type="postcard", template_id="POSTCARD", priority=3,
                    trigger_source="signal", reason="演示: 留言明信片",
                    payload=payload, image_path=str(path), status="ready")
        session.add(page)
        print(f"  → {path}")

        # 6. RELEASE_NEWS - 战报
        print("\n[6/6] 生成 RELEASE_NEWS...")
        payload = {"date": "2026-05-28", "headline": "QUEST SCROLL 上屏成功!",
                   "subtitle": "首个 AI 任务卷轴已推送到墨水屏",
                   "achievements": ["Quest 卷轴端到端闭环", "4 种 AI 人格可用",
                                    "400x300 黑白 PNG 渲染"],
                   "next_steps": ["接入 GitHub 真实数据", "实现监控自动告警"]}
        path = get_release_renderer().render(payload)
        page = Page(type="report", template_id="RELEASE_NEWS", priority=1,
                    trigger_source="scheduled", reason="演示: 发布战报",
                    payload=payload, image_path=str(path), status="ready")
        session.add(page)
        print(f"  → {path}")

        # 额外: 添加项目、监控、留言
        project = Project(name="InkOps Terminal", goal="桌面作战终端 MVP", progress=65, status="active")
        session.add(project)

        monitor = Monitor(name="demo-site", target_type="http", endpoint="https://httpbin.org/get", status="online")
        session.add(monitor)

        msg = Message(sender_name="demo-user", text="这是一个演示留言, 用于测试明信片功能。", safety_status="approved")
        session.add(msg)

        task = Task(date="2026-05-28", raw_text="完成所有演示准备", persona="guild",
                    quest_payload=quest_payload.model_dump())
        session.add(task)

        session.commit()

    print("\n" + "=" * 50)
    print("演示数据填充完成!")
    print(f"预览目录: {settings.PREVIEWS_DIR}")
    print("=" * 50)


if __name__ == "__main__":
    seed_demo_data()
