use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("HTTP 错误: {0}")]
    Http(#[from] reqwest::Error),
    #[error("图片错误: {0}")]
    Image(#[from] image::ImageError),
    #[error("未找到: {0}")]
    NotFound(String),
    #[error("校验失败: {0}")]
    Validation(String),
    #[error("AI 服务不可用")]
    AiUnavailable,
    #[error("设备不可达")]
    DeviceUnreachable,
    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON 错误: {0}")]
    Json(#[from] serde_json::Error),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
