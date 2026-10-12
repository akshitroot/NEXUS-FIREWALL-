use crate::errors::FirewallError;
use crate::models::{FirewallRuleDto, FirewallStatusDto, NetworkConnectionDto, SystemInfo, SystemStatus};

/// Trait defining the security core firewall rules contract.
pub trait FirewallService: Send + Sync {
    fn get_status(&self) -> Result<FirewallStatusDto, FirewallError>;
    fn list_rules(&self) -> Result<Vec<FirewallRuleDto>, FirewallError>;
    fn apply_rule(&self, rule: FirewallRuleDto) -> Result<(), FirewallError>;
    fn delete_rule(&self, rule_id: &str) -> Result<(), FirewallError>;
    fn toggle_rule(&self, rule_id: &str, enabled: bool) -> Result<(), FirewallError>;
}

/// Trait defining the future Network socket monitoring pipeline.
pub trait NetworkMonitorService: Send + Sync {
    fn get_active_connections(&self) -> Result<Vec<NetworkConnectionDto>, FirewallError>;
    fn terminate_connection(&self, connection_id: &str) -> Result<(), FirewallError>;
}

/// Trait for security audit logging and incident events.
pub trait AuditLoggerService: Send + Sync {
    fn log_event(&self, message: &str, severity: &str) -> Result<(), FirewallError>;
}

/// Desktop bridge service holding runtime configuration and telemetry.
#[derive(Debug, Default)]
pub struct DesktopBridgeService {
    pub is_initialized: bool,
}

impl DesktopBridgeService {
    pub fn new() -> Self {
        Self { is_initialized: true }
    }

    pub fn system_info(&self) -> SystemInfo {
        SystemInfo {
            os: "Linux (x86_64)".to_string(),
            kernel_version: "6.8.0-nexus-sec".to_string(),
            architecture: "x86_64".to_string(),
            desktop_environment: "GNOME / Wayland".to_string(),
            tauri_version: "2.x".to_string(),
            is_desktop_runtime: true,
            platform_security_backend: "Rust Security Core (In-Memory Policy Engine)".to_string(),
        }
    }

    pub fn system_status(&self) -> SystemStatus {
        SystemStatus {
            firewall_active: true,
            backend: "Rust Security Core + In-Memory Engine".to_string(),
            daemon_connected: true,
            ipc_latency_ms: 0.85,
            phase: "Phase 7 (Rust Security Core)".to_string(),
            next_phase: "Phase 8 (nftables Adapter)".to_string(),
        }
    }
}
