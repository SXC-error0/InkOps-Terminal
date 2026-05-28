use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub sender_name: Option<String>,
    pub text: String,
    pub safety_status: String,
    pub page_id: Option<String>,
    pub created_at: Option<String>,
}

impl Message {
    pub fn from_row(row: &rusqlite::Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get("id")?,
            sender_name: row.get("sender_name")?,
            text: row.get("text")?,
            safety_status: row.get("safety_status")?,
            page_id: row.get("page_id")?,
            created_at: row.get("created_at")?,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageInput {
    pub sender_name: Option<String>,
    pub text: String,
}
