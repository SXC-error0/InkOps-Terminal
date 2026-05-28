use serde::{Deserialize, Serialize};

/// 电子墨水屏设备
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Device {
    pub id: String,
    pub name: String,
    pub ip: Option<String>,
    pub model: String,
    pub firmware_version: Option<String>,
    pub last_seen: Option<String>,
    pub status: DeviceStatus,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DeviceStatus {
    Online,
    Offline,
    Error,
}

impl Device {
    pub fn from_row(row: &rusqlite::Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get("id")?,
            name: row.get("name")?,
            ip: row.get("ip")?,
            model: row.get("model")?,
            firmware_version: row.get("firmware_version")?,
            last_seen: row.get("last_seen")?,
            status: row
                .get::<_, String>("status")
                .map(|s| match s.as_str() {
                    "online" => DeviceStatus::Online,
                    "offline" => DeviceStatus::Offline,
                    _ => DeviceStatus::Error,
                })
                .unwrap_or(DeviceStatus::Offline),
            created_at: row.get("created_at")?,
        })
    }
}
