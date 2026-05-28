use crate::error::AppError;
use crate::models::Page;
use crate::services::{database, page_renderer};
use crate::state::AppState;
use tauri::State;
use std::path::PathBuf;

/// 重新渲染页面
#[tauri::command]
pub fn re_render_page(
    state: State<AppState>,
    page_id: String,
) -> Result<Page, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;

    let mut page = database::get_page_by_id(&db, &page_id)?
        .ok_or_else(|| AppError::NotFound(format!("页面不存在: {page_id}")))?;

    let data_dir = state.data_dir.clone();
    drop(db);

    // 重新渲染
    let image_path = page_renderer::render_page(&page, &data_dir)?;
    page.image_path = Some(image_path.clone());
    page.status = "ready".into();

    // 更新数据库
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::update_page_image_path(&db, &page_id, &image_path)?;
    database::update_page_status(&db, &page_id, "ready")?;

    log::info!("页面重渲染完成: {} -> {}", page_id, image_path);
    Ok(page)
}

/// 导出页面图片
#[tauri::command]
pub fn export_page_image(
    state: State<AppState>,
    page_id: String,
) -> Result<String, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;

    let page = database::get_page_by_id(&db, &page_id)?
        .ok_or_else(|| AppError::NotFound(format!("页面不存在: {page_id}")))?;

    if let Some(ref path) = page.image_path {
        let full_path = PathBuf::from(path);
        if full_path.exists() {
            return Ok(full_path.to_string_lossy().to_string());
        }
    }

    // 如果图片不存在，重新渲染
    drop(db);
    let image_path = page_renderer::render_page(&page, &state.data_dir)?;
    Ok(image_path)
}

/// 获取已归档的页面历史
#[tauri::command]
pub fn get_archived_pages(
    state: State<AppState>,
    limit: Option<u32>,
) -> Result<Vec<Page>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::get_page_history(&db, limit)
}
