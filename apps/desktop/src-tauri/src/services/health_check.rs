use crate::models::monitor::HealthCheckResult;

/// HTTP 健康检测 — 对指定 URL 发送 HEAD 请求，返回状态和延迟
pub async fn check_endpoint(
    monitor_id: &str,
    url: &str,
    timeout_secs: u64,
) -> HealthCheckResult {
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(timeout_secs))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return HealthCheckResult {
                monitor_id: monitor_id.into(),
                status: "error".into(),
                status_code: None,
                latency_ms: 0,
                error: Some(format!("创建 HTTP 客户端失败: {e}")),
                checked_at: chrono::Utc::now().to_rfc3339(),
            };
        }
    };

    let start = std::time::Instant::now();
    let result = client.head(url).send().await;
    let latency_ms = start.elapsed().as_millis() as u64;
    let checked_at = chrono::Utc::now().to_rfc3339();

    match result {
        Ok(resp) => HealthCheckResult {
            monitor_id: monitor_id.into(),
            status: "online".into(),
            status_code: Some(resp.status().as_u16()),
            latency_ms,
            error: None,
            checked_at,
        },
        Err(e) => HealthCheckResult {
            monitor_id: monitor_id.into(),
            status: "offline".into(),
            status_code: None,
            latency_ms,
            error: Some(e.to_string()),
            checked_at,
        },
    }
}
