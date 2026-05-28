use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

/// 项目信息
#[derive(Debug, Clone, serde::Serialize)]
pub struct LaunchProject {
    pub id: String,
    pub name: String,
    pub goal: String,
    pub deadline: Option<String>,
    pub progress: i32,
    pub blockers: Vec<String>,
    pub status: String,
}

/// 创建项目（MVP: 返回模拟数据）
#[tauri::command]
pub fn create_project(
    _state: State<AppState>,
    name: String,
) -> Result<LaunchProject, AppError> {
    log::info!("创建发布项目: {name}");
    Ok(LaunchProject {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        goal: "完成 MVP 演示视频录制".into(),
        deadline: Some("2026-06-15".into()),
        progress: 35,
        blockers: vec![
            "后端数据库与 Tauri 命令实现".into(),
            "6种页面模板渲染".into(),
            "真机墨水屏联调测试".into(),
        ],
        status: "active".into(),
    })
}

/// 获取项目简报
#[derive(Debug, Clone, serde::Serialize)]
pub struct ProjectBriefing {
    pub project: LaunchProject,
    pub today_instruction: String,
    pub countdown_days: i32,
}

#[tauri::command]
pub fn get_project_briefing(
    _state: State<AppState>,
    project_id: String,
) -> Result<ProjectBriefing, AppError> {
    // MVP: 返回模拟简报
    let project = LaunchProject {
        id: project_id,
        name: "InkOps Terminal".into(),
        goal: "完成 MVP 演示视频录制".into(),
        deadline: Some("2026-06-15".into()),
        progress: 35,
        blockers: vec![
            "后端数据库与 Tauri 命令实现".into(),
            "6种页面模板渲染".into(),
            "真机墨水屏联调测试".into(),
        ],
        status: "active".into(),
    };

    Ok(ProjectBriefing {
        project,
        today_instruction: "今日唯一指令: 完成后端 Tauri 命令实现，并跑通第一个页面生成流程。"
            .into(),
        countdown_days: 18,
    })
}
