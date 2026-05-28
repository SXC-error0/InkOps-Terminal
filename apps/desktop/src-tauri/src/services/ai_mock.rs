use crate::models::{QuestInput, QuestPayload, Recommendation};

/// 模拟 AI 任务生成 — 返回固定的 RPG 风格任务内容
pub fn generate_quest(_input: &QuestInput) -> QuestPayload {
    QuestPayload {
        main_quest: "完成墨水屏自动推送接口".into(),
        side_quests: vec![
            "修复留言二维码入口".into(),
            "完成今日力量训练".into(),
        ],
        boss_name: "需求膨胀魔王".into(),
        boss_weakness: "先交付, 再完美".into(),
        ban: "今日禁止开新分支".into(),
        reward: "解锁首支演示视频".into(),
        declaration: "Ship before perfect.".into(),
    }
}

/// 模拟 Display Director — 返回推荐页面和理由
pub fn get_recommendation() -> Recommendation {
    Recommendation {
        page_type: "quest".into(),
        template_id: "QUEST_SCROLL".into(),
        priority: 2,
        reason: "现在是早晨工作时段，建议显示今日任务卷轴以建立焦点".into(),
        candidate_pages: vec![],
    }
}
