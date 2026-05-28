"""Quest Writer Agent: 将用户待办转换为 RPG 风格任务卷轴"""
import logging
from app.config import settings
from app.providers import get_llm_provider
from app.schemas.quest import QuestPayload, QuestRequest

logger = logging.getLogger(__name__)

# System Prompts 按人格分化
PERSONA_PROMPTS = {
    "guild": (
        "你是 InkOps Command 的公会任务官。"
        "你的风格是经典 RPG 冒险者公会接待员: 沉稳、可靠、用词庄重。"
    ),
    "commander": (
        "你是 InkOps Command 的舰桥副官。"
        "你的风格是科幻战舰指挥官: 冷静、干练、用军事术语。"
    ),
    "instructor": (
        "你是 InkOps Command 的黑客教官。"
        "你的风格是技术导师: 犀利、直接、用黑客文化暗语。"
    ),
    "pet": (
        "你是 InkOps Command 的毒舌监督者。"
        "你的风格是吐槽型伙伴: 毒舌但关心、用俏皮话激励对方。"
    ),
}

QUEST_WRITER_RULES = """
规则:
1. 主线任务: 从输入中提取最核心的一件事, 不超过 24 字
2. 支线任务: 最多 2 条, 每条不超过 18 字
3. Boss 名称: 将今日最大阻碍拟人化, 不超过 12 字
4. Boss 弱点: 给出克服策略, 不超过 20 字
5. 禁令: 必须包含一条"今日禁止做的事", 不超过 24 字
6. 奖励: 完成后的获得感, 不超过 20 字
7. 宣言: 一句战斗口号结尾, 不超过 24 字

输出必须是合法的 JSON, 严格遵循给定 schema。不要输出多余文字。
如果有多个待办, 将它们合并为一个主线任务。
如果用户没有提供足够的副线任务, 可以空数组。
"""


async def generate_quest(request: QuestRequest) -> QuestPayload:
    """生成 RPG 风格任务卷轴 payload"""
    persona_style = PERSONA_PROMPTS.get(request.persona, PERSONA_PROMPTS["guild"])
    system_prompt = f"{persona_style}\n\n{QUEST_WRITER_RULES}"
    user_prompt = f"以下是我今天需要完成的事项:\n\n{request.raw_text}"

    llm = get_llm_provider()

    try:
        payload = await llm.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            output_schema=QuestPayload,
        )
        logger.info("Quest 生成成功: %s", payload.main_quest)
        return payload
    except Exception as e:
        logger.error("Quest 生成失败: %s", e)
        raise
