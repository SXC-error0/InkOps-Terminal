"""Quest 任务卷轴结构化 Schema"""
from pydantic import BaseModel, Field, field_validator


class QuestPayload(BaseModel):
    """AI 每日任务卷轴结构化输出, 字段均有字数约束"""

    main_quest: str = Field(
        ...,
        max_length=24,
        description="主线任务: 今日最核心的一件事",
    )
    side_quests: list[str] = Field(
        default_factory=list,
        max_length=2,
        description="支线任务: 最多 2 条",
    )
    boss_name: str = Field(
        ...,
        max_length=12,
        description="Boss 名称: 今日最大阻碍拟人化",
    )
    boss_weakness: str = Field(
        ...,
        max_length=20,
        description="Boss 弱点: 克服策略",
    )
    ban: str = Field(
        ...,
        max_length=24,
        description="今日禁令: 禁止做的事",
    )
    reward: str = Field(
        ...,
        max_length=20,
        description="奖励: 完成后获得感",
    )
    declaration: str = Field(
        ...,
        max_length=24,
        description="结尾宣言: 战斗口号",
    )

    @field_validator("side_quests")
    @classmethod
    def check_side_quest_length(cls, v: list[str]) -> list[str]:
        for i, quest in enumerate(v):
            if len(quest) > 18:
                raise ValueError(f"支线任务 {i + 1} 超过 18 字限制: {quest}")
        return v


class QuestRequest(BaseModel):
    """用户提交的任务输入"""
    raw_text: str = Field(..., description="用户自由文字输入的任务描述")
    persona: str = Field(
        default="guild",
        description="AI 人格: guild(公会任务官) / commander(舰桥副官) / instructor(黑客教官) / pet(毒舌监督者)",
    )


class QuestResponse(BaseModel):
    """Quest 生成完整响应"""
    task_id: str
    page_id: str
    payload: QuestPayload
    image_path: str | None = None
