use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

/// 时间线事件（与前端 TimelineEvent 对齐）
#[derive(Debug, Clone, serde::Serialize)]
pub struct TimelineEventDto {
    pub id: String,
    #[serde(rename = "type")]
    pub event_type: String,
    pub message: String,
    pub timestamp: String,
}

/// 获取时间线事件（从页面和告警中提取）
#[tauri::command]
pub fn get_events(
    state: State<AppState>,
    limit: Option<u32>,
) -> Result<Vec<TimelineEventDto>, AppError> {
    let db = state.db.lock().map_err(|e| {
        AppError::Validation(format!("数据库锁失败: {e}"))
    })?;

    let limit = limit.unwrap_or(50);

    // 从数据库收集事件: 页面创建 + 页面推送 + 告警
    let mut events: Vec<TimelineEventDto> = vec![];

    // 最近创建的页面
    {
        let mut stmt = db.prepare(
            "SELECT id, type, reason, created_at FROM pages ORDER BY created_at DESC LIMIT ?1",
        )?;
        let rows = stmt.query_map(
            [limit],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, String>(3)?,
                ))
            },
        )?;

        for row in rows {
            let (id, ptype, reason, created_at) = row?;
            events.push(TimelineEventDto {
                id: format!("evt-page-{id}"),
                event_type: page_type_to_event(&ptype),
                message: reason.unwrap_or_else(|| format!("新页面: {ptype}")),
                timestamp: created_at,
            });
        }
    }

    // 活跃告警
    {
        let mut stmt = db.prepare(
            "SELECT id, summary, opened_at FROM incidents WHERE recovered_at IS NULL ORDER BY opened_at DESC LIMIT ?1",
        )?;
        let rows = stmt.query_map([limit], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        })?;

        for row in rows {
            let (id, summary, opened_at) = row?;
            events.push(TimelineEventDto {
                id: format!("evt-alert-{id}"),
                event_type: "alert".into(),
                message: summary,
                timestamp: opened_at,
            });
        }
    }

    // 按时间倒序，取 limit 条
    events.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    events.truncate(limit as usize);

    Ok(events)
}

fn page_type_to_event(ptype: &str) -> String {
    match ptype {
        "quest" => "quest",
        "terminal" => "commit",
        "launch" => "launch",
        "alert" => "alert",
        "postcard" => "message",
        _ => "system",
    }
    .into()
}
