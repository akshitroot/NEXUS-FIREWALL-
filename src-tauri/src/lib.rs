pub mod audit;
pub mod commands;
pub mod errors;
pub mod firewall;
pub mod models;
pub mod security;
pub mod services;

use std::sync::{Arc, Mutex};
use security::SecurityEngine;
use services::DesktopBridgeService;

/// Shared application state managed by Tauri runtime.
pub struct AppState {
    pub bridge: Mutex<DesktopBridgeService>,
    pub security_engine: Arc<SecurityEngine>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let security_engine = Arc::new(SecurityEngine::new());

    tauri::Builder::default()
        .manage(AppState {
            bridge: Mutex::new(DesktopBridgeService::new()),
            security_engine,
        })
        .invoke_handler(tauri::generate_handler![
            // System commands
            commands::system::get_system_info,
            commands::system::get_system_status,
            commands::system::ping_daemon,
            // App commands
            commands::app::get_app_version,
            commands::app::get_runtime_mode,
            // Firewall & Rule state mutations (delegated to Security Core)
            commands::firewall::get_firewall_status,
            commands::firewall::get_rules,
            commands::firewall::create_rule,
            commands::firewall::update_rule,
            commands::firewall::delete_rule,
            commands::firewall::toggle_rule,
            commands::firewall::get_network_connections,
            commands::firewall::get_applications,
            commands::firewall::get_security_logs,
            commands::firewall::get_alerts,
            commands::firewall::get_settings,
            commands::firewall::save_settings,
            // Security Core Engine commands
            commands::security::validate_rule,
            commands::security::check_conflicts,
            commands::security::create_snapshot,
            commands::security::list_snapshots,
            commands::security::rollback_snapshot,
            commands::security::get_audit_events,
            commands::security::get_security_profiles,
            commands::security::set_security_profile,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NEXUS Firewall desktop application");
}
