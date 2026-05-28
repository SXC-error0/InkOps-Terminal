use crate::error::AppError;
use crate::models::monitor::{CreateMonitorInput, HealthCheckResult, Monitor};
use crate::models::Incident;
use crate::services::{database, health_check};
use crate::state::AppState;
use tauri::State;

/// 获取所有监控目标
#[tauri::command]
pub fn get_monitors(state: State<AppState>) -> Result<Vec<Monitor>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::get_monitors(&db)
}

/// 创建新监控目标
#[tauri::command]
pub fn create_monitor(
    state: State<AppState>,
    input: CreateMonitorInput,
) -> Result<Monitor, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;

    let monitor = Monitor {
        id: uuid::Uuid::new_v4().to_string(),
        name: input.name,
        target_type: input.target_type,
        endpoint: input.endpoint,
        interval_seconds: input.interval_seconds.unwrap_or(60),
        timeout_seconds: input.timeout_seconds.unwrap_or(10),
        status: "unknown".into(),
        consecutive_failures: 0,
        alert_threshold: 3,
        last_checked_at: None,
        created_at: Some(chrono::Utc::now().to_rfc3339()),
    };

    database::upsert_monitor(&db, &monitor)?;
    log::info!("监控目标创建: {} ({})", monitor.name, monitor.endpoint);
    Ok(monitor)
}

/// 执行健康检测
#[tauri::command]
pub async fn run_health_check(
    state: State<'_, AppState>,
    monitor_id: String,
) -> Result<HealthCheckResult, AppError> {
    // 先在作用域内读取监控数据，然后释放锁
    let (endpoint, timeout_secs, monitor_name) = {
        let db = state.db.lock().map_err(|e| {
            AppError::Validation(format!("数据库锁失败: {e}"))
        })?;

        let monitor = database::get_monitor_by_id(&db, &monitor_id)?
            .ok_or_else(|| AppError::NotFound(format!("监控不存在: {monitor_id}")))?;

        (
            monitor.endpoint.clone(),
            monitor.timeout_seconds as u64,
            monitor.name.clone(),
        )
    }; // 锁在此处释放

    // 异步执行 HTTP 健康检测（不持有锁）
    let result = health_check::check_endpoint(
        &monitor_id,
        &endpoint,
        timeout_secs,
    )
    .await;

    // 重新获取锁，更新监控状态
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;

    let mut monitor = database::get_monitor_by_id(&db, &monitor_id)?
        .ok_or_else(|| AppError::NotFound(format!("监控不存在: {monitor_id}")))?;

    monitor.status = result.status.clone();
    monitor.last_checked_at = Some(result.checked_at.clone());

    if result.status == "offline" || result.status == "error" {
        monitor.consecutive_failures += 1;

        if monitor.consecutive_failures >= monitor.alert_threshold {
            let incident = Incident {
                id: uuid::Uuid::new_v4().to_string(),
                monitor_id: monitor_id.clone(),
                level: "P1".into(),
                summary: format!("{} 连续 {} 次检测失败", monitor_name, monitor.consecutive_failures),
                ai_diagnosis: Some("建议检查目标服务是否正常运行，或确认网络连通性".into()),
                first_action: Some("ping 目标地址; 检查服务进程; 查看服务日志".into()),
                opened_at: Some(chrono::Utc::now().to_rfc3339()),
                recovered_at: None,
            };
            database::insert_incident(&db, &incident)?;
            log::warn!("告警触发: {} -> {}", monitor_name, incident.summary);
        }
    } else {
        monitor.consecutive_failures = 0;
    }

    database::upsert_monitor(&db, &monitor)?;

    Ok(result)
}

/// 获取活跃告警
#[tauri::command]
pub fn get_active_incidents(
    state: State<AppState>,
) -> Result<Vec<Incident>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;
    database::get_active_incidents(&db)
}
