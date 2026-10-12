export type ActionType = 'ALLOW' | 'BLOCK' | 'REJECT' | 'PENDING';
export type DirectionType = 'INBOUND' | 'OUTBOUND' | 'BOTH';
export type ProtocolType = 'TCP' | 'UDP' | 'ICMP' | 'ALL';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'unread' | 'acknowledged' | 'resolved';
export type AppPolicyStatus = 'ALLOWED' | 'BLOCKED' | 'ASK';
export type DashboardUIState = 'normal' | 'loading' | 'empty' | 'error' | 'offline';

export interface FirewallStatus {
  isActive: boolean;
  backend: 'nftables (Linux)' | 'iptables' | 'Windows Filtering Platform (WFP)' | 'macOS Packet Filter (pf)' | 'mock' | string;
  platform: string;
  activeRulesCount: number;
  lastVerified: string;
  protectedPercentage: number;
  allowedEventsCount: number;
  blockedEventsCount: number;
  totalEventsCount: number;
  uptime: string;
  defaultIncoming: 'DROP' | 'ACCEPT';
  defaultOutgoing: 'ACCEPT' | 'DROP';
  stealthMode: boolean;
  ipv6Enabled: boolean;
}

export interface FirewallRule {
  id: string;
  name: string;
  action: ActionType;
  direction: DirectionType;
  protocol: ProtocolType;
  source: string;
  destination: string;
  port: string;
  portType?: 'any' | 'single' | 'range';
  portRangeStart?: number;
  portRangeEnd?: number;
  application?: string;
  applicationPath?: string;
  interface?: string;
  logging?: boolean;
  enabled: boolean;
  priority: number;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  hitCount: number;
  applicationBinding?: string;
}

export interface RuleConflict {
  ruleId: string;
  conflictingRuleId: string;
  conflictingRuleName: string;
  type: 'duplicate_priority' | 'identical_target' | 'contradictory_verdict';
  severity: 'warning' | 'error';
  message: string;
}

export interface RuleFilterState {
  search: string;
  status: 'ALL' | 'ENABLED' | 'DISABLED';
  action: 'ALL' | 'ALLOW' | 'BLOCK' | 'REJECT';
  direction: 'ALL' | 'INBOUND' | 'OUTBOUND' | 'BOTH';
  protocol: 'ALL' | 'TCP' | 'UDP' | 'ICMP';
  application: 'ALL' | string;
}

export type RuleSortField = 'priority' | 'name' | 'createdAt' | 'updatedAt' | 'action';
export type SortOrder = 'asc' | 'desc';

export interface RuleExportPackage {
  schemaVersion: 1;
  product: 'NEXUS Firewall';
  exportedAt: string;
  rulesCount: number;
  rules: FirewallRule[];
}

export interface NetworkConnection {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  protocol: ProtocolType;
  port: number;
  direction: DirectionType;
  action: ActionType;
  application: string;
  appIcon?: 'chrome' | 'system' | 'github' | 'ssh' | 'terminal' | 'code' | 'discord' | 'docker';
  pid?: number;
  processName?: string;
  processPath?: string;
  hostname?: string;
  applicationId?: string;
  matchedRuleId?: string;
  matchedRuleName?: string;
  severity?: AlertSeverity;
  bytesTransferred?: number;
  state?: 'ESTABLISHED' | 'SYN_SENT' | 'LISTENING' | 'TIME_WAIT' | 'CLOSED';
}

export interface ApplicationInfo {
  id: string;
  name: string;
  executablePath: string;
  icon: 'chrome' | 'system' | 'github' | 'ssh' | 'terminal' | 'code' | 'discord' | 'docker';
  status: AppPolicyStatus;
  category: 'Browser' | 'Development' | 'System' | 'Communication' | 'Background Service';
  signatureVerified: boolean;
  activeConnections: number;
  downloadBytes: string;
  uploadBytes: string;
  lastActive: string;
  description: string;
  pid?: number;
  hash?: string;
  publisher?: string;
  associatedRuleIds?: string[];
}

export type SecurityLogSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type SecurityLogAction = 'Allowed' | 'Blocked' | 'Modified' | 'Enabled' | 'Disabled' | 'Warning' | 'System';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string; // 'Connection Blocked', 'Connection Allowed', 'Rule Created', 'Rule Modified', etc.
  severity: SecurityLogSeverity;
  action: SecurityLogAction;
  sourceIp?: string;
  sourcePort?: number;
  destinationIp?: string;
  destinationPort?: number;
  protocol?: ProtocolType;
  application?: string;
  rule?: string;
  ruleId?: string;
  title: string;
  description: string;
  metadata?: Record<string, string | number | boolean>;
  rawPayload?: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  sourceIp?: string;
  targetIp?: string;
  port?: number;
  application?: string;
  relatedRule?: string;
  relatedRuleId?: string;
  recommendedAction?: string;
  category: 'inbound_threat' | 'config_change' | 'policy_violation' | 'system';
}

export interface NexusFirewallSettings {
  general: {
    startupBehavior: 'enable_on_boot' | 'manual' | 'restore_last';
    notificationsEnabled: boolean;
    notifyOnBlocked: boolean;
    notifyOnCriticalOnly: boolean;
    systemTrayEnabled: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  engine: {
    defaultInboundPolicy: 'DROP' | 'REJECT' | 'ACCEPT';
    defaultOutboundPolicy: 'ACCEPT' | 'DROP';
    stealthMode: boolean; // Silently drop packets without ICMP unreachable
    ipv6Handling: 'filter_identically' | 'disable_ipv6' | 'allow_all';
    logDroppedPackets: boolean;
    packetRateLimiting: boolean;
    connectionTracking: boolean;
    backendEngine: 'nftables' | 'iptables_compat';
  };
  logging: {
    retentionDays: number;
    logLevel: 'debug' | 'info' | 'warning' | 'error';
    maxLogSizeMb: number;
    exportFormat: 'json' | 'csv';
    autoArchive: boolean;
  };
  networkProfiles: {
    activeProfile: 'home' | 'work' | 'public';
    autoSwitchWifi: boolean;
  };
  advanced: {
    ipcTimeoutMs: number;
    healthCheckIntervalSeconds: number;
    hardwareOffload: boolean;
  };
}

export type PageView = 
  | 'dashboard'
  | 'rules'
  | 'activity'
  | 'applications'
  | 'logs'
  | 'alerts'
  | 'settings';
