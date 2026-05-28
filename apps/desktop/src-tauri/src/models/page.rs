use serde::{Deserialize, Serialize};

/// 页面类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PageType {
    Quest,
    Terminal,
    Launch,
    Alert,
    Postcard,
    Report,
}

/// 模板 ID
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TemplateId {
    QuestScroll,
    TerminalStatus,
    LaunchPanel,
    SystemAlert,
    Postcard,
    ReleaseNews,
}

/// 优先级 P0-P5
pub type Priority = i32;

/// 紧急程度
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Urgency {
    Critical,
    Important,
    Normal,
    Low,
}

/// 页面状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PageStatus {
    Draft,
    Ready,
    Pushed,
    Archived,
    Failed,
}

/// 页面核心模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Page {
    pub id: String,
    #[serde(rename = "type")]
    pub page_type: String,
    pub template_id: String,
    pub priority: Priority,
    pub urgency: String,
    pub interruptible: bool,
    pub expires_at: Option<String>,
    pub display_duration: Option<i32>,
    pub emotion: Option<String>,
    pub trigger_source: Option<String>,
    pub reason: Option<String>,
    pub payload: serde_json::Value,
    pub image_path: Option<String>,
    pub status: String,
    pub created_at: Option<String>,
    pub pushed_at: Option<String>,
}

impl Page {
    pub fn from_row(row: &rusqlite::Row) -> rusqlite::Result<Self> {
        let payload_str: String = row.get("payload")?;
        let payload: serde_json::Value =
            serde_json::from_str(&payload_str).unwrap_or(serde_json::Value::Null);

        Ok(Self {
            id: row.get("id")?,
            page_type: row.get("type")?,
            template_id: row.get("template_id")?,
            priority: row.get("priority")?,
            urgency: row.get("urgency")?,
            interruptible: row.get::<_, i32>("interruptible")? != 0,
            expires_at: row.get("expires_at")?,
            display_duration: row.get("display_duration")?,
            emotion: row.get("emotion")?,
            trigger_source: row.get("trigger_source")?,
            reason: row.get("reason")?,
            payload,
            image_path: row.get("image_path")?,
            status: row.get("status")?,
            created_at: row.get("created_at")?,
            pushed_at: row.get("pushed_at")?,
        })
    }
}

/// 创建页面输入
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePageInput {
    #[serde(rename = "type")]
    pub page_type: String,
    pub template_id: String,
    pub priority: Option<Priority>,
    pub urgency: Option<String>,
    pub interruptible: Option<bool>,
    pub display_duration: Option<i32>,
    pub emotion: Option<String>,
    pub trigger_source: Option<String>,
    pub reason: Option<String>,
    pub payload: serde_json::Value,
}
