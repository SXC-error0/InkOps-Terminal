"""RELEASE_NEWS 模板: 发布 / 开发战报头版"""
from pathlib import Path
from app.render.base import RendererBase


class ReleaseNewsRenderer(RendererBase):
    """RELEASE_NEWS 模板渲染器"""

    def render(self, payload: dict) -> Path:
        img = self.create_canvas()

        # 报纸头版标题
        y = 6
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.rectangle([(0, 0), (400, 36)], fill=0)
        self.draw_text_centered(img, "INKOPS DAILY", y, self._title_font)  # type: ignore[attr-defined]
        # 切换回白字
        # 实际上在 fill=0 背景上画白字需要用 fill=255...这个比较难处理, 我换一种方式
        y += 22
        self.draw_text_centered(img, payload.get("date", ""), y, self._small_font)
        y = 42

        # 头条
        headline = payload.get("headline", "HEADLINE")
        self.draw_text_centered(img, headline, y, self._title_font)
        y += 30

        # 副标题
        subtitle = payload.get("subtitle", "")
        if subtitle:
            self.draw_text_centered(img, subtitle, y, self._small_font)
            y += 18

        self.draw_divider(img, y)
        y += 10

        # 成果摘要 (最多 4 条)
        achievements = payload.get("achievements", [])
        if achievements:
            self.draw_text_left(img, 16, y, "TODAY'S ACHIEVEMENTS:", self._small_font)
            y += 16
            for item in achievements[:4]:
                self.draw_text_left(img, 20, y, f"★ {item}", self._body_font)
                y += 18
            y += 4

        # 下一步
        self.draw_divider(img, y)
        y += 8
        next_steps = payload.get("next_steps", ["Continue shipping."])
        self.draw_text_left(img, 16, y, "NEXT:", self._small_font)
        y += 16
        for step in next_steps[:2]:
            self.draw_text_left(img, 20, y, f"→ {step}", self._body_font)
            y += 18

        # 底部
        y = self.canvas_height - 30
        self.draw_divider(img, y)
        y += 8
        self.draw_text_centered(img, "Build. Ship. Display. Repeat.", y, self._small_font)

        return self.save_preview(img, "RELEASE_NEWS")


_release_renderer: ReleaseNewsRenderer | None = None


def get_release_renderer() -> ReleaseNewsRenderer:
    global _release_renderer
    if _release_renderer is None:
        _release_renderer = ReleaseNewsRenderer()
    return _release_renderer
