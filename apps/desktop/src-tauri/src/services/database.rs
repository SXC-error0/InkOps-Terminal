use crate::error::AppError;
use rusqlite::{params, Connection};

use crate::models::{
    Device, DisplayLog, Incident, Message, Monitor, Page, Setting,
};

// ============ 页面操作 ============

pub fn insert_page(conn: &Connection, page: &Page) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO pages (id, type, template_id, priority, urgency, interruptible,
         expires_at, display_duration, emotion, trigger_source, reason, payload,
         image_path, status, created_at, pushed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        params![
            page.id,
            page.page_type,
            page.template_id,
            page.priority,
            page.urgency,
            page.interruptible as i32,
            page.expires_at,
            page.display_duration,
            page.emotion,
            page.trigger_source,
            page.reason,
            page.payload.to_string(),
            page.image_path,
            page.status,
            page.created_at,
            page.pushed_at,
        ],
    )?;
    Ok(())
}

pub fn update_page_image_path(
    conn: &Connection,
    page_id: &str,
    image_path: &str,
) -> Result<(), AppError> {
    conn.execute(
        "UPDATE pages SET image_path = ?1 WHERE id = ?2",
        params![image_path, page_id],
    )?;
    Ok(())
}

pub fn update_page_status(
    conn: &Connection,
    page_id: &str,
    status: &str,
) -> Result<(), AppError> {
    conn.execute(
        "UPDATE pages SET status = ?1, pushed_at = datetime('now') WHERE id = ?2",
        params![status, page_id],
    )?;
    Ok(())
}

pub fn get_current_page(conn: &Connection) -> Result<Option<Page>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT * FROM pages WHERE status = 'pushed' ORDER BY pushed_at DESC LIMIT 1",
    )?;
    let mut rows = stmt.query_map([], |row| Page::from_row(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn get_page_by_id(conn: &Connection, page_id: &str) -> Result<Option<Page>, AppError> {
    let mut stmt = conn.prepare("SELECT * FROM pages WHERE id = ?1")?;
    let mut rows = stmt.query_map(params![page_id], |row| Page::from_row(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn get_page_history(
    conn: &Connection,
    limit: Option<u32>,
) -> Result<Vec<Page>, AppError> {
    let limit = limit.unwrap_or(50);
    let mut stmt = conn.prepare(
        "SELECT * FROM pages ORDER BY created_at DESC LIMIT ?1",
    )?;
    let pages: Result<Vec<_>, _> = stmt
        .query_map(params![limit], |row| Page::from_row(row))?
        .collect();
    Ok(pages?)
}

pub fn get_candidate_pages(conn: &Connection) -> Result<Vec<Page>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT * FROM pages WHERE status IN ('draft', 'ready') ORDER BY priority ASC, created_at DESC LIMIT 20",
    )?;
    let pages: Result<Vec<_>, _> = stmt
        .query_map([], |row| Page::from_row(row))?
        .collect();
    Ok(pages?)
}

// ============ 设备操作 ============

pub fn get_device(conn: &Connection) -> Result<Option<Device>, AppError> {
    let mut stmt = conn.prepare("SELECT * FROM devices LIMIT 1")?;
    let mut rows = stmt.query_map([], |row| Device::from_row(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn get_device_by_id(
    conn: &Connection,
    device_id: &str,
) -> Result<Option<Device>, AppError> {
    let mut stmt = conn.prepare("SELECT * FROM devices WHERE id = ?1")?;
    let mut rows = stmt.query_map(params![device_id], |row| Device::from_row(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn upsert_device(conn: &Connection, device: &Device) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO devices (id, name, ip, model, firmware_version, last_seen, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), ?6, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, ip = excluded.ip, last_seen = datetime('now'),
         status = excluded.status, firmware_version = excluded.firmware_version",
        params![
            device.id,
            device.name,
            device.ip,
            device.model,
            device.firmware_version,
            serde_json::to_string(&device.status).unwrap_or_default().trim_matches('"'),
        ],
    )?;
    Ok(())
}

// ============ 显示日志 ============

pub fn insert_display_log(conn: &Connection, log: &DisplayLog) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO display_logs (page_id, device_id, pushed_at, result, error_message)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            log.page_id,
            log.device_id,
            log.pushed_at,
            log.result,
            log.error_message,
        ],
    )?;
    Ok(())
}

pub fn get_display_logs(
    conn: &Connection,
    device_id: &str,
    limit: Option<u32>,
) -> Result<Vec<DisplayLog>, AppError> {
    let limit = limit.unwrap_or(50);
    let mut stmt = conn.prepare(
        "SELECT * FROM display_logs WHERE device_id = ?1 ORDER BY pushed_at DESC LIMIT ?2",
    )?;
    let logs: Result<Vec<_>, _> = stmt
        .query_map(params![device_id, limit], |row| DisplayLog::from_row(row))?
        .collect();
    Ok(logs?)
}

// ============ 监控操作 ============

pub fn get_monitors(conn: &Connection) -> Result<Vec<Monitor>, AppError> {
    let mut stmt = conn.prepare("SELECT * FROM monitors ORDER BY created_at DESC")?;
    let monitors: Result<Vec<_>, _> =
        stmt.query_map([], |row| Monitor::from_row(row))?.collect();
    Ok(monitors?)
}

pub fn get_monitor_by_id(
    conn: &Connection,
    monitor_id: &str,
) -> Result<Option<Monitor>, AppError> {
    let mut stmt = conn.prepare("SELECT * FROM monitors WHERE id = ?1")?;
    let mut rows = stmt.query_map(params![monitor_id], |row| Monitor::from_row(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn upsert_monitor(conn: &Connection, monitor: &Monitor) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO monitors (id, name, target_type, endpoint, interval_seconds,
         timeout_seconds, status, consecutive_failures, alert_threshold, last_checked_at, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, status = excluded.status,
         consecutive_failures = excluded.consecutive_failures,
         last_checked_at = excluded.last_checked_at",
        params![
            monitor.id,
            monitor.name,
            monitor.target_type,
            monitor.endpoint,
            monitor.interval_seconds,
            monitor.timeout_seconds,
            monitor.status,
            monitor.consecutive_failures,
            monitor.alert_threshold,
            monitor.last_checked_at,
        ],
    )?;
    Ok(())
}

// ============ 告警操作 ============

pub fn insert_incident(conn: &Connection, incident: &Incident) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO incidents (id, monitor_id, level, summary, ai_diagnosis, first_action, opened_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))",
        params![
            incident.id,
            incident.monitor_id,
            incident.level,
            incident.summary,
            incident.ai_diagnosis,
            incident.first_action,
        ],
    )?;
    Ok(())
}

pub fn get_active_incidents(conn: &Connection) -> Result<Vec<Incident>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT * FROM incidents WHERE recovered_at IS NULL ORDER BY opened_at DESC",
    )?;
    let incidents: Result<Vec<_>, _> =
        stmt.query_map([], |row| Incident::from_row(row))?.collect();
    Ok(incidents?)
}

// ============ 留言操作 ============

pub fn insert_message(conn: &Connection, message: &Message) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO messages (id, sender_name, text, safety_status, page_id, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))",
        params![
            message.id,
            message.sender_name,
            message.text,
            message.safety_status,
            message.page_id,
        ],
    )?;
    Ok(())
}

pub fn get_messages(conn: &Connection, limit: Option<u32>) -> Result<Vec<Message>, AppError> {
    let limit = limit.unwrap_or(50);
    let mut stmt = conn.prepare(
        "SELECT * FROM messages WHERE safety_status = 'approved' ORDER BY created_at DESC LIMIT ?1",
    )?;
    let messages: Result<Vec<_>, _> = stmt
        .query_map(params![limit], |row| Message::from_row(row))?
        .collect();
    Ok(messages?)
}

// ============ 设置操作 ============

pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<Setting>, AppError> {
    let mut stmt = conn.prepare("SELECT * FROM settings WHERE key = ?1")?;
    let mut rows = stmt.query_map(params![key], |row| Setting::from_row(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        params![key, value],
    )?;
    Ok(())
}
