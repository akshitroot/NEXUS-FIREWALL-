use crate::models::{AppVersionInfo, IpcResponse};

/// Returns application metadata, reverse-domain identifier, and version info.
#[tauri::command]
pub async fn get_app_version() -> Result<IpcResponse<AppVersionInfo>, String> {
    Ok(IpcResponse::success(AppVersionInfo {
        name: "NEXUS Firewall".to_string(),
        version: "0.1.0".to_string(),
        identifier: "com.nexus.firewall".to_string(),
        build_channel: "development-preview".to_string(),
        tauri_v2_ready: true,
        rust_core_phase: "Phase 6 Complete - Ready for Phase 7".to_string(),
    }))
}

/// Identifies active execution mode (Tauri v2 Desktop runtime vs Web browser preview).
#[tauri::command]
pub async fn get_runtime_mode() -> Result<IpcResponse<String>, String> {
    Ok(IpcResponse::success("desktop_tauri_v2".to_string()))
}
