use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Structured error representations for the NEXUS Firewall security subsystem.
#[derive(Debug, Error, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "details")]
pub enum SecurityError {
    #[error("Validation failed for field '{field}': {reason}")]
    ValidationFailed {
        field: String,
        rejected_value: String,
        reason: String,
        suggestion: Option<String>,
    },

    #[error("Rule conflict detected: {conflict_type} - {description}")]
    RuleConflict {
        conflict_type: String,
        severity: String, // "Warning" or "Error"
        description: String,
        conflicting_rule_ids: Vec<String>,
    },

    #[error("Firewall rule not found with ID: {rule_id}")]
    RuleNotFound {
        rule_id: String,
    },

    #[error("Configuration snapshot not found with ID: {snapshot_id}")]
    SnapshotNotFound {
        snapshot_id: String,
    },

    #[error("Rollback execution failed: {reason}")]
    RollbackFailed {
        reason: String,
    },

    #[error("Invalid security policy profile '{profile_id}': {reason}")]
    InvalidPolicy {
        profile_id: String,
        reason: String,
    },

    #[error("Permission denied for caller {caller_id}: requires {required_privilege}")]
    PermissionDenied {
        caller_id: String,
        required_privilege: String,
    },

    #[error("State locking contention or concurrency error: {0}")]
    StateLockError(String),

    #[error("IPC communication error: {0}")]
    IpcError(String),

    #[error("Internal security core error: {0}")]
    Internal(String),
}

/// Backwards-compatible alias for existing imports
pub type FirewallError = SecurityError;

impl From<SecurityError> for String {
    fn from(err: SecurityError) -> Self {
        err.to_string()
    }
}
