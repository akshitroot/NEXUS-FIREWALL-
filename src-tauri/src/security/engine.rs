use std::sync::RwLock;

use crate::audit::{AuditEvent, AuditEventType, AuditLogger, AuditSeverity};
use crate::errors::SecurityError;
use crate::firewall::models::FirewallRule;
use crate::firewall::snapshot::{ConfigurationSnapshot, SnapshotManager, SnapshotMetadata};
use crate::firewall::state::FirewallState;
use crate::security::conflicts::{detect_conflicts, RuleConflict};
use crate::security::policy::{PolicyRegistry, SecurityProfile};
use crate::security::validation::{validate_rule, ValidationError};

/// Core Security Engine coordinating state, validation, conflicts, snapshots, and audit logging.
pub struct SecurityEngine {
    state: RwLock<FirewallState>,
    snapshots: RwLock<SnapshotManager>,
    audit: AuditLogger,
}

impl Default for SecurityEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl SecurityEngine {
    pub fn new() -> Self {
        let state = FirewallState::new_with_defaults();
        let mut snapshots = SnapshotManager::new(50);

        // Take initial baseline snapshot
        snapshots.take_snapshot(&state, "Initial Baseline", "Default system firewall state on startup");

        let audit = AuditLogger::new(1000);
        audit.record(AuditEvent::new(
            AuditEventType::SecurityCheckPassed,
            "security-core-engine",
            AuditSeverity::Info,
            None,
            "NEXUS Security Core engine initialized with baseline snapshot",
        ));

        Self {
            state: RwLock::new(state),
            snapshots: RwLock::new(snapshots),
            audit,
        }
    }

    /// Returns a clone of all current firewall rules.
    pub fn list_rules(&self) -> Result<Vec<FirewallRule>, SecurityError> {
        let state = self.state.read().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        Ok(state.rules.clone())
    }

    /// Retrieves a single rule by ID.
    pub fn get_rule(&self, rule_id: &str) -> Result<Option<FirewallRule>, SecurityError> {
        let state = self.state.read().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        Ok(state.get_rule(rule_id).cloned())
    }

    /// Performs rule validation against security constraints without mutating state.
    pub fn validate(&self, rule: &FirewallRule) -> Result<(), Vec<ValidationError>> {
        validate_rule(rule)
    }

    /// Detects conflicts for a candidate rule against currently active rules.
    pub fn check_conflicts(&self, candidate: &FirewallRule) -> Result<Vec<RuleConflict>, SecurityError> {
        let state = self.state.read().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        Ok(detect_conflicts(candidate, state.list_rules()))
    }

    /// Creates a new rule after passing validation and conflict verification.
    /// Automatically takes a snapshot before mutating, and records an audit event.
    pub fn create_rule(&self, rule: FirewallRule, caller: &str) -> Result<FirewallRule, SecurityError> {
        // 1. Validation
        if let Err(errors) = validate_rule(&rule) {
            let first = &errors[0];
            self.audit.record(AuditEvent::new(
                AuditEventType::ValidationFailed,
                caller,
                AuditSeverity::Warning,
                Some(rule.id.clone()),
                &format!("Validation failed for rule '{}': {}", rule.name, first.reason),
            ));
            return Err(SecurityError::ValidationFailed {
                field: first.field.clone(),
                rejected_value: first.rejected_value.clone(),
                reason: first.reason.clone(),
                suggestion: first.suggestion.clone(),
            });
        }

        let mut state = self.state.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        let mut snapshots = self.snapshots.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;

        // 2. Conflict Analysis
        let conflicts = detect_conflicts(&rule, state.list_rules());
        if let Some(err_conflict) = conflicts.iter().find(|c| c.severity == "Error") {
            self.audit.record(AuditEvent::new(
                AuditEventType::ConflictDetected,
                caller,
                AuditSeverity::High,
                Some(rule.id.clone()),
                &format!("Fatal conflict detected for rule '{}': {}", rule.name, err_conflict.description),
            ));
            return Err(SecurityError::RuleConflict {
                conflict_type: format!("{:?}", err_conflict.conflict_type),
                severity: "Error".to_string(),
                description: err_conflict.description.clone(),
                conflicting_rule_ids: vec![err_conflict.conflicting_rule_id.clone()],
            });
        }

        // 3. Pre-mutation snapshot
        snapshots.take_snapshot(&state, &format!("Before Add Rule '{}'", rule.name), "Automatic pre-mutation safeguard");

        // 4. Add to state
        let added = state.add_rule(rule)?;

        // 5. Audit Log
        self.audit.record(AuditEvent::new(
            AuditEventType::RuleCreated,
            caller,
            AuditSeverity::Info,
            Some(added.id.clone()),
            &format!("Created rule '{}' (Priority {})", added.name, added.priority),
        ));

        Ok(added)
    }

    /// Updates an existing rule in state with automated pre-mutation snapshot and audit record.
    pub fn update_rule(&self, updated: FirewallRule, caller: &str) -> Result<FirewallRule, SecurityError> {
        if let Err(errors) = validate_rule(&updated) {
            let first = &errors[0];
            return Err(SecurityError::ValidationFailed {
                field: first.field.clone(),
                rejected_value: first.rejected_value.clone(),
                reason: first.reason.clone(),
                suggestion: first.suggestion.clone(),
            });
        }

        let mut state = self.state.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        let mut snapshots = self.snapshots.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;

        snapshots.take_snapshot(
            &state,
            &format!("Before Update Rule '{}'", updated.name),
            "Automatic pre-mutation safeguard",
        );

        let result = state.update_rule(updated)?;

        self.audit.record(AuditEvent::new(
            AuditEventType::RuleUpdated,
            caller,
            AuditSeverity::Info,
            Some(result.id.clone()),
            &format!("Updated rule '{}'", result.name),
        ));

        Ok(result)
    }

    /// Deletes a rule with pre-mutation snapshot and audit.
    pub fn delete_rule(&self, rule_id: &str, caller: &str) -> Result<FirewallRule, SecurityError> {
        let mut state = self.state.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        let mut snapshots = self.snapshots.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;

        snapshots.take_snapshot(
            &state,
            &format!("Before Delete Rule '{}'", rule_id),
            "Automatic pre-mutation safeguard",
        );

        let removed = state.delete_rule(rule_id)?;

        self.audit.record(AuditEvent::new(
            AuditEventType::RuleDeleted,
            caller,
            AuditSeverity::Info,
            Some(rule_id.to_string()),
            &format!("Deleted rule '{}'", removed.name),
        ));

        Ok(removed)
    }

    /// Toggles a rule's enabled state.
    pub fn toggle_rule(&self, rule_id: &str, enabled: bool, caller: &str) -> Result<FirewallRule, SecurityError> {
        let mut state = self.state.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        let mut snapshots = self.snapshots.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;

        snapshots.take_snapshot(
            &state,
            &format!("Before Toggle Rule '{}' to {}", rule_id, enabled),
            "Automatic pre-mutation safeguard",
        );

        let rule = state.toggle_rule(rule_id, enabled)?;

        self.audit.record(AuditEvent::new(
            AuditEventType::RuleToggled,
            caller,
            AuditSeverity::Info,
            Some(rule_id.to_string()),
            &format!("Toggled rule '{}' to enabled={}", rule.name, enabled),
        ));

        Ok(rule)
    }

    /// Takes a manual or scheduled configuration snapshot.
    pub fn create_snapshot(&self, name: &str, description: &str, caller: &str) -> Result<ConfigurationSnapshot, SecurityError> {
        let state = self.state.read().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        let mut snapshots = self.snapshots.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;

        let snap = snapshots.take_snapshot(&state, name, description);

        self.audit.record(AuditEvent::new(
            AuditEventType::SnapshotCreated,
            caller,
            AuditSeverity::Info,
            Some(snap.snapshot_id.clone()),
            &format!("Created snapshot '{}'", snap.name),
        ));

        Ok(snap)
    }

    /// Lists retained snapshots.
    pub fn list_snapshots(&self) -> Result<Vec<SnapshotMetadata>, SecurityError> {
        let snapshots = self.snapshots.read().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        Ok(snapshots.list())
    }

    /// Rolls back the firewall state to a previous snapshot.
    pub fn rollback_to_snapshot(&self, snapshot_id: &str, caller: &str) -> Result<ConfigurationSnapshot, SecurityError> {
        let mut state = self.state.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        let snapshots = self.snapshots.read().map_err(|e| SecurityError::StateLockError(e.to_string()))?;

        let restored = snapshots.rollback(snapshot_id, &mut state)?;

        self.audit.record(AuditEvent::new(
            AuditEventType::RollbackExecuted,
            caller,
            AuditSeverity::Warning,
            Some(snapshot_id.to_string()),
            &format!("Rolled back firewall state to snapshot '{}' ({})", restored.name, restored.snapshot_id),
        ));

        Ok(restored)
    }

    /// Retrieves audit log events.
    pub fn get_audit_events(&self, limit: usize) -> Vec<AuditEvent> {
        self.audit.get_recent(limit)
    }

    /// Lists available security profiles.
    pub fn list_profiles(&self) -> Vec<SecurityProfile> {
        PolicyRegistry::all_profiles()
    }

    /// Applies a predefined profile.
    pub fn apply_profile(&self, profile_id: &str, caller: &str) -> Result<SecurityProfile, SecurityError> {
        let profile = PolicyRegistry::get(profile_id).ok_or_else(|| SecurityError::InvalidPolicy {
            profile_id: profile_id.to_string(),
            reason: "Unknown profile ID".to_string(),
        })?;

        let mut state = self.state.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;
        let mut snapshots = self.snapshots.write().map_err(|e| SecurityError::StateLockError(e.to_string()))?;

        snapshots.take_snapshot(&state, &format!("Before Profile Switch to {}", profile.name), "Pre-profile switch safeguard");

        state.default_incoming = profile.default_incoming;
        state.default_outgoing = profile.default_outgoing;
        state.stealth_mode = profile.stealth_mode;
        state.ipv6_enabled = profile.ipv6_enabled;
        state.active_profile = profile.id.clone();
        state.revision += 1;
        state.last_modified = "2026-10-08T05:30:00Z".to_string();

        self.audit.record(AuditEvent::new(
            AuditEventType::ProfileSwitched,
            caller,
            AuditSeverity::Info,
            Some(profile.id.clone()),
            &format!("Switched security profile to '{}'", profile.name),
        ));

        Ok(profile)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::firewall::models::*;

    #[test]
    fn test_engine_lifecycle_create_snapshot_rollback() {
        let engine = SecurityEngine::new();
        let initial_rules = engine.list_rules().unwrap();

        // 1. Create a snapshot
        let snap = engine.create_snapshot("Test Baseline", "Initial test snapshot", "unit-test").unwrap();

        // 2. Add a rule
        let new_rule = FirewallRule {
            id: "test-lifecycle-1".to_string(),
            name: "Allow Test Port".to_string(),
            action: RuleAction::Allow,
            direction: Direction::Inbound,
            protocol: Protocol::Tcp,
            port: PortSpecification::Single(9999),
            priority: 250,
            ..Default::default()
        };
        let added = engine.create_rule(new_rule, "unit-test").unwrap();
        assert_eq!(added.id, "test-lifecycle-1");

        let updated_rules = engine.list_rules().unwrap();
        assert_eq!(updated_rules.len(), initial_rules.len() + 1);

        // 3. Rollback
        engine.rollback_to_snapshot(&snap.snapshot_id, "unit-test").unwrap();
        let rolled_back_rules = engine.list_rules().unwrap();
        assert_eq!(rolled_back_rules.len(), initial_rules.len());
        assert!(engine.get_rule("test-lifecycle-1").unwrap().is_none());

        // 4. Check audit log
        let audits = engine.get_audit_events(10);
        assert!(audits.iter().any(|a| a.event_type == AuditEventType::RollbackExecuted));
    }
}
