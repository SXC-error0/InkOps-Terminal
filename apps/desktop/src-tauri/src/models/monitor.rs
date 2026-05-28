use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Monitor {
    pub id: String,
    pub name: String,
    pub target_type: String,
    pub endpoint: String,
    pub interval_seconds: i32,
    pub timeout_seconds: i32,
    pub status: String,
    pub consecutive_failures: i32,
    pub alert_threshold: i32,
    pub last_checked_at: Option<String>,
    pub created_at: Option<String>,
}

impl Monitor {
    pub fn from_row(row: &rusqlite::Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get("id")?,
            name: row.get("name")?,
            target_type: row.get("target_type")?,
            endpoint: row.get("endpoint")?,
            interval_seconds: row.get("interval_seconds")?,
            timeout_seconds: row.get("timeout_seconds")?,
            status: row.get("status")?,
            consecutive_failures: row.get("consecutive_failures")?,
            alert_threshold: row.get("alert_threshold")?,
            last_checked_at: row.get("last_checked_at")?,
            created_at: row.get("created_at")?,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMonitorInput {
    pub name: String,
    pub target_type: String,
    pub endpoint: String,
    pub interval_seconds: Option<i32>,
    pub timeout_seconds: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
    pub monitor_id: String,
    pub status: String,
    pub status_code: Option<u16>,
    pub latency_ms: u64,
    pub error: Option<String>,
    pub checked_at: String,
}
