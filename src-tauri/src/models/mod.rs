use serde::{Deserialize, Serialize};

/// Generic standard response envelope for all Tauri IPC commands.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: String,
    pub latency_ms: f64,
}

impl<T> IpcResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            timestamp: "2026-10-08T05:28:00Z".to_string(),
            latency_ms: 1.15,
        }
    }

    pub fn failure(error_msg: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error_msg.into()),
            timestamp: "2026-10-08T05:28:00Z".to_string(),
            latency_ms: 1.05,
        }
    }
}

/// Host System runtime metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub kernel_version: String,
    pub architecture: String,
    pub desktop_environment: String,
    pub tauri_version: String,
    pub is_desktop_runtime: bool,
    pub platform_security_backend: String,
}

/// Overall health and connection status of the security subsystem.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStatus {
    pub firewall_active: bool,
    pub backend: String,
    pub daemon_connected: bool,
    pub ipc_latency_ms: f64,
    pub phase: String,
    pub next_phase: String,
}

/// Application version and build channel.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppVersionInfo {
    pub name: String,
    pub version: String,
    pub identifier: String,
    pub build_channel: String,
    pub tauri_v2_ready: bool,
    pub rust_core_phase: String,
}

/// High-level firewall operational status.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirewallStatusDto {
    pub is_active: bool,
    pub backend: String,
    pub platform: String,
    pub active_rules_count: u32,
    pub last_verified: String,
    pub protected_percentage: u32,
    pub allowed_events_count: u32,
    pub blocked_events_count: u32,
    pub total_events_count: u32,
    pub uptime: String,
    pub default_incoming: String,
    pub default_outgoing: String,
    pub stealth_mode: bool,
    pub ipv6_enabled: bool,
}

/// Firewall policy rule representation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirewallRuleDto {
    pub id: String,
    pub name: String,
    pub action: String, // "ALLOW", "BLOCK", "REJECT"
    pub direction: String, // "INBOUND", "OUTBOUND", "BOTH"
    pub protocol: String, // "TCP", "UDP", "ICMP", "ALL"
    pub source: String,
    pub destination: String,
    pub port: String,
    pub port_type: Option<String>,
    pub port_range_start: Option<u16>,
    pub port_range_end: Option<u16>,
    pub application: Option<String>,
    pub application_path: Option<String>,
    pub interface: Option<String>,
    pub logging: Option<bool>,
    pub enabled: bool,
    pub priority: u32,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub hit_count: u64,
    pub application_binding: Option<String>,
}

/// Active socket connection telemetry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConnectionDto {
    pub id: String,
    pub timestamp: String,
    pub source: String,
    pub destination: String,
    pub protocol: String,
    pub port: u16,
    pub direction: String,
    pub action: String,
    pub application: String,
    pub app_icon: Option<String>,
    pub pid: Option<u32>,
    pub process_name: Option<String>,
    pub process_path: Option<String>,
    pub hostname: Option<String>,
    pub application_id: Option<String>,
    pub matched_rule_id: Option<String>,
    pub matched_rule_name: Option<String>,
    pub severity: Option<String>,
    pub bytes_transferred: Option<u64>,
    pub state: Option<String>,
}

/// Binary / application metadata and traffic policy.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationInfoDto {
    pub id: String,
    pub name: String,
    pub executable_path: String,
    pub icon: String,
    pub status: String, // "ALLOWED", "BLOCKED", "ASK"
    pub category: String,
    pub signature_verified: bool,
    pub active_connections: u32,
    pub download_bytes: String,
    pub upload_bytes: String,
    pub last_active: String,
    pub description: String,
    pub pid: Option<u32>,
    pub hash: Option<String>,
    pub publisher: Option<String>,
    pub associated_rule_ids: Option<Vec<String>>,
}

/// Security event / audit log entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityLogDto {
    pub id: String,
    pub timestamp: String,
    pub r#type: String,
    pub severity: String,
    pub action: String,
    pub source_ip: Option<String>,
    pub source_port: Option<u16>,
    pub destination_ip: Option<String>,
    pub destination_port: Option<u16>,
    pub protocol: Option<String>,
    pub application: Option<String>,
    pub rule: Option<String>,
    pub rule_id: Option<String>,
    pub title: String,
    pub description: String,
}

/// Security alert notification item.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertDto {
    pub id: String,
    pub timestamp: String,
    pub title: String,
    pub description: String,
    pub severity: String,
    pub status: String,
    pub source_ip: Option<String>,
    pub target_ip: Option<String>,
    pub port: Option<u16>,
    pub application: Option<String>,
    pub related_rule: Option<String>,
    pub related_rule_id: Option<String>,
    pub recommended_action: Option<String>,
    pub category: String,
}

/// Application and engine configurations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NexusSettingsDto {
    pub startup_behavior: String,
    pub notifications_enabled: bool,
    pub system_tray_enabled: bool,
    pub theme: String,
    pub default_inbound_policy: String,
    pub default_outbound_policy: String,
    pub stealth_mode: bool,
    pub backend_engine: String,
    pub log_retention_days: u32,
    pub active_profile: String,
}
