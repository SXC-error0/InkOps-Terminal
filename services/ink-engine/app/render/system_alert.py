"""SYSTEM_ALERT 模板: 服务器守夜人告警"""
from pathlib import Path
from app.render.base import RendererBase


class SystemAlertRenderer(RendererBase):
    """SYSTEM_ALERT 模板渲染器"""

    def render(self, payload: dict) -> Path:
        img = self.create_canvas()
        y = 12

        # 告警标题
        level = payload.get("level", "P1")
        alert_banner = f"!! SYSTEM ALERT [{level}] !!"
        self.draw_text_centered(img, alert_banner, y, self._title_font)
        y += 26
        self.draw_divider(img, y)
        y += 12

        # 故障对象
        self.draw_text_left(img, 16, y, "TARGET:", self._small_font)
        y += 14
        self.draw_text_left(img, 20, y, payload.get("name", "Unknown Service"), self._body_font)
        y += 6
        self.draw_text_left(img, 20, y, payload.get("endpoint", ""), self._small_font)
        y += 22

        # 状态
        status = payload.get("status", "UNKNOWN").upper()
        self.draw_text_left(img, 16, y, f"STATUS: {status}", self._body_font)
        y += 20

        # AI 诊断
        self.draw_text_left(img, 16, y, "DIAGNOSIS:", self._small_font)
        y += 14
        diagnosis = payload.get("diagnosis", "服务不可达, 请检查网络或服务器状态")
        self.draw_text_left(img, 20, y, diagnosis, self._body_font)
        y += 22

        # 第一行动
        self.draw_text_left(img, 16, y, "FIRST ACTION:", self._small_font)
        y += 14
        action = payload.get("first_action", "检查 Nginx 与服务状态")
        self.draw_text_left(img, 20, y, action, self._body_font)
        y += 22

        # 检测时间
        self.draw_divider(img, y)
        y += 8
        checked = payload.get("checked_at", "")
        self.draw_text_left(img, 16, y, f"CHECKED: {checked[:19]}", self._small_font)
        y += 20

        # 底部
        self.draw_text_centered(img, "MONITORING ACTIVE", y, self._small_font)
        y = self.canvas_height - 16
        self.draw_text_centered(img, "INKOPS COMMAND // WATCHER", y, self._small_font)

        return self.save_preview(img, "SYSTEM_ALERT")


_alert_renderer: SystemAlertRenderer | None = None


def get_alert_renderer() -> SystemAlertRenderer:
    global _alert_renderer
    if _alert_renderer is None:
        _alert_renderer = SystemAlertRenderer()
    return _alert_renderer
