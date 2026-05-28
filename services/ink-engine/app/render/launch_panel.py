"""LAUNCH_PANEL 模板: 产品上线发射台"""
from pathlib import Path
from app.render.base import RendererBase


class LaunchPanelRenderer(RendererBase):
    """LAUNCH_PANEL 模板渲染器"""

    def render(self, payload: dict) -> Path:
        img = self.create_canvas()
        y = 8

        # 头部
        self.draw_text_centered(img, "LAUNCH CONTROL", y, self._title_font)
        y += 22
        self.draw_text_centered(img, payload.get("project_name", "PROJECT"), y, self._small_font)
        y += 14
        self.draw_divider(img, y)
        y += 10

        # 目标版本 + 倒计时
        version = payload.get("target_version", "V0.1")
        days = payload.get("countdown_days", 0)
        self.draw_text_left(img, 16, y, f"TARGET: {version}", self._body_font)
        self.draw_text_left(img, 280, y, f"T-{days}d", self._title_font)
        y += 24

        # 完成项
        completed = payload.get("completed", [])
        if completed:
            self.draw_text_left(img, 16, y, "COMPLETED:", self._small_font)
            y += 14
            for item in completed[:4]:
                self.draw_text_left(img, 20, y, f"[✓] {item}", self._body_font)
                y += 16
            y += 4

        # 阻塞项 (高亮)
        blockers = payload.get("blockers", [])
        if blockers:
            self.draw_text_left(img, 16, y, "BLOCKERS:", self._small_font)
            y += 14
            for item in blockers[:3]:
                self.draw_text_left(img, 20, y, f"[!!] {item}", self._body_font)
                y += 16
            y += 4

        # 进度条
        progress = min(payload.get("progress", 0), 100)
        self.draw_text_left(img, 16, y, f"PROGRESS: {progress}%", self._small_font)
        y += 16
        bar_y = y
        self.draw_text_left(img, 20, bar_y, "[", self._body_font)
        bar_width = 320
        filled = int(bar_width * progress / 100)
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        prefix_w = self._text_width("[", self._body_font)
        draw.rectangle([(20 + prefix_w, bar_y + 4), (20 + prefix_w + filled, bar_y + 10)], fill=0)
        y += 20

        # AI 今日指令
        self.draw_divider(img, y)
        y += 8
        instruction = payload.get("today_instruction", "Focus on shipping.")
        self.draw_text_left(img, 16, y, "TODAY:", self._small_font)
        y += 14
        self.draw_text_left(img, 20, y, instruction, self._body_font)
        y += 24

        # 底部
        self.draw_divider(img, y)
        y += 8
        self.draw_text_centered(img, "LAUNCH. SHIP. REPEAT.", y, self._mono_font or self._body_font)

        y = self.canvas_height - 16
        self.draw_text_centered(img, "INKOPS COMMAND // LAUNCH", y, self._small_font)

        return self.save_preview(img, "LAUNCH_PANEL")


_launch_renderer: LaunchPanelRenderer | None = None


def get_launch_renderer() -> LaunchPanelRenderer:
    global _launch_renderer
    if _launch_renderer is None:
        _launch_renderer = LaunchPanelRenderer()
    return _launch_renderer
