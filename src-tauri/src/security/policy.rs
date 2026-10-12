use crate::firewall::models::RuleAction;
use serde::{Deserialize, Serialize};

/// Predefined security profile blueprint.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityProfile {
    pub id: String,
    pub name: String,
    pub description: String,
    pub default_incoming: RuleAction,
    pub default_outgoing: RuleAction,
    pub stealth_mode: bool,
    pub ipv6_enabled: bool,
    pub log_blocked_traffic: bool,
    pub allows_local_sharing: bool,
    pub badge: String,
}

/// Provides built-in system security policies.
pub struct PolicyRegistry;

impl PolicyRegistry {
    pub fn all_profiles() -> Vec<SecurityProfile> {
        vec![
            SecurityProfile {
                id: "standard".to_string(),
                name: "Standard Protection".to_string(),
                description: "Balanced security for regular workstations and home office networks. Drops unexpected inbound traffic while allowing safe outbound services.".to_string(),
                default_incoming: RuleAction::Block,
                default_outgoing: RuleAction::Allow,
                stealth_mode: true,
                ipv6_enabled: true,
                log_blocked_traffic: true,
                allows_local_sharing: true,
                badge: "Default".to_string(),
            },
            SecurityProfile {
                id: "strict".to_string(),
                name: "Strict Lockdown".to_string(),
                description: "High-security zero-trust policy. Drops all incoming traffic and restricts outgoing traffic exclusively to explicitly whitelisted rules.".to_string(),
                default_incoming: RuleAction::Block,
                default_outgoing: RuleAction::Block,
                stealth_mode: true,
                ipv6_enabled: false,
                log_blocked_traffic: true,
                allows_local_sharing: false,
                badge: "Maximum Security".to_string(),
            },
            SecurityProfile {
                id: "developer".to_string(),
                name: "Developer / Workstation".to_string(),
                description: "Permissive local subnet rules for local web servers (ports 3000, 5173, 8080), Docker containers, and database development.".to_string(),
                default_incoming: RuleAction::Block,
                default_outgoing: RuleAction::Allow,
                stealth_mode: false,
                ipv6_enabled: true,
                log_blocked_traffic: false,
                allows_local_sharing: true,
                badge: "Dev Friendly".to_string(),
            },
            SecurityProfile {
                id: "public_wifi".to_string(),
                name: "Public Wi-Fi Shield".to_string(),
                description: "Hardened defense for untrusted public hotspots and travel. Blocks mDNS, local peer discovery, and all incoming probes.".to_string(),
                default_incoming: RuleAction::Block,
                default_outgoing: RuleAction::Allow,
                stealth_mode: true,
                ipv6_enabled: true,
                log_blocked_traffic: true,
                allows_local_sharing: false,
                badge: "High Risk Networks".to_string(),
            },
        ]
    }

    pub fn get(id: &str) -> Option<SecurityProfile> {
        Self::all_profiles().into_iter().find(|p| p.id == id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_standard_profile_exists() {
        let profile = PolicyRegistry::get("standard");
        assert!(profile.is_some());
        let p = profile.unwrap();
        assert_eq!(p.default_incoming, RuleAction::Block);
        assert_eq!(p.default_outgoing, RuleAction::Allow);
    }
}
