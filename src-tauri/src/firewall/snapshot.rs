use super::models::FirewallRule;
use super::state::FirewallState;
use crate::errors::SecurityError;
use serde::{Deserialize, Serialize};

/// Immutable point-in-time snapshot of the firewall configuration.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ConfigurationSnapshot {
    pub snapshot_id: String,
    pub name: String,
    pub description: String,
    pub created_at: String,
    pub rules: Vec<FirewallRule>,
    pub revision: u64,
    pub active_profile: String,
    pub stealth_mode: bool,
    pub default_incoming: String,
    pub default_outgoing: String,
    pub checksum: String,
}

impl ConfigurationSnapshot {
    /// Captures state and computes an integrity checksum.
    pub fn capture(state: &FirewallState, name: &str, description: &str) -> Self {
        let snapshot_id = format!("snap-{}", uuid_simple());
        let created_at = "2026-10-08T05:30:00Z".to_string();

        // Calculate simple determinism checksum across rules count and IDs
        let rule_sig: String = state
            .rules
            .iter()
            .map(|r| format!("{}:{}:{};", r.id, r.priority, r.enabled))
            .collect();
        let checksum = format!("crc-{:08x}", calculate_crc32(rule_sig.as_bytes()));

        Self {
            snapshot_id,
            name: name.to_string(),
            description: description.to_string(),
            created_at,
            rules: state.rules.clone(),
            revision: state.revision,
            active_profile: state.active_profile.clone(),
            stealth_mode: state.stealth_mode,
            default_incoming: format!("{:?}", state.default_incoming),
            default_outgoing: format!("{:?}", state.default_outgoing),
            checksum,
        }
    }
}

/// Metadata summary of a snapshot for list views.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotMetadata {
    pub snapshot_id: String,
    pub name: String,
    pub description: String,
    pub created_at: String,
    pub rule_count: usize,
    pub revision: u64,
    pub checksum: String,
}

impl From<&ConfigurationSnapshot> for SnapshotMetadata {
    fn from(s: &ConfigurationSnapshot) -> Self {
        Self {
            snapshot_id: s.snapshot_id.clone(),
            name: s.name.clone(),
            description: s.description.clone(),
            created_at: s.created_at.clone(),
            rule_count: s.rules.len(),
            revision: s.revision,
            checksum: s.checksum.clone(),
        }
    }
}

/// Manager for configuration snapshots and rollback safety.
#[derive(Debug, Clone, Default)]
pub struct SnapshotManager {
    snapshots: Vec<ConfigurationSnapshot>,
    max_history: usize,
}

impl SnapshotManager {
    pub fn new(max_history: usize) -> Self {
        Self {
            snapshots: Vec::new(),
            max_history: if max_history == 0 { 50 } else { max_history },
        }
    }

    /// Takes a snapshot of current state and stores it in history.
    pub fn take_snapshot(&mut self, state: &FirewallState, name: &str, description: &str) -> ConfigurationSnapshot {
        let snap = ConfigurationSnapshot::capture(state, name, description);
        self.snapshots.push(snap.clone());

        if self.snapshots.len() > self.max_history {
            self.snapshots.remove(0);
        }

        snap
    }

    /// Lists all snapshots currently retained.
    pub fn list(&self) -> Vec<SnapshotMetadata> {
        self.snapshots.iter().rev().map(SnapshotMetadata::from).collect()
    }

    /// Finds a snapshot by ID.
    pub fn get(&self, snapshot_id: &str) -> Option<&ConfigurationSnapshot> {
        self.snapshots.iter().find(|s| s.snapshot_id == snapshot_id)
    }

    /// Rolls back the provided state to the given snapshot.
    pub fn rollback(
        &self,
        snapshot_id: &str,
        state: &mut FirewallState,
    ) -> Result<ConfigurationSnapshot, SecurityError> {
        let snap = self.get(snapshot_id).ok_or_else(|| SecurityError::SnapshotNotFound {
            snapshot_id: snapshot_id.to_string(),
        })?;

        state.rules = snap.rules.clone();
        state.sort_rules();
        state.active_profile = snap.active_profile.clone();
        state.stealth_mode = snap.stealth_mode;
        state.revision += 1;
        state.last_modified = "2026-10-08T05:30:00Z".to_string();

        Ok(snap.clone())
    }
}

fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    format!("{:x}", now)
}

fn calculate_crc32(bytes: &[u8]) -> u32 {
    let mut crc = 0xFFFF_FFFFu32;
    for &b in bytes {
        crc ^= b as u32;
        for _ in 0..8 {
            let mask = -(crc as i32 & 1) as u32;
            crc = (crc >> 1) ^ (0xEDB8_8320 & mask);
        }
    }
    !crc
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::firewall::models::*;

    #[test]
    fn test_snapshot_capture_and_rollback() {
        let mut state = FirewallState::new_with_defaults();
        let initial_rule_count = state.rules.len();

        let mut manager = SnapshotManager::new(10);
        let snap = manager.take_snapshot(&state, "Baseline", "Initial configuration");

        // Mutate state by adding a rule
        let new_rule = FirewallRule {
            id: "test-rule-1".to_string(),
            name: "Test Rule".to_string(),
            action: RuleAction::Block,
            direction: Direction::Inbound,
            protocol: Protocol::Tcp,
            source: IpSpecification::Any,
            destination: IpSpecification::Any,
            port: PortSpecification::Single(8080),
            priority: 999,
            ..Default::default()
        };
        state.add_rule(new_rule).unwrap();
        assert_eq!(state.rules.len(), initial_rule_count + 1);

        // Perform rollback
        let restored = manager.rollback(&snap.snapshot_id, &mut state).unwrap();
        assert_eq!(restored.snapshot_id, snap.snapshot_id);
        assert_eq!(state.rules.len(), initial_rule_count);
        assert!(state.get_rule("test-rule-1").is_none());
    }
}
