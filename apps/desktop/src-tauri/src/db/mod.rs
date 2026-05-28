mod migrations;

use crate::error::AppError;
use rusqlite::Connection;
use std::path::Path;

pub struct Database;

impl Database {
    /// 打开数据库连接
    pub fn open(path: &Path) -> Result<Connection, AppError> {
        let conn = Connection::open(path)?;
        // 启用 WAL 模式以支持并发读写
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
        Ok(conn)
    }

    /// 执行所有数据库迁移
    pub fn run_migrations(conn: &Connection) -> Result<(), AppError> {
        conn.execute_batch(migrations::ALL_MIGRATIONS)?;
        log::info!("数据库迁移完成");
        Ok(())
    }
}
