use crate::firewall::models::{FirewallRule, IpSpecification, PortSpecification, Protocol};
use serde::{Deserialize, Serialize};
use std::net::IpAddr;
use std::str::FromStr;

/// Structured validation failure detail.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ValidationError {
    pub field: String,
    pub rejected_value: String,
    pub reason: String,
    pub suggestion: Option<String>,
}

impl ValidationError {
    pub fn new(field: &str, rejected: &str, reason: &str, suggestion: Option<&str>) -> Self {
        Self {
            field: field.to_string(),
            rejected_value: rejected.to_string(),
            reason: reason.to_string(),
            suggestion: suggestion.map(|s| s.to_string()),
        }
    }
}

/// Validates an IP CIDR string (e.g., "192.168.1.0/24", "10.0.0.1", "::1", "fe80::/64").
pub fn validate_ip_cidr(input: &str) -> Result<(), String> {
    let trimmed = input.trim();
    if trimmed.is_empty()
        || trimmed == "0.0.0.0/0"
        || trimmed == "::/0"
        || trimmed.eq_ignore_ascii_case("any")
        || trimmed == "*"
    {
        return Ok(());
    }

    if let Some((ip_str, mask_str)) = trimmed.split_once('/') {
        let ip = IpAddr::from_str(ip_str).map_err(|_| format!("Invalid IP address '{}'", ip_str))?;
        let mask = mask_str
            .parse::<u8>()
            .map_err(|_| format!("Invalid CIDR prefix '{}'", mask_str))?;

        match ip {
            IpAddr::V4(_) => {
                if mask > 32 {
                    return Err(format!("IPv4 CIDR prefix /{} exceeds maximum /32", mask));
                }
            }
            IpAddr::V6(_) => {
                if mask > 128 {
                    return Err(format!("IPv6 CIDR prefix /{} exceeds maximum /128", mask));
                }
            }
        }
        Ok(())
    } else {
        IpAddr::from_str(trimmed)
            .map(|_| ())
            .map_err(|_| format!("'{}' is not a valid IPv4 or IPv6 address or CIDR notation", trimmed))
    }
}

/// Validates a firewall rule against security constraints.
pub fn validate_rule(rule: &FirewallRule) -> Result<(), Vec<ValidationError>> {
    let mut errors = Vec::new();

    // 1. Rule Name Validation
    let name_trimmed = rule.name.trim();
    if name_trimmed.is_empty() {
        errors.push(ValidationError::new(
            "name",
            &rule.name,
            "Rule name cannot be empty or blank",
            Some("Provide a descriptive name, e.g., 'Allow Inbound SSH'"),
        ));
    } else if name_trimmed.len() > 128 {
        errors.push(ValidationError::new(
            "name",
            &rule.name,
            "Rule name exceeds maximum length of 128 characters",
            Some("Shorten the rule name"),
        ));
    }

    // 2. Priority Validation
    if rule.priority == 0 || rule.priority > 10000 {
        errors.push(ValidationError::new(
            "priority",
            &rule.priority.to_string(),
            "Priority must be between 1 and 10000",
            Some("Use a priority value such as 10, 20, 100, etc."),
        ));
    }

    // 3. Source IP Validation
    if let IpSpecification::Cidr(ref cidr) = rule.source {
        if let Err(msg) = validate_ip_cidr(cidr) {
            errors.push(ValidationError::new(
                "source",
                cidr,
                &msg,
                Some("Use valid IPv4/IPv6 address or CIDR like '192.168.1.0/24' or '0.0.0.0/0'"),
            ));
        }
    }

    // 4. Destination IP Validation
    if let IpSpecification::Cidr(ref cidr) = rule.destination {
        if let Err(msg) = validate_ip_cidr(cidr) {
            errors.push(ValidationError::new(
                "destination",
                cidr,
                &msg,
                Some("Use valid IPv4/IPv6 address or CIDR like '10.0.0.0/8' or 'Any'"),
            ));
        }
    }

    // 5. Port Validation
    match &rule.port {
        PortSpecification::Single(p) => {
            if *p == 0 {
                errors.push(ValidationError::new(
                    "port",
                    "0",
                    "Port 0 is reserved and cannot be explicitly targeted in standard rules",
                    Some("Specify a port between 1 and 65535"),
                ));
            }
        }
        PortSpecification::Range { start, end } => {
            if *start == 0 || *end == 0 {
                errors.push(ValidationError::new(
                    "port",
                    &format!("{}-{}", start, end),
                    "Port 0 is invalid in range specification",
                    Some("Range must start at 1 or greater"),
                ));
            }
            if start > end {
                errors.push(ValidationError::new(
                    "port",
                    &format!("{}-{}", start, end),
                    "Port range start must be less than or equal to port range end",
                    Some("Correct the order, e.g. 8000-8080"),
                ));
            }
        }
        PortSpecification::List(ports) => {
            if ports.is_empty() {
                errors.push(ValidationError::new(
                    "port",
                    "",
                    "Port list cannot be empty",
                    Some("Provide at least one port number or set to Any"),
                ));
            }
            for p in ports {
                if *p == 0 {
                    errors.push(ValidationError::new(
                        "port",
                        "0",
                        "Port 0 is invalid in port list",
                        Some("Use ports 1-65535"),
                    ));
                }
            }
        }
        PortSpecification::Any => {}
    }

    // 6. Protocol & Port consistency
    if rule.protocol == Protocol::Icmp {
        if let PortSpecification::Range { .. } = rule.port {
            errors.push(ValidationError::new(
                "port",
                "range",
                "ICMP protocol does not use port ranges (uses ICMP types/codes)",
                Some("Set port to 'Any' when using ICMP"),
            ));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::firewall::models::*;

    #[test]
    fn test_valid_rule_passes() {
        let rule = FirewallRule {
            id: "test-1".to_string(),
            name: "Allow HTTPS".to_string(),
            action: RuleAction::Allow,
            direction: Direction::Outbound,
            protocol: Protocol::Tcp,
            source: IpSpecification::Any,
            destination: IpSpecification::Any,
            port: PortSpecification::Single(443),
            priority: 10,
            ..Default::default()
        };

        assert!(validate_rule(&rule).is_ok());
    }

    #[test]
    fn test_invalid_cidr_fails() {
        assert!(validate_ip_cidr("192.168.1.0/33").is_err());
        assert!(validate_ip_cidr("not-an-ip").is_err());
        assert!(validate_ip_cidr("192.168.1.1/24").is_ok());
        assert!(validate_ip_cidr("::1").is_ok());
        assert!(validate_ip_cidr("2001:db8::/129").is_err());
    }

    #[test]
    fn test_inverted_port_range_fails() {
        let rule = FirewallRule {
            id: "test-2".to_string(),
            name: "Bad Port".to_string(),
            port: PortSpecification::Range { start: 9000, end: 8000 },
            ..Default::default()
        };

        let res = validate_rule(&rule);
        assert!(res.is_err());
        let errs = res.unwrap_err();
        assert!(errs.iter().any(|e| e.field == "port"));
    }

    #[test]
    fn test_empty_name_fails() {
        let rule = FirewallRule {
            id: "test-3".to_string(),
            name: "   ".to_string(),
            ..Default::default()
        };

        let res = validate_rule(&rule);
        assert!(res.is_err());
        let errs = res.unwrap_err();
        assert!(errs.iter().any(|e| e.field == "name"));
    }
}
