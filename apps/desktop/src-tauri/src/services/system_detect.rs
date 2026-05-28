
/// 系统模式
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SystemMode {
    Full,
    #[serde(rename = "no_ai")]
    NoAi,
    #[serde(rename = "no_device")]
    NoDevice,
    Offline,
    #[serde(rename = "safe_mode")]
    SafeMode,
}

/// 检测当前系统运行模式
pub async fn detect() -> SystemMode {
    // 按优先级从严格到宽松检测
    // safe_mode: 只保留基本功能
    // offline: 无网络
    // no_device: 设备不可达
    // no_ai: AI 服务不可用
    // full: 一切正常

    let network_ok = check_network().await;
    if !network_ok {
        return SystemMode::Offline;
    }

    let device_ok = check_device().await;
    if !device_ok {
        return SystemMode::NoDevice;
    }

    // MVP 阶段 AI 模拟永远可用
    SystemMode::Full
}

impl SystemMode {
    pub fn label(&self) -> &str {
        match self {
            SystemMode::Full => "全部系统正常",
            SystemMode::NoAi => "AI 引擎离线",
            SystemMode::NoDevice => "设备未连接",
            SystemMode::Offline => "离线模式",
            SystemMode::SafeMode => "安全模式",
        }
    }
}

async fn check_network() -> bool {
    match reqwest::get("https://github.com").await {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}

async fn check_device() -> bool {
    // MVP: 尝试连接默认设备地址
    // 从数据库读取设备 IP，这里先使用常见默认地址
    let urls = [
        "http://192.168.4.1/api/device/health", // ESP8266 AP 模式
        "http://192.168.1.100/api/device/health", // 常见局域网地址
    ];

    for url in &urls {
        if let Ok(resp) = reqwest::Client::new()
            .head(*url)
            .timeout(std::time::Duration::from_secs(3))
            .send()
            .await
        {
            if resp.status().is_success() {
                return true;
            }
        }
    }
    false
}
