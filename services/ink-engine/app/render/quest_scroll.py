"""QUEST_SCROLL 模板: RPG 风格每日任务卷轴"""
from pathlib import Path
from app.render.base import RendererBase
from app.schemas.quest import QuestPayload


class QuestScrollRenderer(RendererBase):
    """QUEST_SCROLL 模板渲染器"""

    def render(self, payload: QuestPayload) -> Path:
        """渲染 400x300 RPG 任务卷轴页面"""
        img = self.create_canvas()

        y = 8

        # 标题
        self.draw_text_centered(img, "DAILY QUEST", y, self._title_font)
        y += 22
        self.draw_text_centered(img, "LV.01", y, self._small_font)
        y += 18
        self.draw_divider(img, y)
        y += 10

        # 主线任务
        self.draw_text_left(img, 16, y, "MAIN QUEST", self._small_font)
        y += 14
        # 主线任务内容 (如果太长则缩小字号)
        main_font = self._body_font
        if self._text_width(payload.main_quest, main_font) > self.canvas_width - 32:
            main_font = self._small_font
        self.draw_text_left(img, 20, y, payload.main_quest, main_font)
        y += 22

        # 支线任务
        if payload.side_quests:
            self.draw_text_left(img, 16, y, "SIDE QUEST", self._small_font)
            y += 14
            for sq in payload.side_quests:
                self.draw_text_left(img, 20, y, f"□ {sq}", self._body_font)
                y += 18
            y += 4

        # Boss 信息
        self.draw_divider(img, y)
        y += 8
        self.draw_text_left(img, 16, y, f"BOSS: {payload.boss_name}", self._body_font)
        y += 18
        weakness_font = self._body_font
        self.draw_text_left(img, 16, y, f"WEAKNESS: {payload.boss_weakness}", weakness_font)
        y += 22

        # 禁令
        self.draw_divider(img, y)
        y += 8
        self.draw_text_left(img, 16, y, f"BAN: {payload.ban}", self._body_font)
        y += 18

        # 奖励
        self.draw_text_left(img, 16, y, f"REWARD: {payload.reward}", self._body_font)
        y += 22

        # 底部宣言
        self.draw_divider(img, y)
        y += 8
        self.draw_text_centered(img, payload.declaration, y, self._body_font)

        # 底部装饰
        y = self.canvas_height - 18
        self.draw_divider(img, y)
        self.draw_text_centered(img, "INKOPS COMMAND", y, self._small_font)

        return self.save_preview(img, "QUEST_SCROLL")


# 单例
_quest_renderer: QuestScrollRenderer | None = None


def get_quest_renderer() -> QuestScrollRenderer:
    global _quest_renderer
    if _quest_renderer is None:
        _quest_renderer = QuestScrollRenderer()
    return _quest_renderer
