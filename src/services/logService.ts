import { SecurityEvent } from '../types/firewall';

export interface LogFilterState {
  search: string;
  severity: 'ALL' | 'info' | 'low' | 'medium' | 'high' | 'critical';
  action: 'ALL' | 'Allowed' | 'Blocked' | 'Modified' | 'Enabled' | 'Disabled' | 'Warning' | 'System';
  eventType: string;
  protocol: 'ALL' | 'TCP' | 'UDP' | 'ICMP';
  application: string;
  timeRange: 'ALL' | '1h' | '24h' | '7d' | '30d';
}

export class LogService {
  /**
   * Filter security logs based on user filter criteria
   */
  static filterLogs(logs: SecurityEvent[], filters: LogFilterState): SecurityEvent[] {
    return logs.filter((log) => {
      // Search matching (IPs, ports, application, rule name, description, title, raw payload)
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesQuery = 
          log.title.toLowerCase().includes(query) ||
          log.description.toLowerCase().includes(query) ||
          log.type.toLowerCase().includes(query) ||
          (log.application && log.application.toLowerCase().includes(query)) ||
          (log.rule && log.rule.toLowerCase().includes(query)) ||
          (log.sourceIp && log.sourceIp.includes(query)) ||
          (log.destinationIp && log.destinationIp.includes(query)) ||
          (log.destinationPort && String(log.destinationPort).includes(query)) ||
          (log.sourcePort && String(log.sourcePort).includes(query)) ||
          (log.rawPayload && log.rawPayload.toLowerCase().includes(query));

        if (!matchesQuery) return false;
      }

      // Severity filter
      if (filters.severity !== 'ALL' && log.severity !== filters.severity) {
        return false;
      }

      // Action filter
      if (filters.action !== 'ALL' && log.action !== filters.action) {
        return false;
      }

      // Event Type filter
      if (filters.eventType !== 'ALL' && log.type !== filters.eventType) {
        return false;
      }

      // Protocol filter
      if (filters.protocol !== 'ALL' && log.protocol !== filters.protocol) {
        return false;
      }

      // Application filter
      if (filters.application !== 'ALL' && log.application !== filters.application) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate summary statistics from security events
   */
  static calculateSummary(logs: SecurityEvent[]) {
    let totalEvents = logs.length;
    let blockedCount = 0;
    let allowedCount = 0;
    let warningCount = 0;

    for (const log of logs) {
      if (log.action === 'Blocked') {
        blockedCount++;
      } else if (log.action === 'Allowed') {
        allowedCount++;
      } else if (log.action === 'Warning' || log.severity === 'high' || log.severity === 'critical') {
        warningCount++;
      }
    }

    return {
      totalEvents,
      blockedCount,
      allowedCount,
      warningCount,
    };
  }

  /**
   * Export filtered dataset as JSON
   */
  static exportToJson(logs: SecurityEvent[], filename = `nexus-firewall-events-${new Date().toISOString().slice(0, 10)}.json`) {
    const jsonString = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export filtered dataset as CSV
   */
  static exportToCsv(logs: SecurityEvent[], filename = `nexus-firewall-events-${new Date().toISOString().slice(0, 10)}.csv`) {
    const headers = [
      'Event ID',
      'Timestamp',
      'Severity',
      'Event Type',
      'Action',
      'Source IP',
      'Source Port',
      'Destination IP',
      'Destination Port',
      'Protocol',
      'Application',
      'Rule',
      'Title',
      'Description'
    ];

    const rows = logs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      l.severity,
      `"${l.type}"`,
      l.action,
      l.sourceIp || '',
      l.sourcePort !== undefined ? String(l.sourcePort) : '',
      l.destinationIp || '',
      l.destinationPort !== undefined ? String(l.destinationPort) : '',
      l.protocol || '',
      `"${l.application || ''}"`,
      `"${l.rule || ''}"`,
      `"${(l.title || '').replace(/"/g, '""')}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
