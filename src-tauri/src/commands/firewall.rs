use tauri::State;

use crate::firewall::models::{FirewallRule, FirewallRuleDto};
use crate::models::{
    AlertDto, ApplicationInfoDto, FirewallStatusDto, IpcResponse,
    NetworkConnectionDto, NexusSettingsDto, SecurityLogDto,
};
use crate::AppState;

#[tauri::command]
pub async fn get_firewall_status(
    state: State<'_, AppState>,
) -> Result<IpcResponse<FirewallStatusDto>, String> {
    let rules_count = match state.security_engine.list_rules() {
        Ok(rules) => rules.len() as u32,
        Err(_) => 0,
    };

    #[cfg(target_os = "linux")]
    let (backend, platform) = (
        "nftables (Linux Netfilter)".to_string(),
        "Linux 6.8.0-nexus-sec (x86_64)".to_string(),
    );

    #[cfg(target_os = "windows")]
    let (backend, platform) = (
        "Windows Filtering Platform (WFP)".to_string(),
        "Windows 11 (x86_64)".to_string(),
    );

    #[cfg(target_os = "macos")]
    let (backend, platform) = (
        "macOS Packet Filter (pf anchor)".to_string(),
        "macOS 14 (Darwin)".to_string(),
    );

    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    let (backend, platform) = (
        "Universal Security Core".to_string(),
        "Cross-Platform Desktop".to_string(),
    );

    Ok(IpcResponse::success(FirewallStatusDto {
        is_active: true,
        backend,
        platform,
        active_rules_count: rules_count,
        last_verified: "Just now".to_string(),
        protected_percentage: 99,
        allowed_events_count: 8921,
        blocked_events_count: 3241,
        total_events_count: 12482,
        uptime: "14d 6h 32m".to_string(),
        default_incoming: "DROP".to_string(),
        default_outgoing: "ACCEPT".to_string(),
        stealth_mode: true,
        ipv6_enabled: true,
    }))
}

#[tauri::command]
pub async fn get_rules(
    state: State<'_, AppState>,
) -> Result<IpcResponse<Vec<FirewallRuleDto>>, String> {
    match state.security_engine.list_rules() {
        Ok(domain_rules) => {
            let dtos = domain_rules.iter().map(FirewallRuleDto::from).collect();
            Ok(IpcResponse::success(dtos))
        }
        Err(err) => Ok(IpcResponse::failure(err.to_string())),
    }
}

#[tauri::command]
pub async fn create_rule(
    state: State<'_, AppState>,
    rule: FirewallRuleDto,
) -> Result<IpcResponse<FirewallRuleDto>, String> {
    let domain_rule = FirewallRule::from(rule);
    match state.security_engine.create_rule(domain_rule, "desktop-ui") {
        Ok(created) => Ok(IpcResponse::success(FirewallRuleDto::from(&created))),
        Err(err) => Ok(IpcResponse::failure(err.to_string())),
    }
}

#[tauri::command]
pub async fn update_rule(
    state: State<'_, AppState>,
    rule: FirewallRuleDto,
) -> Result<IpcResponse<FirewallRuleDto>, String> {
    let domain_rule = FirewallRule::from(rule);
    match state.security_engine.update_rule(domain_rule, "desktop-ui") {
        Ok(updated) => Ok(IpcResponse::success(FirewallRuleDto::from(&updated))),
        Err(err) => Ok(IpcResponse::failure(err.to_string())),
    }
}

#[tauri::command]
pub async fn delete_rule(
    state: State<'_, AppState>,
    id: String,
) -> Result<IpcResponse<bool>, String> {
    match state.security_engine.delete_rule(&id, "desktop-ui") {
        Ok(_) => Ok(IpcResponse::success(true)),
        Err(err) => Ok(IpcResponse::failure(err.to_string())),
    }
}

#[tauri::command]
pub async fn toggle_rule(
    state: State<'_, AppState>,
    id: String,
    enabled: bool,
) -> Result<IpcResponse<bool>, String> {
    match state.security_engine.toggle_rule(&id, enabled, "desktop-ui") {
        Ok(_) => Ok(IpcResponse::success(true)),
        Err(err) => Ok(IpcResponse::failure(err.to_string())),
    }
}

#[tauri::command]
pub async fn get_network_connections() -> Result<IpcResponse<Vec<NetworkConnectionDto>>, String> {
    // Demonstration connection telemetry (sandboxed preview)
    let connections = vec![
        NetworkConnectionDto {
            id: "conn-1".to_string(),
            protocol: "TCP".to_string(),
            local_address: "192.168.1.104".to_string(),
            local_port: 54320,
            remote_address: "142.250.190.46".to_string(),
            remote_port: 443,
            state: "ESTABLISHED".to_string(),
            process_id: 2841,
            process_name: "chrome".to_string(),
            user: "nexus".to_string(),
            direction: "OUTBOUND".to_string(),
            action: "ALLOW".to_string(),
            bytes_sent: 45020,
            bytes_received: 182400,
            created_at: "2026-10-08T05:20:12Z".to_string(),
        },
        NetworkConnectionDto {
            id: "conn-2".to_string(),
            protocol: "TCP".to_string(),
            local_address: "0.0.0.0".to_string(),
            local_port: 22,
            remote_address: "0.0.0.0".to_string(),
            remote_port: 0,
            state: "LISTEN".to_string(),
            process_id: 1102,
            process_name: "sshd".to_string(),
            user: "root".to_string(),
            direction: "INBOUND".to_string(),
            action: "ALLOW".to_string(),
            bytes_sent: 0,
            bytes_received: 0,
            created_at: "2026-10-08T05:00:00Z".to_string(),
        },
    ];
    Ok(IpcResponse::success(connections))
}

#[tauri::command]
pub async fn get_applications() -> Result<IpcResponse<Vec<ApplicationInfoDto>>, String> {
    let apps = vec![
        ApplicationInfoDto {
            id: "app-1".to_string(),
            name: "Google Chrome".to_string(),
            executable_path: "/usr/bin/google-chrome".to_string(),
            category: "Web Browser".to_string(),
            active_connections_count: 8,
            total_bytes_sent: 5242880,
            total_bytes_received: 34603008,
            status: "ALLOW".to_string(),
            last_activity: "Just now".to_string(),
            is_signed: true,
        },
        ApplicationInfoDto {
            id: "app-2".to_string(),
            name: "OpenSSH Daemon".to_string(),
            executable_path: "/usr/sbin/sshd".to_string(),
            category: "System Service".to_string(),
            active_connections_count: 1,
            total_bytes_sent: 1048576,
            total_bytes_received: 2097152,
            status: "ALLOW".to_string(),
            last_activity: "3 mins ago".to_string(),
            is_signed: true,
        },
    ];
    Ok(IpcResponse::success(apps))
}

#[tauri::command]
pub async fn get_security_logs() -> Result<IpcResponse<Vec<SecurityLogDto>>, String> {
    let logs = vec![
        SecurityLogDto {
            id: "log-1".to_string(),
            timestamp: "2026-10-08T05:27:14Z".to_string(),
            severity: "High".to_string(),
            event_type: "Connection Blocked".to_string(),
            action: "Blocked".to_string(),
            source_ip: "192.168.1.45".to_string(),
            source_port: 51234,
            destination_ip: "203.0.113.20".to_string(),
            destination_port: 443,
            protocol: "TCP".to_string(),
            application: "Chrome".to_string(),
            rule_id: Some("rule-suspicious-ip".to_string()),
            rule_name: Some("Block Malicious IP Range".to_string()),
            description: "Blocked connection to flagged malicious host 203.0.113.20".to_string(),
        },
    ];
    Ok(IpcResponse::success(logs))
}

#[tauri::command]
pub async fn get_alerts() -> Result<IpcResponse<Vec<AlertDto>>, String> {
    let alerts = vec![
        AlertDto {
            id: "alert-1".to_string(),
            title: "Suspicious Inbound Port Scan Detected".to_string(),
            description: "Multiple connection attempts blocked from external IP on ports 22, 80, 443, 8080".to_string(),
            severity: "High".to_string(),
            timestamp: "2026-10-08T05:20:00Z".to_string(),
            read: false,
            source: "Firewall Rule Engine".to_string(),
        },
    ];
    Ok(IpcResponse::success(alerts))
}

#[tauri::command]
pub async fn get_settings() -> Result<IpcResponse<NexusSettingsDto>, String> {
    Ok(IpcResponse::success(NexusSettingsDto {
        firewall_enabled: true,
        stealth_mode: true,
        block_all_incoming: false,
        allow_all_outgoing: true,
        notify_on_block: true,
        notify_on_high_severity: true,
        log_retention_days: 30,
        dark_mode: false,
        auto_update_rules: true,
        nftables_backend: "nftables".to_string(),
        desktop_environment: "GNOME / Wayland".to_string(),
        ipc_bridge_active: true,
    }))
}

#[tauri::command]
pub async fn save_settings(
    settings: NexusSettingsDto,
) -> Result<IpcResponse<NexusSettingsDto>, String> {
    Ok(IpcResponse::success(settings))
}
