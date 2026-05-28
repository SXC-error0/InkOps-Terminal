use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayLog {
    pub id: i64,
    pub page_id: String,
    pub device_id: String,
    pub pushed_at: Option<String>,
    pub result: Option<String>,
    pub error_message: Option<String>,
}

impl DisplayLog {
    pub fn from_row(row: &rusqlite::Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get("id")?,
            page_id: row.get("page_id")?,
            device_id: row.get("device_id")?,
            pushed_at: row.get("pushed_at")?,
            result: row.get("result")?,
            error_message: row.get("error_message")?,
        })
    }
}
