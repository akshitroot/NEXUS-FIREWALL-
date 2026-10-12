use super::models::{FirewallRule, RuleAction};
use crate::errors::SecurityError;
use serde::{Deserialize, Serialize};

/// High-level in-memory firewall state managed strictly within the security core.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct FirewallState {
    pub rules: Vec<FirewallRule>,
    pub default_incoming: RuleAction,
    pub default_outgoing: RuleAction,
    pub stealth_mode: bool,
    pub ipv6_enabled: bool,
    pub active_profile: String,
    pub revision: u64,
    pub last_modified: String,
}

impl Default for FirewallState {
    fn default() -> Self {
        Self {
            rules: Vec::new(),
            default_incoming: RuleAction::Block,
            default_outgoing: RuleAction::Allow,
            stealth_mode: true,
            ipv6_enabled: true,
            active_profile: "standard".to_string(),
            revision: 1,
            last_modified: "2026-10-08T05:00:00Z".to_string(),
        }
    }
}

impl FirewallState {
    /// Creates a state initialized with standard default rules.
    pub fn new_with_defaults() -> Self {
        let mut state = Self::default();
        state.rules = Self::default_demo_rules();
        state.sort_rules();
        state
    }

    /// Sorts rules deterministically by priority (ascending order; lower number = higher priority).
    pub fn sort_rules(&mut self) {
        self.rules.sort_by(|a, b| {
            a.priority
                .cmp(&b.priority)
                .then_with(|| a.id.cmp(&b.id))
        });
    }

    /// Retrieves an immutable slice of all rules.
    pub fn list_rules(&self) -> &[FirewallRule] {
        &self.rules
    }

    /// Finds a rule by its ID.
    pub fn get_rule(&self, rule_id: &str) -> Option<&FirewallRule> {
        self.rules.iter().find(|r| r.id == rule_id)
    }

    /// Adds a new rule to the firewall state.
    pub fn add_rule(&mut self, rule: FirewallRule) -> Result<FirewallRule, SecurityError> {
        if self.rules.iter().any(|r| r.id == rule.id) {
            return Err(SecurityError::ValidationFailed {
                field: "id".to_string(),
                rejected_value: rule.id,
                reason: "A rule with this ID already exists in configuration state".to_string(),
                suggestion: Some("Provide a unique rule identifier or allow system to generate one".to_string()),
            });
        }

        let added_rule = rule.clone();
        self.rules.push(rule);
        self.sort_rules();
        self.increment_revision();
        Ok(added_rule)
    }

    /// Updates an existing rule in-place.
    pub fn update_rule(&mut self, updated: FirewallRule) -> Result<FirewallRule, SecurityError> {
        let pos = self
            .rules
            .iter()
            .position(|r| r.id == updated.id)
            .ok_or_else(|| SecurityError::RuleNotFound {
                rule_id: updated.id.clone(),
            })?;

        let final_rule = updated.clone();
        self.rules[pos] = updated;
        self.sort_rules();
        self.increment_revision();
        Ok(final_rule)
    }

    /// Deletes a rule by ID.
    pub fn delete_rule(&mut self, rule_id: &str) -> Result<FirewallRule, SecurityError> {
        let pos = self
            .rules
            .iter()
            .position(|r| r.id == rule_id)
            .ok_or_else(|| SecurityError::RuleNotFound {
                rule_id: rule_id.to_string(),
            })?;

        let removed = self.rules.remove(pos);
        self.increment_revision();
        Ok(removed)
    }

    /// Toggles rule enablement.
    pub fn toggle_rule(&mut self, rule_id: &str, enabled: bool) -> Result<FirewallRule, SecurityError> {
        let rule = self
            .rules
            .iter_mut()
            .find(|r| r.id == rule_id)
            .ok_or_else(|| SecurityError::RuleNotFound {
                rule_id: rule_id.to_string(),
            })?;

        rule.enabled = enabled;
        rule.updated_at = Some("2026-10-08T05:30:00Z".to_string());
        let cloned = rule.clone();
        self.increment_revision();
        Ok(cloned)
    }

    /// Reorders priority of rules.
    pub fn reorder_rules(&mut self, ordered_ids: &[String]) -> Result<(), SecurityError> {
        for (index, id) in ordered_ids.iter().enumerate() {
            if let Some(rule) = self.rules.iter_mut().find(|r| &r.id == id) {
                rule.priority = ((index + 1) * 10) as u32;
            }
        }
        self.sort_rules();
        self.increment_revision();
        Ok(())
    }

    fn increment_revision(&mut self) {
        self.revision += 1;
        self.last_modified = "2026-10-08T05:30:00Z".to_string();
    }

    /// Default baseline security policy rules
    pub fn default_demo_rules() -> Vec<FirewallRule> {
        use super::models::{Direction, IpSpecification, PortSpecification, Protocol};

        vec![
            FirewallRule {
                id: "rule-1".to_string(),
                name: "Allow Outbound HTTPS".to_string(),
                action: RuleAction::Allow,
                direction: Direction::Outbound,
                protocol: Protocol::Tcp,
                source: IpSpecification::Any,
                destination: IpSpecification::Any,
                port: PortSpecification::Single(443),
                application: Some("All Applications".to_string()),
                application_path: None,
                interface: Some("all".to_string()),
                logging: false,
                enabled: true,
                priority: 10,
                description: Some("Allows secure web browsing (HTTPS)".to_string()),
                created_at: "2026-09-15T08:00:00Z".to_string(),
                updated_at: None,
                hit_count: 14205,
            },
            FirewallRule {
                id: "rule-2".to_string(),
                name: "Allow Inbound SSH".to_string(),
                action: RuleAction::Allow,
                direction: Direction::Inbound,
                protocol: Protocol::Tcp,
                source: IpSpecification::Cidr("192.168.1.0/24".to_string()),
                destination: IpSpecification::Any,
                port: PortSpecification::Single(22),
                application: Some("OpenSSH Server".to_string()),
                application_path: Some("/usr/sbin/sshd".to_string()),
                interface: Some("eth0".to_string()),
                logging: true,
                enabled: true,
                priority: 20,
                description: Some("Secure shell remote administration from local subnet".to_string()),
                created_at: "2026-09-18T10:15:00Z".to_string(),
                updated_at: None,
                hit_count: 320,
            },
            FirewallRule {
                id: "rule-3".to_string(),
                name: "Block Inbound Telnet".to_string(),
                action: RuleAction::Block,
                direction: Direction::Inbound,
                protocol: Protocol::Tcp,
                source: IpSpecification::Any,
                destination: IpSpecification::Any,
                port: PortSpecification::Single(23),
                application: None,
                application_path: None,
                interface: Some("all".to_string()),
                logging: true,
                enabled: true,
                priority: 30,
                description: Some("Drops unencrypted legacy Telnet attempts".to_string()),
                created_at: "2026-09-20T14:30:00Z".to_string(),
                updated_at: None,
                hit_count: 852,
            },
            FirewallRule {
                id: "rule-4".to_string(),
                name: "Allow Outbound DNS".to_string(),
                action: RuleAction::Allow,
                direction: Direction::Outbound,
                protocol: Protocol::Udp,
                source: IpSpecification::Any,
                destination: IpSpecification::Any,
                port: PortSpecification::Single(53),
                application: Some("systemd-resolved".to_string()),
                application_path: Some("/usr/lib/systemd/systemd-resolved".to_string()),
                interface: Some("all".to_string()),
                logging: false,
                enabled: true,
                priority: 40,
                description: Some("Domain Name System resolution".to_string()),
                created_at: "2026-09-21T09:00:00Z".to_string(),
                updated_at: None,
                hit_count: 32840,
            },
        ]
    }
}
