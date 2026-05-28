"""POSTCARD 模板: 异步电子明信片 / 纸感留言卡"""
from pathlib import Path
from app.render.base import RendererBase


class PostcardRenderer(RendererBase):
    """POSTCARD 模板渲染器"""

    def render(self, payload: dict) -> Path:
        img = self.create_canvas()
        y = 30

        # 明信片邮票区域
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.rectangle([(300, 10), (380, 55)], outline=0, width=1)
        draw.rectangle([(305, 15), (375, 50)], fill=0)
        draw.text((315, 24), "INK", font=self._small_font, fill=255)
        draw.text((315, 36), "OPS", font=self._small_font, fill=255)

        # 标题
        self.draw_text_centered(img, "✉ SIGNAL RECEIVED", y, self._title_font)
        y += 35

        # 分隔线
        self.draw_divider(img, y)
        y += 12

        # 正文 (最大 80 字)
        message = payload.get("text", "")
        if len(message) > 40:
            # 分行显示
            mid = len(message) // 2
            line1 = message[:mid].strip()
            line2 = message[mid:].strip()
            self.draw_text_centered(img, line1, y, self._body_font)
            y += 18
            self.draw_text_centered(img, line2, y, self._body_font)
        else:
            self.draw_text_centered(img, message, y, self._body_font)
        y += 30

        # 署名行
        self.draw_divider(img, y)
        y += 10
        sender = payload.get("sender_name", "Anonymous")
        self.draw_text_left(img, 20, y, f"FROM: {sender}", self._small_font)

        timestamp = payload.get("created_at", "")[:16] if payload.get("created_at") else ""
        if timestamp:
            self.draw_text_left(img, 280, y, timestamp[:10], self._small_font)
        y += 20

        # 底部
        y = self.canvas_height - 52
        self.draw_divider(img, y)
        y += 8
        self.draw_text_centered(img, "This message was delivered via e-paper.", y, self._small_font)
        y += 14
        self.draw_text_centered(img, "INKOPS SIGNAL BOX", y, self._small_font)

        return self.save_preview(img, "POSTCARD")


_postcard_renderer: PostcardRenderer | None = None


def get_postcard_renderer() -> PostcardRenderer:
    global _postcard_renderer
    if _postcard_renderer is None:
        _postcard_renderer = PostcardRenderer()
    return _postcard_renderer
