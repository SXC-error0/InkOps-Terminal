"""应用配置管理, 从环境变量与 .env 文件加载"""

import os
from pathlib import Path
from dotenv import load_dotenv

# 项目根目录 (services/ink-engine/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# 加载 .env 文件
load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    """全局配置单例"""

    # 服务
    HOST: str = os.getenv("INK_ENGINE_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("INK_ENGINE_PORT", "8700"))

    # 数据库
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{PROJECT_ROOT}/runtime/inkops.db")

    # 运行时目录 (始终绝对路径)
    _raw_runtime = os.getenv("RUNTIME_DIR", str(PROJECT_ROOT / "runtime"))
    RUNTIME_DIR: Path = Path(_raw_runtime) if Path(_raw_runtime).is_absolute() else PROJECT_ROOT / _raw_runtime
    PREVIEWS_DIR: Path = RUNTIME_DIR / "previews"

    # LLM 配置
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")

    # GitHub
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    GITHUB_USERNAME: str = os.getenv("GITHUB_USERNAME", "")

    # 日志
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # 墨水屏规格
    DISPLAY_WIDTH: int = 400
    DISPLAY_HEIGHT: int = 300

    # 系统运行模式
    @property
    def is_llm_available(self) -> bool:
        return bool(self.LLM_API_KEY)

    @classmethod
    def ensure_directories(cls) -> None:
        """确保运行时目录存在"""
        cls.RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
        cls.PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
