use crate::error::AppError;
use crate::models::{
    page::CreatePageInput, page::Page, DisplayLog,
};
use crate::services::{database, device_push, page_renderer};
use crate::state::AppState;
use tauri::State;

/// 获取当前推送的页面
#[tauri::command]
pub fn get_current_page(state: State<AppState>) -> Result<Option<Page>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::get_current_page(&db)
}

/// 获取页面历史
#[tauri::command]
pub fn get_page_history(
    state: State<AppState>,
    limit: Option<u32>,
) -> Result<Vec<Page>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::get_page_history(&db, limit)
}

/// 获取候选页面（draft/ready 状态）
#[tauri::command]
pub fn get_candidate_pages(state: State<AppState>) -> Result<Vec<Page>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::get_candidate_pages(&db)
}

/// 创建新页面（自动渲染预览 PNG）
#[tauri::command]
pub fn create_page(
    state: State<AppState>,
    input: CreatePageInput,
) -> Result<Page, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;

    let page_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let mut page = Page {
        id: page_id,
        page_type: input.page_type,
        template_id: input.template_id,
        priority: input.priority.unwrap_or(2),
        urgency: input.urgency.unwrap_or_else(|| "normal".into()),
        interruptible: input.interruptible.unwrap_or(true),
        expires_at: None,
        display_duration: input.display_duration,
        emotion: input.emotion,
        trigger_source: input.trigger_source,
        reason: input.reason,
        payload: input.payload,
        image_path: None,
        status: "draft".into(),
        created_at: Some(now),
        pushed_at: None,
    };

    database::insert_page(&db, &page)?;

    // 渲染预览 PNG
    let data_dir = state.data_dir.clone();
    drop(db);

    match page_renderer::render_page(&page, &data_dir) {
        Ok(path) => {
            page.image_path = Some(path.clone());
            page.status = "ready".into();
            let db = state.db.lock().map_err(|e| {
                AppError::Validation(format!("数据库锁失败: {e}"))
            })?;
            database::update_page_image_path(&db, &page.id, &path)?;
            database::update_page_status(&db, &page.id, "ready")?;
            log::info!("页面创建并渲染完成: {} ({})", page.id, page.page_type);
        }
        Err(e) => {
            log::warn!("页面创建成功但渲染失败: {} - {e}", page.id);
        }
    }

    Ok(page)
}

/// 推送页面到设备（异步: 包含 HTTP 通信）
#[tauri::command]
pub async fn push_page_to_device(
    state: State<'_, AppState>,
    page_id: String,
    device_id: String,
) -> Result<DisplayLog, AppError> {
    // 第一步: 从数据库获取页面和设备信息
    let (page, device_ip, data_dir) = {
        let db = state.db.lock().map_err(|e| {
            AppError::Validation(format!("数据库锁失败: {e}"))
        })?;

        let page = database::get_page_by_id(&db, &page_id)?
            .ok_or_else(|| AppError::NotFound(format!("页面不存在: {page_id}")))?;

        let device = database::get_device_by_id(&db, &device_id)?
            .ok_or_else(|| AppError::NotFound(format!("设备不存在: {device_id}")))?;

        let ip = device
            .ip
            .clone()
            .ok_or_else(|| AppError::Validation("设备 IP 未配置".into()))?;

        (page, ip, state.data_dir.clone())
    }; // 释放数据库锁

    // 第二步: 确保页面已渲染
    let image_path = match &page.image_path {
        Some(path) if std::path::Path::new(path).exists() => path.clone(),
        _ => {
            let path = page_renderer::render_page(&page, &data_dir)?;
            // 更新数据库中的 image_path
            let db = state.db.lock().map_err(|e| {
                AppError::Validation(format!("数据库锁失败: {e}"))
            })?;
            database::update_page_image_path(&db, &page_id, &path)?;
            path
        }
    };

    // 第三步: 推送到设备
    let push_result = device_push::push_png_to_device(
        std::path::Path::new(&image_path),
        &device_ip,
    )
    .await;

    // 第四步: 记录日志
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;

    let now = chrono::Utc::now().to_rfc3339();
    let log = match &push_result {
        Ok(()) => {
            database::update_page_status(&db, &page_id, "pushed")?;
            DisplayLog {
                id: 0,
                page_id: page_id.clone(),
                device_id: device_id.clone(),
                pushed_at: Some(now),
                result: Some("success".into()),
                error_message: None,
            }
        }
        Err(e) => {
            database::update_page_status(&db, &page_id, "failed")?;
            DisplayLog {
                id: 0,
                page_id: page_id.clone(),
                device_id: device_id.clone(),
                pushed_at: Some(now),
                result: Some("device_unreachable".into()),
                error_message: Some(e.to_string()),
            }
        }
    };

    database::insert_display_log(&db, &log)?;

    if push_result.is_ok() {
        log::info!(
            "页面推送成功: {} -> 设备 {} ({})",
            page_id,
            device_id,
            device_ip
        );
    } else {
        log::warn!("页面推送失败: {} -> 设备 {}", page_id, device_id);
    }

    Ok(log)
}

/// 更新页面状态
#[tauri::command]
pub fn update_page_status(
    state: State<AppState>,
    page_id: String,
    status: String,
) -> Result<(), AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::update_page_status(&db, &page_id, &status)
}
