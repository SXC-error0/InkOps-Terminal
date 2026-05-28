use crate::error::AppError;
use crate::models::{Device, DisplayLog};
use crate::services::database;
use crate::state::AppState;
use tauri::State;

/// 获取当前设备
#[tauri::command]
pub fn get_device(state: State<AppState>) -> Result<Option<Device>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::get_device(&db)
}

/// 发现设备（扫描局域网内的 InkOps 设备）
#[tauri::command]
pub fn discover_devices(state: State<AppState>) -> Result<Vec<Device>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;

    // MVP: 检查数据库中的设备，如果是模拟设备则返回模拟数据
    let existing = database::get_device(&db)?;
    if existing.is_some() {
        return Ok(existing.into_iter().collect());
    }

    // 返回一个默认模拟设备
    let mock_device = Device {
        id: "NODE-01".into(),
        name: "NODE-01".into(),
        ip: Some("192.168.1.100".into()),
        model: "4.2inch-e-paper".into(),
        firmware_version: Some("0.1.0".into()),
        last_seen: Some(chrono::Utc::now().to_rfc3339()),
        status: crate::models::DeviceStatus::Online,
        created_at: Some(chrono::Utc::now().to_rfc3339()),
    };

    database::upsert_device(&db, &mock_device)?;
    Ok(vec![mock_device])
}

/// 绑定新设备
#[derive(Debug, serde::Deserialize)]
pub struct BindDeviceInput {
    pub name: String,
    pub ip: String,
}

#[tauri::command]
pub fn bind_device(
    state: State<AppState>,
    input: BindDeviceInput,
) -> Result<Device, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;

    let device = Device {
        id: format!("NODE-{}", &input.name),
        name: input.name,
        ip: Some(input.ip),
        model: "4.2inch-e-paper".into(),
        firmware_version: None,
        last_seen: Some(chrono::Utc::now().to_rfc3339()),
        status: crate::models::DeviceStatus::Online,
        created_at: Some(chrono::Utc::now().to_rfc3339()),
    };

    database::upsert_device(&db, &device)?;
    log::info!("设备绑定成功: {}", device.id);
    Ok(device)
}

/// 获取设备推送历史
#[tauri::command]
pub fn get_device_logs(
    state: State<AppState>,
    device_id: String,
    limit: Option<u32>,
) -> Result<Vec<DisplayLog>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::get_display_logs(&db, &device_id, limit)
}
