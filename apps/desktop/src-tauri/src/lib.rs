mod commands;
mod db;
mod error;
mod models;
mod services;
mod state;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 初始化数据库
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            let db_path = data_dir.join("inkops.db");
            let conn = db::Database::open(&db_path)?;
            db::Database::run_migrations(&conn)?;
            log::info!("数据库已初始化: {}", db_path.display());

            app.manage(AppState {
                db: std::sync::Mutex::new(conn),
                data_dir,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Page
            commands::page_commands::get_current_page,
            commands::page_commands::get_page_history,
            commands::page_commands::get_candidate_pages,
            commands::page_commands::create_page,
            commands::page_commands::push_page_to_device,
            commands::page_commands::update_page_status,
            // Device
            commands::device_commands::get_device,
            commands::device_commands::discover_devices,
            commands::device_commands::bind_device,
            commands::device_commands::get_device_logs,
            // Monitor
            commands::monitor_commands::get_monitors,
            commands::monitor_commands::create_monitor,
            commands::monitor_commands::run_health_check,
            commands::monitor_commands::get_active_incidents,
            // Quest / AI
            commands::quest_commands::generate_quest,
            commands::quest_commands::get_display_recommendation,
            // Terminal
            commands::terminal_commands::get_terminal_summary,
            // Events
            commands::event_commands::get_events,
            // System
            commands::system_commands::detect_system_mode,
            commands::system_commands::get_setting,
            commands::system_commands::set_setting,
            // Signals
            commands::signal_commands::generate_qr_code,
            commands::signal_commands::submit_message,
            commands::signal_commands::get_messages,
            // Studio
            commands::studio_commands::re_render_page,
            commands::studio_commands::export_page_image,
            commands::studio_commands::get_archived_pages,
            // Launch
            commands::launch_commands::create_project,
            commands::launch_commands::get_project_briefing,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
