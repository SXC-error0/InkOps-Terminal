/// 所有数据库建表语句
pub const ALL_MIGRATIONS: &str = r#"
-- 设备表
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'NODE-01',
    ip TEXT,
    model TEXT DEFAULT '4.2inch-e-paper',
    firmware_version TEXT,
    last_seen TEXT,
    status TEXT DEFAULT 'offline',
    created_at TEXT DEFAULT (datetime('now'))
);

-- 页面表（核心表）
CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    template_id TEXT NOT NULL,
    priority INTEGER DEFAULT 2,
    urgency TEXT DEFAULT 'normal',
    interruptible INTEGER DEFAULT 1,
    expires_at TEXT,
    display_duration INTEGER,
    emotion TEXT,
    trigger_source TEXT,
    reason TEXT,
    payload TEXT NOT NULL,
    image_path TEXT,
    status TEXT DEFAULT 'draft',
    created_at TEXT DEFAULT (datetime('now')),
    pushed_at TEXT
);

-- 显示日志
CREATE TABLE IF NOT EXISTS display_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id TEXT NOT NULL REFERENCES pages(id),
    device_id TEXT NOT NULL REFERENCES devices(id),
    pushed_at TEXT DEFAULT (datetime('now')),
    result TEXT,
    error_message TEXT
);

-- 监控配置
CREATE TABLE IF NOT EXISTS monitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_type TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    interval_seconds INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 10,
    status TEXT DEFAULT 'unknown',
    consecutive_failures INTEGER DEFAULT 0,
    alert_threshold INTEGER DEFAULT 3,
    last_checked_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 告警记录
CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    monitor_id TEXT NOT NULL REFERENCES monitors(id),
    level TEXT DEFAULT 'P1',
    summary TEXT NOT NULL,
    ai_diagnosis TEXT,
    first_action TEXT,
    opened_at TEXT DEFAULT (datetime('now')),
    recovered_at TEXT
);

-- 留言
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_name TEXT,
    text TEXT NOT NULL,
    safety_status TEXT DEFAULT 'pending',
    page_id TEXT REFERENCES pages(id),
    created_at TEXT DEFAULT (datetime('now'))
);

-- 设置（键值对）
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_created_at ON pages(created_at);
CREATE INDEX IF NOT EXISTS idx_display_logs_page_id ON display_logs(page_id);
CREATE INDEX IF NOT EXISTS idx_display_logs_device_id ON display_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_messages_safety ON messages(safety_status);
"#;
