use serde::{Deserialize, Serialize};
use std::sync::RwLock;

/// Classification of security events recorded by the audit logger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AuditEventType {
    RuleCreated,
    RuleUpdated,
    RuleDeleted,
    RuleToggled,
    RulesReordered,
    ValidationFailed,
    ConflictDetected,
    SnapshotCreated,
    RollbackExecuted,
    ProfileSwitched,
    SecurityCheckPassed,
}

/// Audit event severity level.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum AuditSeverity {
    Info,
    Warning,
    High,
    Critical,
}

/// Structured record of an action taken within the NEXUS Security Core.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub event_id: String,
    pub timestamp: String,
    pub event_type: AuditEventType,
    pub actor: String,
    pub severity: AuditSeverity,
    pub target_id: Option<String>,
    pub details: String,
    pub metadata: Option<serde_json::Value>,
}

impl AuditEvent {
    pub fn new(
        event_type: AuditEventType,
        actor: &str,
        severity: AuditSeverity,
        target_id: Option<String>,
        details: &str,
    ) -> Self {
        let event_id = format!("audit-{}", uuid_simple());
        let timestamp = "2026-10-08T05:30:00Z".to_string();

        Self {
            event_id,
            timestamp,
            event_type,
            actor: actor.to_string(),
            severity,
            target_id,
            details: details.to_string(),
            metadata: None,
        }
    }
}

/// Thread-safe in-memory ring buffer for audit logs.
pub struct AuditLogger {
    events: RwLock<Vec<AuditEvent>>,
    capacity: usize,
}

impl AuditLogger {
    pub fn new(capacity: usize) -> Self {
        Self {
            events: RwLock::new(Vec::new()),
            capacity: if capacity == 0 { 1000 } else { capacity },
        }
    }

    pub fn record(&self, event: AuditEvent) {
        if let Ok(mut lock) = self.events.write() {
            lock.push(event);
            if lock.len() > self.capacity {
                lock.remove(0);
            }
        }
    }

    pub fn get_recent(&self, limit: usize) -> Vec<AuditEvent> {
        if let Ok(lock) = self.events.read() {
            lock.iter()
                .rev()
                .take(limit)
                .cloned()
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn len(&self) -> usize {
        self.events.read().map(|l| l.len()).unwrap_or(0)
    }
}

impl Default for AuditLogger {
    fn default() -> Self {
        Self::new(1000)
    }
}

fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_micros();
    format!("{:x}", now)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audit_recording() {
        let logger = AuditLogger::new(5);
        for i in 0..10 {
            logger.record(AuditEvent::new(
                AuditEventType::RuleCreated,
                "admin",
                AuditSeverity::Info,
                Some(format!("rule-{}", i)),
                &format!("Created rule {}", i),
            ));
        }

        assert_eq!(logger.len(), 5);
        let recent = logger.get_recent(2);
        assert_eq!(recent.len(), 2);
        assert_eq!(recent[0].target_id, Some("rule-9".to_string()));
    }
}
