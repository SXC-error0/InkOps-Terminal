use crate::error::AppError;
use crate::models::{Message, MessageInput};
use crate::services::database;
use crate::state::AppState;
use tauri::State;

/// 生成留言入口（MVP: 返回文本占位，后续实现真实 QR 码生成）
#[tauri::command]
pub fn generate_qr_code(_state: State<AppState>) -> Result<String, AppError> {
    // MVP: QR 码后续由 Python 边车或前端库生成
    // 当前返回提示信息
    Ok("QR_PLACEHOLDER: 留言入口二维码将在完成扫码留言功能后提供".into())
}

/// 提交留言
#[tauri::command]
pub fn submit_message(
    state: State<AppState>,
    input: MessageInput,
) -> Result<Message, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;

    // 校验: 留言最长 80 字
    if input.text.len() > 80 {
        return Err(AppError::Validation("留言不能超过 80 个字".into()));
    }

    if input.text.trim().is_empty() {
        return Err(AppError::Validation("留言不能为空".into()));
    }

    let message = Message {
        id: uuid::Uuid::new_v4().to_string(),
        sender_name: input.sender_name,
        text: input.text,
        safety_status: "approved".into(), // MVP: 自动通过
        page_id: None,
        created_at: Some(chrono::Utc::now().to_rfc3339()),
    };

    database::insert_message(&db, &message)?;
    log::info!("留言提交成功: {}", message.id);
    Ok(message)
}

/// 获取已审核的留言列表
#[tauri::command]
pub fn get_messages(
    state: State<AppState>,
    limit: Option<u32>,
) -> Result<Vec<Message>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::get_messages(&db, limit)
}
