use crate::firewall::models::{Direction, FirewallRule, IpSpecification, PortSpecification, Protocol};
use serde::{Deserialize, Serialize};

/// Conflict category classification.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ConflictType {
    Shadowed,
    Redundant,
    Contradictory,
    Duplicate,
}

/// Conflict report detail for user feedback.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleConflict {
    pub conflict_type: ConflictType,
    pub severity: String, // "Warning" | "Error"
    pub candidate_rule_id: String,
    pub conflicting_rule_id: String,
    pub conflicting_rule_name: String,
    pub description: String,
    pub recommendation: String,
}

/// Checks whether traffic direction overlaps.
fn directions_overlap(d1: Direction, d2: Direction) -> bool {
    d1 == Direction::Both || d2 == Direction::Both || d1 == d2
}

/// Checks whether protocol matches overlap.
fn protocols_overlap(p1: Protocol, p2: Protocol) -> bool {
    p1 == Protocol::All || p2 == Protocol::All || p1 == p2
}

/// Checks whether ports overlap.
fn ports_overlap(port1: &PortSpecification, port2: &PortSpecification) -> bool {
    match (port1, port2) {
        (PortSpecification::Any, _) | (_, PortSpecification::Any) => true,
        (PortSpecification::Single(a), PortSpecification::Single(b)) => a == b,
        (PortSpecification::Single(a), PortSpecification::Range { start, end })
        | (PortSpecification::Range { start, end }, PortSpecification::Single(a)) => {
            a >= start && a <= end
        }
        (
            PortSpecification::Range { start: s1, end: e1 },
            PortSpecification::Range { start: s2, end: e2 },
        ) => s1 <= e2 && s2 <= e1,
        (PortSpecification::List(list), other) | (other, PortSpecification::List(list)) => {
            list.iter().any(|p| other.matches(*p))
        }
    }
}

/// Checks if IP specifications overlap broadly.
fn ips_overlap(ip1: &IpSpecification, ip2: &IpSpecification) -> bool {
    match (ip1, ip2) {
        (IpSpecification::Any, _) | (_, IpSpecification::Any) => true,
        (IpSpecification::Cidr(c1), IpSpecification::Cidr(c2)) => {
            c1 == c2 || c1.starts_with(c2) || c2.starts_with(c1)
        }
    }
}

/// Analyzes a candidate rule against the existing rule set to identify conflicts.
pub fn detect_conflicts(candidate: &FirewallRule, existing_rules: &[FirewallRule]) -> Vec<RuleConflict> {
    let mut conflicts = Vec::new();

    for existing in existing_rules {
        // Skip comparing against itself
        if existing.id == candidate.id {
            continue;
        }

        // Only compare enabled rules for active conflict analysis
        if !existing.enabled {
            continue;
        }

        let direction_match = directions_overlap(candidate.direction, existing.direction);
        let proto_match = protocols_overlap(candidate.protocol, existing.protocol);
        let port_match = ports_overlap(&candidate.port, &existing.port);
        let src_match = ips_overlap(&candidate.source, &existing.source);
        let dst_match = ips_overlap(&candidate.destination, &existing.destination);

        let traffic_matches = direction_match && proto_match && port_match && src_match && dst_match;

        if traffic_matches {
            let same_action = candidate.action == existing.action;

            if existing.priority < candidate.priority {
                // Existing rule is evaluated BEFORE candidate rule
                if same_action {
                    // Candidate is redundant (traffic is already handled by higher-priority existing rule)
                    conflicts.push(RuleConflict {
                        conflict_type: ConflictType::Redundant,
                        severity: "Warning".to_string(),
                        candidate_rule_id: candidate.id.clone(),
                        conflicting_rule_id: existing.id.clone(),
                        conflicting_rule_name: existing.name.clone(),
                        description: format!(
                            "Candidate rule is redundant with higher-priority rule '{}' (priority {}). Both apply action '{:?}'.",
                            existing.name, existing.priority, existing.action
                        ),
                        recommendation: "Consider refining the matching criteria or removing the candidate rule to avoid clutter.".to_string(),
                    });
                } else {
                    // Existing rule has different action and higher priority -> candidate is shadowed!
                    conflicts.push(RuleConflict {
                        conflict_type: ConflictType::Shadowed,
                        severity: "Warning".to_string(),
                        candidate_rule_id: candidate.id.clone(),
                        conflicting_rule_id: existing.id.clone(),
                        conflicting_rule_name: existing.name.clone(),
                        description: format!(
                            "Candidate rule is shadowed by higher-priority rule '{}' (priority {}). Traffic will be '{:?}' before candidate is evaluated.",
                            existing.name, existing.priority, existing.action
                        ),
                        recommendation: format!(
                            "Increase priority (set number < {}) or narrow existing rule's scope.",
                            existing.priority
                        ),
                    });
                }
            } else if existing.priority == candidate.priority {
                // Equal priority
                if !same_action {
                    conflicts.push(RuleConflict {
                        conflict_type: ConflictType::Contradictory,
                        severity: "Error".to_string(),
                        candidate_rule_id: candidate.id.clone(),
                        conflicting_rule_id: existing.id.clone(),
                        conflicting_rule_name: existing.name.clone(),
                        description: format!(
                            "Contradictory rules at equal priority {}: rule '{}' specifies {:?} while candidate specifies {:?}.",
                            candidate.priority, existing.name, existing.action, candidate.action
                        ),
                        recommendation: "Assign distinct priority numbers to enforce an explicit evaluation order.".to_string(),
                    });
                }
            }
        }
    }

    conflicts
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::firewall::models::*;

    #[test]
    fn test_shadowed_rule_detection() {
        let existing = FirewallRule {
            id: "rule-higher".to_string(),
            name: "Block All Outbound".to_string(),
            action: RuleAction::Block,
            direction: Direction::Outbound,
            protocol: Protocol::All,
            port: PortSpecification::Any,
            priority: 10,
            enabled: true,
            ..Default::default()
        };

        let candidate = FirewallRule {
            id: "rule-lower".to_string(),
            name: "Allow Outbound HTTPS".to_string(),
            action: RuleAction::Allow,
            direction: Direction::Outbound,
            protocol: Protocol::Tcp,
            port: PortSpecification::Single(443),
            priority: 50,
            enabled: true,
            ..Default::default()
        };

        let conflicts = detect_conflicts(&candidate, &[existing]);
        assert_eq!(conflicts.len(), 1);
        assert_eq!(conflicts[0].conflict_type, ConflictType::Shadowed);
    }

    #[test]
    fn test_no_conflict_on_distinct_ports() {
        let existing = FirewallRule {
            id: "rule-1".to_string(),
            name: "Allow SSH".to_string(),
            action: RuleAction::Allow,
            direction: Direction::Inbound,
            protocol: Protocol::Tcp,
            port: PortSpecification::Single(22),
            priority: 10,
            enabled: true,
            ..Default::default()
        };

        let candidate = FirewallRule {
            id: "rule-2".to_string(),
            name: "Block Telnet".to_string(),
            action: RuleAction::Block,
            direction: Direction::Inbound,
            protocol: Protocol::Tcp,
            port: PortSpecification::Single(23),
            priority: 20,
            enabled: true,
            ..Default::default()
        };

        let conflicts = detect_conflicts(&candidate, &[existing]);
        assert!(conflicts.is_empty());
    }
}
