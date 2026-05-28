from app.providers.base import LLMProvider
from app.providers.openai_compat import OpenAICompatProvider, get_openai_provider
from app.providers.mock import MockProvider, get_mock_provider
from app.config import settings


def get_llm_provider() -> LLMProvider:
    """根据配置返回可用的 LLM Provider"""
    if settings.is_llm_available:
        return get_openai_provider()
    return get_mock_provider()
