use crate::error::AppError;
use crate::models::Page;
use image::{GrayImage, Luma};
use std::path::Path;

/// 页面渲染器: 400x300 黑白 PNG
const WIDTH: u32 = 400;
const HEIGHT: u32 = 300;

/// 根据模板 ID 渲染页面，返回图片路径
pub fn render_page(page: &Page, data_dir: &Path) -> Result<String, AppError> {
    let mut img = GrayImage::new(WIDTH, HEIGHT);

    // 白色背景
    for pixel in img.pixels_mut() {
        *pixel = Luma([255u8]);
    }

    match page.template_id.as_str() {
        "QUEST_SCROLL" => render_quest_scroll(&mut img, &page.payload)?,
        "TERMINAL_STATUS" => render_terminal_status(&mut img, &page.payload)?,
        "LAUNCH_PANEL" => render_launch_panel(&mut img, &page.payload)?,
        "SYSTEM_ALERT" => render_system_alert(&mut img, &page.payload)?,
        "POSTCARD" => render_postcard(&mut img, &page.payload)?,
        "RELEASE_NEWS" => render_release_news(&mut img, &page.payload)?,
        _ => render_quest_scroll(&mut img, &page.payload)?,
    }

    // 保存 PNG
    let previews_dir = data_dir.join("previews");
    std::fs::create_dir_all(&previews_dir)?;
    let path = previews_dir.join(format!("{}.png", page.id));
    img.save(&path)?;

    Ok(path.to_string_lossy().to_string())
}

// ============ 每个模板的渲染函数 ============

/// QUEST_SCROLL: RPG 任务卷轴
fn render_quest_scroll(
    img: &mut GrayImage,
    payload: &serde_json::Value,
) -> Result<(), AppError> {
    let main: &str = payload["mainQuest"].as_str().unwrap_or("未设主线");
    let boss: &str = payload["bossName"].as_str().unwrap_or("???");
    let weakness: &str = payload["bossWeakness"].as_str().unwrap_or("???");
    let ban: &str = payload["ban"].as_str().unwrap_or("");
    let reward: &str = payload["reward"].as_str().unwrap_or("");
    let declaration: &str = payload["declaration"].as_str().unwrap_or("");

    // 标题栏 (y: 8-28)
    draw_text_block(img, 10, 8, 380, "══ QUEST SCROLL ══", true);

    // 主线 (y: 36-80)
    draw_text_block(img, 10, 36, 380, "★ 主线任务", true);
    draw_text_block(img, 16, 52, 370, &truncate(main, 50), false);
    draw_text_block(img, 16, 66, 370, "━━━━━━━━━━━━━━━━", false);

    // Boss 区块 (y: 90-140)
    draw_text_block(img, 10, 90, 380, "☠ BOSS", true);
    draw_text_block(img, 16, 106, 180, boss, false);
    draw_text_block(img, 200, 106, 190, &format!("弱点: {weakness}"), false);

    // 禁律 (y: 150-180)
    draw_text_block(img, 10, 150, 380, &format!("🚫 禁令: {ban}"), false);

    // 奖励 (y: 190-210)
    draw_text_block(img, 10, 190, 380, &format!("🏆 奖励: {reward}"), false);

    // 支线 (y: 220-270)
    if let Some(side_quests) = payload["sideQuests"].as_array() {
        draw_text_block(img, 10, 220, 380, "◆ 支线任务", true);
        let mut y = 236;
        for sq in side_quests.iter().take(2) {
            let text = sq.as_str().unwrap_or("");
            draw_text_block(img, 16, y, 370, &format!("· {text}"), false);
            y += 16;
        }
    }

    // 底部宣言 (y: 280-290)
    draw_text_block(img, 10, 280, 380, &format!("「{declaration}」"), true);

    Ok(())
}

/// TERMINAL_STATUS: 终端状态面板
fn render_terminal_status(
    img: &mut GrayImage,
    payload: &serde_json::Value,
) -> Result<(), AppError> {
    let project = payload["activeProject"].as_str().unwrap_or("InkOps Terminal");
    let commits = payload["todayCommits"].as_i64().unwrap_or(0);
    let status = payload["serverStatus"].as_str().unwrap_or("ONLINE");
    let progress = payload["mvpProgress"].as_i64().unwrap_or(0);
    let focus = payload["currentFocus"].as_str().unwrap_or("...");

    draw_text_block(img, 10, 8, 380, "══ TERMINAL STATUS ══", true);
    draw_text_block(img, 10, 36, 380, &format!("PROJECT: {project}"), false);
    draw_text_block(img, 10, 56, 380, &format!("COMMITS: {commits}"), false);
    draw_text_block(img, 10, 76, 380, &format!("SERVERS: {status}"), false);
    draw_text_block(img, 10, 100, 380, &format!("MVP [{progress}%]"), false);
    // 简易进度条
    let bar_width = (progress as u32 * 380 / 100).min(380);
    for x in 10..10 + bar_width {
        for y in 120..128 {
            if x < WIDTH && y < HEIGHT {
                img.put_pixel(x, y, Luma([0u8]));
            }
        }
    }
    draw_text_block(img, 10, 140, 380, &format!("FOCUS: {focus}"), false);
    draw_text_block(img, 10, 200, 380, "━━━━━━━━━━━━━━━━", false);
    draw_text_block(img, 10, 220, 380, &format!("STREAK: {} days", payload["githubStreak"].as_i64().unwrap_or(0)), false);

    Ok(())
}

/// SYSTEM_ALERT: 系统告警
fn render_system_alert(
    img: &mut GrayImage,
    payload: &serde_json::Value,
) -> Result<(), AppError> {
    let service = payload["service"].as_str().unwrap_or("Unknown");
    let impact = payload["impact"].as_str().unwrap_or("正在评估");
    let action = payload["firstAction"].as_str().unwrap_or("检查服务状态");

    draw_text_block(img, 10, 8, 380, "══ SYSTEM ALERT ══", true);
    // 大警告框
    draw_rect(img, 20, 36, 360, 80, 2);
    draw_text_block(img, 30, 44, 340, "⚠️  ALERT", true);
    draw_text_block(img, 30, 64, 340, &format!("服务: {service}"), false);
    draw_text_block(img, 30, 84, 340, &format!("影响: {impact}"), false);

    draw_text_block(img, 10, 140, 380, "建议操作:", true);
    draw_text_block(img, 16, 160, 370, action, false);

    let now = chrono::Utc::now().format("%H:%M:%S").to_string();
    draw_text_block(img, 10, 210, 380, &format!("检测时间: {now}"), false);

    Ok(())
}

/// LAUNCH_PANEL: 产品发布控制台
fn render_launch_panel(
    img: &mut GrayImage,
    payload: &serde_json::Value,
) -> Result<(), AppError> {
    let name = payload["name"].as_str().unwrap_or("Project");
    let goal = payload["goal"].as_str().unwrap_or("定义目标");
    let progress = payload["progress"].as_i64().unwrap_or(0);
    let instruction = payload["instruction"].as_str().unwrap_or("");
    let days = payload["countdownDays"].as_i64().unwrap_or(0);

    draw_text_block(img, 10, 8, 380, "══ LAUNCH CONTROL ══", true);
    draw_text_block(img, 10, 36, 380, &format!("项目: {name}"), false);
    draw_text_block(img, 10, 56, 380, &format!("目标: {goal}"), false);

    // 进度条
    draw_text_block(img, 10, 80, 380, &format!("进度 [{progress}%]"), false);
    let bar_width = (progress as u32 * 380 / 100).min(380);
    for x in 10..10 + bar_width {
        for y in 100..108 {
            if x < WIDTH && y < HEIGHT {
                img.put_pixel(x, y, Luma([0u8]));
            }
        }
    }

    // 倒计时
    draw_text_block(img, 10, 130, 380, &format!("倒计时: {days} 天"), false);

    // 今日指令
    if !instruction.is_empty() {
        draw_rect(img, 10, 160, 380, 80, 2);
        draw_text_block(img, 20, 170, 360, "今日唯一指令:", true);
        draw_text_block(img, 20, 195, 360, instruction, false);
    }

    Ok(())
}

/// POSTCARD: 明信片留言
fn render_postcard(
    img: &mut GrayImage,
    payload: &serde_json::Value,
) -> Result<(), AppError> {
    let text = payload["text"].as_str().unwrap_or("");
    let sender = payload["sender"].as_str().unwrap_or("匿名");
    let timestamp = payload["createdAt"].as_str().unwrap_or("");

    draw_text_block(img, 10, 8, 380, "══ POSTCARD ══", true);

    // 信封框
    draw_rect(img, 15, 36, 370, 180, 1);

    // 留言内容（居中）
    draw_text_block(img, 25, 50, 350, &truncate(text, 160), false);

    // 分隔线
    draw_text_block(img, 25, 150, 350, "──────────────", false);

    // 署名
    draw_text_block(img, 25, 170, 350, &format!("— {sender}"), false);

    // 时间
    draw_text_block(img, 25, 190, 350, timestamp, false);

    // QR 占位 (右下角)
    draw_rect(img, 320, 230, 60, 60, 1);
    draw_text_block(img, 330, 248, 45, "QR", true);

    Ok(())
}

/// RELEASE_NEWS: 发布战报
fn render_release_news(
    img: &mut GrayImage,
    payload: &serde_json::Value,
) -> Result<(), AppError> {
    let headline = payload["headline"].as_str().unwrap_or("战报");
    let summary = payload["summary"].as_str().unwrap_or("");
    let next = payload["nextStep"].as_str().unwrap_or("");

    draw_text_block(img, 10, 8, 380, "══ BATTLE REPORT ══", true);

    // 头条
    draw_text_block(img, 10, 40, 380, &format!("📢 {headline}"), true);

    // 摘要
    draw_text_block(img, 10, 70, 380, &truncate(summary, 140), false);

    // 下一步
    draw_text_block(img, 10, 180, 380, "下一步:", true);
    draw_text_block(img, 16, 200, 370, &truncate(next, 80), false);

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M").to_string();
    draw_text_block(img, 10, 275, 380, &format!("发布时间: {now}"), false);

    Ok(())
}

// ============ 基础绘图辅助函数 ============

/// 用 ASCII 字符「画」文字块 — 在 MVP 阶段用简单像素绘制
/// 后续可替换为 rusttype/imageproc 字体渲染
fn draw_text_block(img: &mut GrayImage, x: u32, y: u32, _max_width: u32, text: &str, bold: bool) {
    // MVP: 在屏幕左上角用像素标点表示文本位置
    // 后续集成字体渲染后替换此函数
    let lines = wrap_text(text, _max_width);
    let mut cy = y;
    for line in &lines {
        if cy < HEIGHT {
            // 文本位置标记: 在 x 处画一个 2px 高的线
            let line_len = (line.len() as u32 * 6).min(WIDTH.saturating_sub(x));
            if bold {
                for dx in 0..line_len {
                    if x + dx < WIDTH && cy < HEIGHT {
                        img.put_pixel(x + dx, cy, Luma([0u8]));
                    }
                    if x + dx < WIDTH && cy + 1 < HEIGHT {
                        img.put_pixel(x + dx, cy + 1, Luma([0u8]));
                    }
                }
            } else {
                for dx in 0..line_len {
                    if x + dx < WIDTH && cy < HEIGHT {
                        img.put_pixel(x + dx, cy, Luma([0u8]));
                    }
                }
            }
        }
        cy += if bold { 14 } else { 11 };
    }
}

/// 绘制矩形边框
fn draw_rect(img: &mut GrayImage, x: u32, y: u32, w: u32, h: u32, line_width: u32) {
    let lw = line_width.min(3);
    for dy in 0..h {
        for dx in 0..w {
            let px = x + dx;
            let py = y + dy;
            if px < WIDTH && py < HEIGHT {
                let is_border = dx < lw || dx >= w - lw || dy < lw || dy >= h - lw;
                if is_border {
                    img.put_pixel(px, py, Luma([0u8]));
                }
            }
        }
    }
}

/// 简易文本换行（按字符宽度估算）
fn wrap_text(text: &str, max_width: u32) -> Vec<String> {
    let max_chars = (max_width / 6).max(20) as usize;
    let mut lines = Vec::new();
    let mut current = String::new();

    for ch in text.chars() {
        if ch == '\n' || current.len() >= max_chars {
            lines.push(current.clone());
            current.clear();
            if ch == '\n' {
                continue;
            }
        }
        current.push(ch);
    }
    if !current.is_empty() {
        lines.push(current);
    }
    lines
}

fn truncate(text: &str, max_len: usize) -> String {
    let t: String = text.chars().take(max_len).collect();
    if text.chars().count() > max_len {
        format!("{t}...")
    } else {
        t
    }
}
