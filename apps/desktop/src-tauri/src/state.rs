use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

/// 应用全局状态
pub struct AppState {
    pub db: Mutex<Connection>,
    pub data_dir: PathBuf,
}
