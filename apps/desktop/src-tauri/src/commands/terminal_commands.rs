use crate::error::AppError;
use crate::models::TerminalSummary;
use crate::services::github_mock;
use crate::state::AppState;
use tauri::State;

/// 获取终端状态摘要（含 GitHub 数据）
#[tauri::command]
pub fn get_terminal_summary(
    _state: State<AppState>,
) -> Result<TerminalSummary, AppError> {
    Ok(github_mock::get_terminal_summary())
}
