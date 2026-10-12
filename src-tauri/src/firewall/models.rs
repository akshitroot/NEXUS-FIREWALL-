use serde::{Deserialize, Serialize};

/// Policy action to apply when traffic matches a rule.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum RuleAction {
    Allow,
    Block,
    Reject,
    Log,
}

impl Default for RuleAction {
    fn default() -> Self {
        RuleAction::Allow
    }
}

/// Network traffic direction.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Direction {
    Inbound,
    Outbound,
    Both,
}

impl Default for Direction {
    fn default() -> Self {
        Direction::Inbound
    }
}

/// Transport or network protocol.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Protocol {
    Tcp,
    Udp,
    Icmp,
    All,
}

impl Default for Protocol {
    fn default() -> Self {
        Protocol::Tcp
    }
}

/// Port matching criteria.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", content = "value")]
pub enum PortSpecification {
    Any,
    Single(u16),
    Range { start: u16, end: u16 },
    List(Vec<u16>),
}

impl PortSpecification {
    pub fn parse(raw: &str) -> Self {
        let trimmed = raw.trim();
        if trimmed.is_empty() || trimmed.eq_ignore_ascii_case("any") || trimmed == "*" {
            return PortSpecification::Any;
        }

        if let Ok(single) = trimmed.parse::<u16>() {
            return PortSpecification::Single(single);
        }

        if trimmed.contains('-') {
            let parts: Vec<&str> = trimmed.split('-').collect();
            if parts.len() == 2 {
                if let (Ok(start), Ok(end)) = (parts[0].trim().parse::<u16>(), parts[1].trim().parse::<u16>()) {
                    if start <= end {
                        return PortSpecification::Range { start, end };
                    }
                }
            }
        }

        if trimmed.contains(',') {
            let mut list = Vec::new();
            for p in trimmed.split(',') {
                if let Ok(num) = p.trim().parse::<u16>() {
                    list.push(num);
                }
            }
            if !list.is_empty() {
                return PortSpecification::List(list);
            }
        }

        PortSpecification::Any
    }

    pub fn to_display_string(&self) -> String {
        match self {
            PortSpecification::Any => "Any".to_string(),
            PortSpecification::Single(port) => port.to_string(),
            PortSpecification::Range { start, end } => format!("{}-{}", start, end),
            PortSpecification::List(ports) => {
                ports.iter().map(|p| p.to_string()).collect::<Vec<_>>().join(", ")
            }
        }
    }

    pub fn matches(&self, port: u16) -> bool {
        match self {
            PortSpecification::Any => true,
            PortSpecification::Single(p) => *p == port,
            PortSpecification::Range { start, end } => port >= *start && port <= *end,
            PortSpecification::List(list) => list.contains(&port),
        }
    }
}

/// IP address matching criteria (IPv4 or IPv6 CIDR / Any).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", content = "value")]
pub enum IpSpecification {
    Any,
    Cidr(String),
}

impl IpSpecification {
    pub fn parse(raw: &str) -> Self {
        let trimmed = raw.trim();
        if trimmed.is_empty()
            || trimmed == "0.0.0.0/0"
            || trimmed == "::/0"
            || trimmed.eq_ignore_ascii_case("any")
            || trimmed == "*"
        {
            return IpSpecification::Any;
        }
        IpSpecification::Cidr(trimmed.to_string())
    }

    pub fn to_display_string(&self) -> String {
        match self {
            IpSpecification::Any => "Any".to_string(),
            IpSpecification::Cidr(cidr) => cidr.clone(),
        }
    }
}

/// Rich domain model representing a security core firewall rule.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct FirewallRule {
    pub id: String,
    pub name: String,
    pub action: RuleAction,
    pub direction: Direction,
    pub protocol: Protocol,
    pub source: IpSpecification,
    pub destination: IpSpecification,
    pub port: PortSpecification,
    pub application: Option<String>,
    pub application_path: Option<String>,
    pub interface: Option<String>,
    pub logging: bool,
    pub enabled: bool,
    pub priority: u32,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub hit_count: u64,
}

impl Default for FirewallRule {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            action: RuleAction::Allow,
            direction: Direction::Inbound,
            protocol: Protocol::Tcp,
            source: IpSpecification::Any,
            destination: IpSpecification::Any,
            port: PortSpecification::Any,
            application: None,
            application_path: None,
            interface: Some("all".to_string()),
            logging: false,
            enabled: true,
            priority: 100,
            description: None,
            created_at: "2026-10-08T05:00:00Z".to_string(),
            updated_at: None,
            hit_count: 0,
        }
    }
}

/// DTO representation matching the frontend TypeScript `FirewallRule` contract.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirewallRuleDto {
    pub id: String,
    pub name: String,
    pub action: String,
    pub direction: String,
    pub protocol: String,
    pub source: String,
    pub destination: String,
    pub port: String,
    pub port_type: Option<String>,
    pub port_range_start: Option<u16>,
    pub port_range_end: Option<u16>,
    pub application: Option<String>,
    pub application_path: Option<String>,
    pub interface: Option<String>,
    pub logging: Option<bool>,
    pub enabled: bool,
    pub priority: u32,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub hit_count: u64,
    pub application_binding: Option<String>,
}

impl From<&FirewallRule> for FirewallRuleDto {
    fn from(r: &FirewallRule) -> Self {
        let (port_type, start, end) = match &r.port {
            PortSpecification::Any => (Some("any".to_string()), None, None),
            PortSpecification::Single(_) => (Some("single".to_string()), None, None),
            PortSpecification::Range { start, end } => {
                (Some("range".to_string()), Some(*start), Some(*end))
            }
            PortSpecification::List(_) => (Some("multiple".to_string()), None, None),
        };

        Self {
            id: r.id.clone(),
            name: r.name.clone(),
            action: match r.action {
                RuleAction::Allow => "ALLOW",
                RuleAction::Block => "BLOCK",
                RuleAction::Reject => "REJECT",
                RuleAction::Log => "LOG",
            }
            .to_string(),
            direction: match r.direction {
                Direction::Inbound => "INBOUND",
                Direction::Outbound => "OUTBOUND",
                Direction::Both => "BOTH",
            }
            .to_string(),
            protocol: match r.protocol {
                Protocol::Tcp => "TCP",
                Protocol::Udp => "UDP",
                Protocol::Icmp => "ICMP",
                Protocol::All => "ALL",
            }
            .to_string(),
            source: r.source.to_display_string(),
            destination: r.destination.to_display_string(),
            port: r.port.to_display_string(),
            port_type,
            port_range_start: start,
            port_range_end: end,
            application: r.application.clone(),
            application_path: r.application_path.clone(),
            interface: r.interface.clone(),
            logging: Some(r.logging),
            enabled: r.enabled,
            priority: r.priority,
            description: r.description.clone(),
            created_at: r.created_at.clone(),
            updated_at: r.updated_at.clone(),
            hit_count: r.hit_count,
            application_binding: r.application_path.clone(),
        }
    }
}

impl From<FirewallRuleDto> for FirewallRule {
    fn from(dto: FirewallRuleDto) -> Self {
        let action = match dto.action.to_uppercase().as_str() {
            "BLOCK" => RuleAction::Block,
            "REJECT" => RuleAction::Reject,
            "LOG" => RuleAction::Log,
            _ => RuleAction::Allow,
        };

        let direction = match dto.direction.to_uppercase().as_str() {
            "OUTBOUND" => Direction::Outbound,
            "BOTH" => Direction::Both,
            _ => Direction::Inbound,
        };

        let protocol = match dto.protocol.to_uppercase().as_str() {
            "UDP" => Protocol::Udp,
            "ICMP" => Protocol::Icmp,
            "ALL" => Protocol::All,
            _ => Protocol::Tcp,
        };

        let port = if let (Some("range"), Some(s), Some(e)) = (
            dto.port_type.as_deref(),
            dto.port_range_start,
            dto.port_range_end,
        ) {
            PortSpecification::Range { start: s, end: e }
        } else {
            PortSpecification::parse(&dto.port)
        };

        Self {
            id: dto.id,
            name: dto.name,
            action,
            direction,
            protocol,
            source: IpSpecification::parse(&dto.source),
            destination: IpSpecification::parse(&dto.destination),
            port,
            application: dto.application,
            application_path: dto.application_path,
            interface: dto.interface,
            logging: dto.logging.unwrap_or(false),
            enabled: dto.enabled,
            priority: dto.priority,
            description: dto.description,
            created_at: dto.created_at,
            updated_at: dto.updated_at,
            hit_count: dto.hit_count,
        }
    }
}
