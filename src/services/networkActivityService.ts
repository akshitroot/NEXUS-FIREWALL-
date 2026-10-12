import { NetworkConnection, ApplicationInfo, FirewallRule } from '../types/firewall';

export interface ActivityFilterState {
  search: string;
  direction: 'ALL' | 'INBOUND' | 'OUTBOUND';
  protocol: 'ALL' | 'TCP' | 'UDP' | 'ICMP';
  action: 'ALL' | 'ALLOW' | 'BLOCK' | 'PENDING';
  state: 'ALL' | 'ESTABLISHED' | 'LISTENING' | 'CLOSED' | 'SYN_SENT' | 'TIME_WAIT';
  application: string;
  severity: 'ALL' | 'critical' | 'high' | 'medium' | 'low' | 'info';
  timeRange: 'ALL' | '1h' | '24h' | '7d';
}

export interface ActivityMetrics {
  totalCount: number;
  activeSockets: number;
  allowedCount: number;
  blockedCount: number;
  suspiciousCount: number;
  inboundCount: number;
  outboundCount: number;
  tcpCount: number;
  udpCount: number;
  icmpCount: number;
  totalBytes: number;
}

export class NetworkActivityService {
  /**
   * Filter network connections based on filter criteria
   */
  static filterConnections(
    connections: NetworkConnection[],
    filter: ActivityFilterState
  ): NetworkConnection[] {
    const searchLower = filter.search.trim().toLowerCase();

    return connections.filter((conn) => {
      // Free text search
      if (searchLower) {
        const matchesApp = conn.application.toLowerCase().includes(searchLower);
        const matchesProc = conn.processName?.toLowerCase().includes(searchLower) || false;
        const matchesSrc = conn.source.toLowerCase().includes(searchLower);
        const matchesDst = conn.destination.toLowerCase().includes(searchLower);
        const matchesPort = String(conn.port).includes(searchLower);
        const matchesProto = conn.protocol.toLowerCase().includes(searchLower);
        const matchesHost = conn.hostname?.toLowerCase().includes(searchLower) || false;

        if (!matchesApp && !matchesProc && !matchesSrc && !matchesDst && !matchesPort && !matchesProto && !matchesHost) {
          return false;
        }
      }

      // Direction filter
      if (filter.direction !== 'ALL' && conn.direction !== filter.direction) {
        return false;
      }

      // Protocol filter
      if (filter.protocol !== 'ALL' && conn.protocol !== filter.protocol) {
        return false;
      }

      // Action filter
      if (filter.action !== 'ALL' && conn.action !== filter.action) {
        return false;
      }

      // Connection state filter
      if (filter.state !== 'ALL' && conn.state !== filter.state) {
        return false;
      }

      // Application filter
      if (filter.application !== 'ALL' && conn.application !== filter.application && conn.applicationId !== filter.application) {
        return false;
      }

      // Severity filter
      if (filter.severity !== 'ALL' && conn.severity !== filter.severity) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate live summary metrics directly from dataset
   */
  static calculateMetrics(connections: NetworkConnection[]): ActivityMetrics {
    const totalCount = connections.length;
    let allowedCount = 0;
    let blockedCount = 0;
    let suspiciousCount = 0;
    let inboundCount = 0;
    let outboundCount = 0;
    let tcpCount = 0;
    let udpCount = 0;
    let icmpCount = 0;
    let totalBytes = 0;
    let activeSockets = 0;

    for (const conn of connections) {
      if (conn.action === 'ALLOW') allowedCount++;
      if (conn.action === 'BLOCK' || conn.action === 'REJECT') blockedCount++;
      if (conn.severity === 'critical' || conn.severity === 'high') suspiciousCount++;
      if (conn.direction === 'INBOUND') inboundCount++;
      if (conn.direction === 'OUTBOUND') outboundCount++;
      if (conn.protocol === 'TCP') tcpCount++;
      if (conn.protocol === 'UDP') udpCount++;
      if (conn.protocol === 'ICMP') icmpCount++;
      if (conn.bytesTransferred) totalBytes += conn.bytesTransferred;
      if (conn.state === 'ESTABLISHED' || conn.state === 'LISTENING') activeSockets++;
    }

    return {
      totalCount,
      activeSockets,
      allowedCount,
      blockedCount,
      suspiciousCount,
      inboundCount,
      outboundCount,
      tcpCount,
      udpCount,
      icmpCount,
      totalBytes,
    };
  }

  /**
   * Find application matching connection
   */
  static findApplicationForConnection(
    connection: NetworkConnection,
    applications: ApplicationInfo[]
  ): ApplicationInfo | undefined {
    if (connection.applicationId) {
      const match = applications.find(a => a.id === connection.applicationId);
      if (match) return match;
    }

    return applications.find(a => 
      a.name.toLowerCase() === connection.application.toLowerCase() ||
      (connection.processName && a.executablePath.toLowerCase().endsWith(connection.processName.toLowerCase()))
    );
  }

  /**
   * Find firewall rule matching connection
   */
  static findRuleForConnection(
    connection: NetworkConnection,
    rules: FirewallRule[]
  ): FirewallRule | undefined {
    if (connection.matchedRuleId) {
      const match = rules.find(r => r.id === connection.matchedRuleId);
      if (match) return match;
    }

    // Match by port and protocol
    return rules.find(r => 
      r.enabled &&
      (r.protocol === 'ALL' || r.protocol === connection.protocol) &&
      (r.direction === 'BOTH' || r.direction === connection.direction) &&
      (r.port === 'Any' || r.port === String(connection.port))
    );
  }

  /**
   * Group connections by application
   */
  static getConnectionsGroupedByApplication(
    connections: NetworkConnection[]
  ): Record<string, NetworkConnection[]> {
    const grouped: Record<string, NetworkConnection[]> = {};
    for (const conn of connections) {
      const appKey = conn.application || 'Unknown Application';
      if (!grouped[appKey]) grouped[appKey] = [];
      grouped[appKey].push(conn);
    }
    return grouped;
  }
}
