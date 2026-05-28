"""墨水屏页面渲染器基类, 负责字体加载、画布创建与图片输出"""

import logging
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from app.config import settings

logger = logging.getLogger(__name__)

# 已知的 CJK 字体路径候选
_CJK_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
    "/usr/share/fonts/truetype/arphic/ukai.ttc",
    "/usr/share/fonts/truetype/arphic/uming.ttc",
]

# 等宽字体候选 (用于终端风格)
_MONO_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/noto/NotoSansMono-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
]


class RendererBase:
    """页面渲染器基类, 使用 font.getmask 手动排版以避免 Pillow TTF 兼容性问题"""

    canvas_width: int = settings.DISPLAY_WIDTH
    canvas_height: int = settings.DISPLAY_HEIGHT

    def __init__(self):
        self._title_font: ImageFont.FreeTypeFont | None = None
        self._body_font: ImageFont.FreeTypeFont | None = None
        self._small_font: ImageFont.FreeTypeFont | None = None
        self._mono_font: ImageFont.FreeTypeFont | None = None
        self._load_fonts()

    def _load_fonts(self):
        """加载 CJK 与等宽字体, 找不到则用默认字体"""
        cjk_path = self._find_font(_CJK_FONT_CANDIDATES)
        mono_path = self._find_font(_MONO_FONT_CANDIDATES)

        try:
            if cjk_path:
                self._title_font = ImageFont.truetype(cjk_path, size=20, index=0)
                self._body_font = ImageFont.truetype(cjk_path, size=14, index=0)
                self._small_font = ImageFont.truetype(cjk_path, size=11, index=0)
                logger.info("CJK 字体加载成功: %s", cjk_path)
            else:
                self._title_font = ImageFont.load_default()
                self._body_font = ImageFont.load_default()
                self._small_font = ImageFont.load_default()
                logger.warning("未找到 CJK 字体, 使用默认字体 (中文可能无法正常显示)")

            if mono_path:
                self._mono_font = ImageFont.truetype(mono_path, size=13)
            else:
                self._mono_font = self._body_font
        except Exception as e:
            logger.error("字体加载失败: %s, 使用默认字体", e)
            self._title_font = ImageFont.load_default()
            self._body_font = ImageFont.load_default()
            self._small_font = ImageFont.load_default()
            self._mono_font = self._body_font

    @staticmethod
    def _find_font(candidates: list[str]) -> str | None:
        for path in candidates:
            if Path(path).exists():
                return path
        return None

    def _text_width(self, text: str, font: ImageFont.FreeTypeFont) -> int:
        """使用 getmask 获取文字实际宽度"""
        mask = font.getmask(text)
        return mask.size[0] if mask else 0

    def _draw_text(
        self,
        img: Image.Image,
        x: int,
        y: int,
        text: str,
        font: ImageFont.FreeTypeFont,
    ):
        """使用 getmask + paste 绘制文字, 绕过 Pillow draw.text() 的 TTF bug"""
        mask = font.getmask(text)
        if mask:
            w, h = mask.size
            mask_img = Image.frombytes("L", (w, h), bytes(mask))
            img.paste(0, (x, y, x + w, y + h), mask_img)

    def create_canvas(self) -> Image.Image:
        """创建 400x300 白色画布 (灰度模式)"""
        return Image.new("L", (self.canvas_width, self.canvas_height), 255)

    def finalize(self, img: Image.Image) -> Image.Image:
        """灰度转黑白二值图 (Floyd-Steinberg 抖动)"""
        return img.convert("1", dither=Image.Dither.FLOYDSTEINBERG)

    def draw_text_centered(
        self,
        img: Image.Image,
        text: str,
        y: int,
        font: ImageFont.FreeTypeFont | None = None,
    ):
        """在指定 y 坐标处居中绘制文字"""
        font = font or self._body_font
        text_width = self._text_width(text, font)
        x = (self.canvas_width - text_width) // 2
        self._draw_text(img, x, y, text, font)

    def draw_divider(self, img: Image.Image, y: int):
        """绘制分隔线"""
        draw = ImageDraw.Draw(img)
        draw.line([(20, y), (self.canvas_width - 20, y)], fill=0, width=1)

    def draw_text_left(
        self,
        img: Image.Image,
        x: int,
        y: int,
        text: str,
        font: ImageFont.FreeTypeFont | None = None,
    ):
        """在指定坐标绘制左对齐文字"""
        font = font or self._body_font
        self._draw_text(img, x, y, text, font)

    def save_preview(self, img: Image.Image, template_id: str) -> Path:
        """二值化并保存预览图片到 runtime/previews/"""
        img_bw = self.finalize(img)
        filename = f"{template_id}_{abs(hash(img_bw.tobytes())):x}.png"
        filepath = settings.PREVIEWS_DIR / filename
        img_bw.save(filepath, "PNG")
        logger.info("页面预览已保存: %s", filepath)
        return filepath

    def to_bitmap(self, img: Image.Image) -> bytes:
        """将渲染结果导出为原始 1-bit 位图 (400×300 = 15000 bytes)
        格式: 每字节 8 个像素 (MSB 优先), 逐行排列
        供 ESP8266 直接写入 framebuffer 推屏, 无需解码 PNG
        """
        img_bw = self.finalize(img)
        raw = img_bw.tobytes("raw", "1")
        return raw

    def render(self, payload: dict) -> Path:
        """子类实现具体模板渲染逻辑"""
        raise NotImplementedError
