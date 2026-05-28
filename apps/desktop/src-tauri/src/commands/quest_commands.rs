use crate::error::AppError;
use crate::models::{QuestInput, QuestPayload, Recommendation};
use crate::services::ai_mock;
use crate::state::AppState;
use tauri::State;

/// 生成 AI 任务卷轴（MVP: 使用模拟数据）
#[tauri::command]
pub fn generate_quest(
    _state: State<AppState>,
    input: QuestInput,
) -> Result<QuestPayload, AppError> {
    log::info!(
        "生成任务卷轴, 输入长度: {}, 角色: {:?}",
        input.text.len(),
        input.persona
    );
    Ok(ai_mock::generate_quest(&input))
}

/// 获取 Display Director 推荐
#[tauri::command]
pub fn get_display_recommendation(
    _state: State<AppState>,
) -> Result<Recommendation, AppError> {
    Ok(ai_mock::get_recommendation())
}
