"""Launch 发射台结构化 Schema"""
from pydantic import BaseModel, Field


class LaunchPayload(BaseModel):
    """LAUNCH_PANEL 模板数据结构"""
    project_name: str = Field(..., max_length=20, description="产品名称")
    target_version: str = Field(..., max_length=16, description="目标版本")
    progress: int = Field(default=0, ge=0, le=100, description="完成度百分比")
    completed: list[str] = Field(default_factory=list, max_length=4, description="已完成项")
    blockers: list[str] = Field(default_factory=list, max_length=3, description="阻塞项")
    today_instruction: str = Field(..., max_length=40, description="AI 今日唯一指令")
    countdown_days: int = Field(default=0, description="距上线天数")


class ProjectRequest(BaseModel):
    """创建项目请求"""
    name: str = Field(..., description="产品名称")


class BriefingRequest(BaseModel):
    """生成简报请求"""
    raw_text: str = Field(default="", description="项目补充信息")
