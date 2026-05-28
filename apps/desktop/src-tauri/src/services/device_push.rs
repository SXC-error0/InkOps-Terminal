use crate::error::AppError;
use std::path::Path;

/// 4.2 寸墨水屏参数
const EPD_WIDTH: u32 = 400;
const EPD_HEIGHT: u32 = 300;
const BITMAP_SIZE: usize = ((EPD_WIDTH / 8) * EPD_HEIGHT) as usize; // 15000

/// 检测设备固件类型
#[derive(Debug, PartialEq)]
enum FirmwareType {
    /// InkBridge 自定义固件 (本项目)
    InkBridge,
    /// 微雪原厂 Loader 固件
    WaveshareLoader,
}

/// 将 PNG 转为 1-bit 位图并推送到 ESP8266 设备
///
/// 自动检测固件类型并选择对应协议:
/// - InkBridge: POST raw binary → /api/display/frame, POST /api/display/refresh
/// - Waveshare Loader: POST hex-encoded → /LOAD
pub async fn push_png_to_device(
    png_path: &Path,
    device_ip: &str,
) -> Result<(), AppError> {
    let bitmap = png_to_bitmap(png_path)?;
    let fw = detect_firmware(device_ip).await;

    match fw {
        FirmwareType::InkBridge => push_inkbridge(device_ip, &bitmap).await,
        FirmwareType::WaveshareLoader => push_loader(device_ip, &bitmap).await,
    }
}

/// 获取设备状态 (InkBridge 协议)
pub async fn get_device_status(device_ip: &str) -> Result<String, AppError> {
    let url = format!("http://{device_ip}/api/device/status");
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()?;
    let resp = client.get(&url).send().await?;
    Ok(resp.text().await?)
}

/// 检测设备固件类型
async fn detect_firmware(device_ip: &str) -> FirmwareType {
    let url = format!("http://{device_ip}/api/device/health");
    if let Ok(client) = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
    {
        if let Ok(resp) = client.get(&url).send().await {
            if resp.status().is_success() {
                log::info!("检测到 InkBridge 固件 @ {device_ip}");
                return FirmwareType::InkBridge;
            }
        }
    }
    log::info!("未检测到 InkBridge, 回退 Loader 协议 @ {device_ip}");
    FirmwareType::WaveshareLoader
}

/// InkBridge 协议: 上传帧数据 + 触发刷新
async fn push_inkbridge(device_ip: &str, bitmap: &[u8]) -> Result<(), AppError> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?;

    // 1. 上传帧数据 (RAW binary body)
    let frame_url = format!("http://{device_ip}/api/display/frame");
    let resp = client
        .post(&frame_url)
        .body(bitmap.to_vec())
        .send()
        .await?;

    if !resp.status().is_success() {
        let err = resp.text().await.unwrap_or_default();
        return Err(AppError::Validation(format!("帧上传失败: {err}")));
    }
    log::info!("帧数据已上传: {device_ip} ({byte_len} 字节)", byte_len = bitmap.len());

    // 2. 触发刷新
    let refresh_url = format!("http://{device_ip}/api/display/refresh");
    let resp = client.post(&refresh_url).send().await?;

    if !resp.status().is_success() {
        return Err(AppError::Validation("屏幕刷新指令失败".into()));
    }
    log::info!("屏幕刷新指令已发送: {device_ip}");
    Ok(())
}

/// Waveshare Loader 协议: hex 编码 + 长度标记 + URL query
async fn push_loader(device_ip: &str, bitmap: &[u8]) -> Result<(), AppError> {
    // 编码为微雪协议: 每字节 → 2 字符 (a=0x0, p=0xF)
    let mut encoded = String::with_capacity(bitmap.len() * 2 + 12);
    for byte in bitmap {
        encoded.push(byte_to_char(byte & 0x0F));
        encoded.push(byte_to_char((byte >> 4) & 0x0F));
    }

    // 数据长度 (4 字符) + "LOAD"
    let data_len = bitmap.len() as u32;
    encoded.push(byte_to_char((data_len & 0xF) as u8));
    encoded.push(byte_to_char(((data_len >> 4) & 0xF) as u8));
    encoded.push(byte_to_char(((data_len >> 8) & 0xF) as u8));
    encoded.push(byte_to_char(((data_len >> 12) & 0xF) as u8));
    encoded.push_str("LOAD");

    let url = format!("http://{device_ip}/LOAD");
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?;

    let resp = client.post(&url).query(&[(&encoded,)]).send().await?;

    if !resp.status().is_success() {
        return Err(AppError::DeviceUnreachable);
    }
    log::info!("图片已通过 Loader 协议推送: {device_ip} ({byte_len} 字节)", byte_len = bitmap.len());
    Ok(())
}

/// 将 PNG 图片转换为 1-bit 位图
/// 输出: 每字节 8 像素, MSB first (与 ESP8266 SPI 一致)
fn png_to_bitmap(path: &Path) -> Result<Vec<u8>, AppError> {
    let img = image::open(path)?;
    let gray = img.to_luma8();
    let raw = gray.as_raw();
    let width = gray.width();
    let height = gray.height();
    let bytes_per_row = (width + 7) / 8;

    let mut bitmap = vec![0u8; (bytes_per_row * height) as usize];

    for y in 0..height {
        for x in 0..width {
            let pixel = raw[(y * width + x) as usize];
            // 阈值 128: 白色(>128) → 0, 黑色(≤128) → 1
            if pixel <= 128 {
                let byte_idx = (y * bytes_per_row + x / 8) as usize;
                let bit_idx = 7 - (x % 8); // MSB first
                bitmap[byte_idx] |= 1 << bit_idx;
            }
        }
    }

    Ok(bitmap)
}

/// 4-bit → 微雪协议字符 ('a' = 0x0, 'p' = 0xF)
fn byte_to_char(b: u8) -> char {
    (b + b'a').into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_byte_to_char() {
        assert_eq!(byte_to_char(0x0), 'a');
        assert_eq!(byte_to_char(0xF), 'p');
        assert_eq!(byte_to_char(0x5), 'f');
    }

    #[test]
    fn test_bitmap_size() {
        assert_eq!(BITMAP_SIZE, 15000);
    }
}
