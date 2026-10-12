pub mod conflicts;
pub mod engine;
pub mod policy;
pub mod validation;

pub use conflicts::{detect_conflicts, ConflictType, RuleConflict};
pub use engine::SecurityEngine;
pub use policy::{PolicyRegistry, SecurityProfile};
pub use validation::{validate_ip_cidr, validate_rule, ValidationError};

use serde::{Deserialize, Serialize};

/// Capability privilege levels required for security mutations.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PrivilegeLevel {
    ReadOnly,
    Operator,
    SecurityAdmin,
    RootKernelDaemon,
}

/// Token or authorization handle validating IPC callers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityContext {
    pub session_id: String,
    pub caller_pid: u32,
    pub privilege: PrivilegeLevel,
    pub is_authenticated: bool,
}

impl Default for SecurityContext {
    fn default() -> Self {
        Self {
            session_id: "nexus-desktop-session-local".to_string(),
            caller_pid: std::process::id(),
            privilege: PrivilegeLevel::SecurityAdmin,
            is_authenticated: true,
        }
    }
}

/// Validates that an incoming IPC request conforms to security boundary rules.
pub fn validate_ipc_request(command: &str) -> Result<(), &'static str> {
    let allowed_commands = [
        "get_system_info",
        "get_system_status",
        "ping_daemon",
        "get_app_version",
        "get_runtime_mode",
        "get_firewall_status",
        "get_rules",
        "create_rule",
        "update_rule",
        "delete_rule",
        "toggle_rule",
        "validate_rule",
        "check_conflicts",
        "create_snapshot",
        "list_snapshots",
        "rollback_snapshot",
        "get_audit_events",
        "get_security_profiles",
        "set_security_profile",
        "get_network_connections",
        "get_applications",
        "get_security_logs",
        "get_alerts",
        "get_settings",
        "save_settings",
    ];

    if allowed_commands.contains(&command) {
        Ok(())
    } else {
        Err("Unauthorized or unrecognized IPC command")
    }
}
