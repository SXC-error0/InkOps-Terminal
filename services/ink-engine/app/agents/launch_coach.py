"""Launch Coach Agent: AI 上线教练, 分析阻塞项并给出今日指令"""
import logging
from app.config import settings
from app.providers import get_llm_provider
from app.schemas.launch import LaunchPayload

logger = logging.getLogger(__name__)

LAUNCH_COACH_PROMPT = """你是 InkOps Command 的上线发射教练 (Launch Coach)。
你的任务是将产品进度转化为一个聚焦的发射台状态报告。

规则:
1. 识别伪进展: "继续改视觉"、"继续找灵感"、"继续加功能" 等不算真正进展
2. 先交付再完美: 优先识别真正影响发布的任务
3. 今日唯一指令: 从所有事情中挑出今天最该做的一步, 不超过 40 字
4. 完成项和阻塞项都应具体, 可验证

输出必须是合法 JSON, 严格遵循给定 schema。"""


async def generate_launch_payload(
    project_name: str,
    raw_text: str = "",
) -> LaunchPayload:
    """生成发射台 payload"""
    system_prompt = LAUNCH_COACH_PROMPT
    user_prompt = (
        f"产品名称: {project_name}\n"
        f"补充信息: {raw_text or '无'}\n\n"
        "请分析这个产品的上线路程, 生成发射台状态页面。"
    )

    llm = get_llm_provider()
    try:
        return await llm.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            output_schema=LaunchPayload,
        )
    except Exception as e:
        logger.error("Launch 生成失败: %s", e)
        # 返回默认值
        return LaunchPayload(
            project_name=project_name,
            target_version="V0.1",
            progress=10,
            completed=["项目初始化完成"],
            blockers=["需要进一步明确产品需求"],
            today_instruction="用一句话描述产品核心价值",
            countdown_days=14,
        )
