use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Incident {
    pub id: String,
    pub monitor_id: String,
    pub level: String,
    pub summary: String,
    pub ai_diagnosis: Option<String>,
    pub first_action: Option<String>,
    pub opened_at: Option<String>,
    pub recovered_at: Option<String>,
}

impl Incident {
    pub fn from_row(row: &rusqlite::Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get("id")?,
            monitor_id: row.get("monitor_id")?,
            level: row.get("level")?,
            summary: row.get("summary")?,
            ai_diagnosis: row.get("ai_diagnosis")?,
            first_action: row.get("first_action")?,
            opened_at: row.get("opened_at")?,
            recovered_at: row.get("recovered_at")?,
        })
    }
}
