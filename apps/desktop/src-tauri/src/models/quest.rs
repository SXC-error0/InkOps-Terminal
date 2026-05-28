use serde::{Deserialize, Serialize};

/// AI 生成的每日任务内容
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestPayload {
    #[serde(rename = "mainQuest")]
    pub main_quest: String,
    #[serde(rename = "sideQuests")]
    pub side_quests: Vec<String>,
    #[serde(rename = "bossName")]
    pub boss_name: String,
    #[serde(rename = "bossWeakness")]
    pub boss_weakness: String,
    pub ban: String,
    pub reward: String,
    pub declaration: String,
}

/// 任务输入
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestInput {
    pub text: String,
    pub persona: Option<String>,
}

/// Display Director 推荐
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recommendation {
    #[serde(rename = "pageType")]
    pub page_type: String,
    #[serde(rename = "templateId")]
    pub template_id: String,
    pub priority: i32,
    pub reason: String,
    #[serde(rename = "candidatePages")]
    pub candidate_pages: Vec<super::page::Page>,
}

/// 终端状态摘要
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalSummary {
    #[serde(rename = "activeProject")]
    pub active_project: String,
    #[serde(rename = "githubStreak")]
    pub github_streak: i32,
    #[serde(rename = "todayCommits")]
    pub today_commits: i32,
    #[serde(rename = "serverStatus")]
    pub server_status: String,
    #[serde(rename = "mvpProgress")]
    pub mvp_progress: i32,
    #[serde(rename = "currentFocus")]
    pub current_focus: String,
}
