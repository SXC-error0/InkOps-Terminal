use tauri::Manager;
use std::process::{Child, Command};
use std::sync::Mutex;

struct PythonSidecar(Mutex<Option<Child>>);

impl Drop for PythonSidecar {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.0.lock() {
            if let Some(ref mut child) = *guard {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let exe_dir = std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                .unwrap_or_default();

            let ink_engine_dir = exe_dir
                .ancestors()
                .find(|p| p.join("services").join("ink-engine").join("app").exists())
                .map(|p| p.join("services").join("ink-engine"))
                .or_else(|| {
                    std::env::current_dir().ok().and_then(|cwd| {
                        cwd.ancestors()
                            .find(|p| p.join("services").join("ink-engine").join("app").exists())
                            .map(|p| p.join("services").join("ink-engine"))
                    })
                });

            if let Some(ref dir) = ink_engine_dir {
                log::info!("Python backend: {}", dir.display());
                match Command::new("python3")
                    .arg("-m").arg("uvicorn").arg("app.main:app")
                    .arg("--host").arg("127.0.0.1").arg("--port").arg("8700")
                    .current_dir(dir).spawn()
                {
                    Ok(child) => {
                        log::info!("Python started (PID: {})", child.id());
                        app.manage(PythonSidecar(Mutex::new(Some(child))));
                    }
                    Err(e) => log::error!("Failed to start Python: {}", e),
                }
            } else {
                log::warn!("services/ink-engine not found, start Python manually");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Tauri startup failed");
}
