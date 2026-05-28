use crate::error::AppError;
use crate::services::{database, system_detect};
use crate::state::AppState;
use tauri::State;

/// 系统模式信息
#[derive(Debug, Clone, serde::Serialize)]
pub struct SystemModeInfo {
    pub mode: String,
    pub label: String,
}

/// 检测当前系统运行模式
#[tauri::command]
pub async fn detect_system_mode(
    _state: State<'_, AppState>,
) -> Result<SystemModeInfo, AppError> {
    let mode = system_detect::detect().await;
    Ok(SystemModeInfo {
        label: mode.label().to_string(),
        mode: match mode {
            system_detect::SystemMode::Full => "full",
            system_detect::SystemMode::NoAi => "no_ai",
            system_detect::SystemMode::NoDevice => "no_device",
            system_detect::SystemMode::Offline => "offline",
            system_detect::SystemMode::SafeMode => "safe_mode",
        }
        .into(),
    })
}

/// 获取设置值
#[tauri::command]
pub fn get_setting(
    state: State<AppState>,
    key: String,
) -> Result<Option<String>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    Ok(database::get_setting(&db, &key)?.map(|s| s.value))
}

/// 设置值
#[tauri::command]
pub fn set_setting(
    state: State<AppState>,
    key: String,
    value: String,
) -> Result<(), AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::set_setting(&db, &key, &value)
}
