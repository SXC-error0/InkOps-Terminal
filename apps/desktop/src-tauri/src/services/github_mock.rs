use crate::models::TerminalSummary;

/// 模拟 GitHub 数据 — 返回固定的仓库活动摘要
pub fn get_terminal_summary() -> TerminalSummary {
    TerminalSummary {
        active_project: "InkOps Terminal".into(),
        github_streak: 7,
        today_commits: 5,
        server_status: "ONLINE".into(),
        mvp_progress: 35,
        current_focus: "后端数据库与 Tauri 命令实现".into(),
    }
}
