"""TERMINAL_STATUS 模板: 黑客风个人作战终端"""
from pathlib import Path
from app.render.base import RendererBase


class TerminalStatusRenderer(RendererBase):
    """TERMINAL_STATUS 模板渲染器"""

    def render(self, payload: dict) -> Path:
        img = self.create_canvas()
        y = 8

        # 头部终端标识
        self.draw_text_centered(img, "INKOPS TERMINAL", y, self._title_font)
        y += 22
        self.draw_text_centered(img, "NODE-01 // ACTIVE", y, self._small_font)
        y += 14
        self.draw_divider(img, y)
        y += 10

        # 项目名
        self.draw_text_left(img, 16, y, "PROJECT:", self._small_font)
        y += 14
        self.draw_text_left(img, 20, y, payload.get("project_name", "InkOps Terminal"), self._body_font)
        y += 20

        # 仓库状态
        self.draw_text_left(img, 16, y, "REPO STATUS:", self._small_font)
        y += 14
        commits = payload.get("today_commits", 0)
        streak = payload.get("github_streak", 0)
        self.draw_text_left(img, 20, y, f"Commits Today: {commits}    Streak: {streak}d", self._mono_font or self._body_font)
        y += 20

        # 服务状态
        self.draw_text_left(img, 16, y, "SERVICES:", self._small_font)
        y += 14
        server = payload.get("server_status", "UNKNOWN")
        status_text = "ONLINE" if server == "ONLINE" else "OFFLINE"
        self.draw_text_left(img, 20, y, f"[{status_text}]  Services Operational", self._mono_font or self._body_font)
        y += 20

        # 进度条
        progress = min(payload.get("mvp_progress", 0), 100)
        self.draw_text_left(img, 16, y, f"MVP PROGRESS: {progress}%", self._small_font)
        y += 16
        # 画出进度条
        bar_y = y
        self.draw_text_left(img, 20, bar_y, "[", self._body_font)
        bar_width = 320
        filled = int(bar_width * progress / 100)
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)  # type: ignore[attr-defined]
        draw.rectangle([(20 + self._text_width("[", self._body_font), bar_y + 4), (20 + self._text_width("[", self._body_font) + filled, bar_y + 10)], fill=0)
        self.draw_text_left(img, 20 + self._text_width("[", self._body_font) + bar_width + 4, bar_y, "]", self._body_font)
        y += 22

        # 当前聚焦
        self.draw_divider(img, y)
        y += 8
        self.draw_text_left(img, 16, y, "CURRENT FOCUS:", self._small_font)
        y += 14
        focus = payload.get("current_focus", "先交付, 再完美.")
        self.draw_text_left(img, 20, y, focus, self._body_font)
        y += 24

        # 底部宣言
        self.draw_divider(img, y)
        y += 8
        self.draw_text_centered(img, "> Build. Ship. Display. Repeat.", y, self._mono_font or self._body_font)

        y = self.canvas_height - 16
        self.draw_text_centered(img, "INKOPS COMMAND // TERMINAL", y, self._small_font)

        return self.save_preview(img, "TERMINAL_STATUS")


_terminal_renderer: TerminalStatusRenderer | None = None


def get_terminal_renderer() -> TerminalStatusRenderer:
    global _terminal_renderer
    if _terminal_renderer is None:
        _terminal_renderer = TerminalStatusRenderer()
    return _terminal_renderer
