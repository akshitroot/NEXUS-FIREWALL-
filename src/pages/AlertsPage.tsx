import React, { useState, useMemo } from 'react';
import { useFirewall } from '../hooks/useFirewall';
import { 
  Bell, 
  CheckCheck, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Shield, 
  Clock, 
  ExternalLink, 
  Filter, 
  Search,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { getSeverityBadgeClasses } from '../lib/utils';
import { Alert } from '../types/firewall';
import { AlertDetailsModal } from '../components/alerts/AlertDetailsModal';

export const AlertsPage: React.FC = () => {
  const { 
    alerts, 
    acknowledgeAlert, 
    resolveAlert, 
    markAllAlertsAsRead,
    openCreateRuleModal,
    addRule,
    addToast
  } = useFirewall();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'unread' | 'acknowledged' | 'resolved'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Summary Metrics
  const summary = useMemo(() => {
    const activeAlerts = alerts.filter(a => a.status !== 'resolved').length;
    const critical = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
    const high = alerts.filter(a => a.severity === 'high' && a.status !== 'resolved').length;
    const resolved = alerts.filter(a => a.status === 'resolved').length;

    return { activeAlerts, critical, high, resolved };
  }, [alerts]);

  // Filtered Alert List
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesStatus = statusFilter === 'ALL' || alert.status === statusFilter;
      const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
      
      const query = search.toLowerCase();
      const matchesSearch = 
        !search ||
        alert.title.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query) ||
        (alert.sourceIp && alert.sourceIp.includes(query)) ||
        (alert.targetIp && alert.targetIp.includes(query)) ||
        (alert.application && alert.application.toLowerCase().includes(query)) ||
        (alert.relatedRule && alert.relatedRule.toLowerCase().includes(query));

      return matchesStatus && matchesSeverity && matchesSearch;
    });
  }, [alerts, statusFilter, severityFilter, search]);

  const handleCreateRuleFromAlert = (alert: Alert) => {
    if (alert.sourceIp) {
      addRule({
        name: `Block Host: ${alert.sourceIp}`,
        action: 'BLOCK',
        direction: 'INBOUND',
        protocol: 'ALL',
        source: alert.sourceIp,
        destination: 'Any',
        port: alert.port !== undefined ? String(alert.port) : 'Any',
        priority: 1,
        description: `Mitigation rule created from alert: ${alert.title}`,
        enabled: true,
      });
      resolveAlert(alert.id);
      addToast({
        type: 'success',
        title: 'Rule Created & Alert Resolved',
        message: `Inbound traffic from ${alert.sourceIp} is now blocked.`,
      });
    } else {
      openCreateRuleModal();
    }
  };

  const unreadCount = alerts.filter(a => a.status === 'unread').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Security Alerts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Development Preview
            </span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Important events that may require your attention.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAlertsAsRead}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">
          Alerts shown here are mock incident triggers. In Phase 6, alert correlation will run inside the Rust daemon to detect real port scans, anomalous spikes, and external netlink disruptions.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Active Alerts</span>
            <Bell className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {summary.activeAlerts}
            </span>
            <span className="text-[11px] text-slate-400">requiring review</span>
          </div>
        </div>

        {/* Critical */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-medium">Critical Priority</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700 font-mono">
              {summary.critical}
            </span>
            <span className="text-[11px] text-rose-500">immediate threat</span>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-medium">High Priority</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700 font-mono">
              {summary.high}
            </span>
            <span className="text-[11px] text-amber-500">action recommended</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-medium">Resolved</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {summary.resolved}
            </span>
            <span className="text-[11px] text-emerald-500">mitigated</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 text-xs">
          {(['ALL', 'unread', 'acknowledged', 'resolved'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors capitalize ${
                statusFilter === st
                  ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All Alerts' : st}
            </button>
          ))}
        </div>

        {/* Search & Severity Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter alerts..."
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl text-xs font-medium focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-slate-700">No security alerts matching criteria</p>
            <p className="text-xs text-slate-400 mt-1">
              Your firewall policy configuration has no active security warnings under this filter.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md cursor-pointer group flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                alert.status === 'unread' 
                  ? 'border-blue-300/80 bg-blue-50/20' 
                  : alert.status === 'resolved' 
                    ? 'border-slate-200/60 opacity-80' 
                    : 'border-slate-200/80'
              }`}
            >
              <div className="space-y-2 flex-1">
                {/* Severity Badge & Status & Time */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getSeverityBadgeClasses(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    alert.status === 'unread' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                      : alert.status === 'resolved' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {alert.status}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{alert.timestamp}</span>
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {alert.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                {/* Metadata Tags */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  {alert.sourceIp && (
                    <span className="font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      Src: {alert.sourceIp}
                    </span>
                  )}
                  {alert.port && (
                    <span className="font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      Port: {alert.port}
                    </span>
                  )}
                  {alert.application && (
                    <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      App: {alert.application}
                    </span>
                  )}
                  {alert.relatedRule && (
                    <span className="text-slate-600 font-medium">
                      Rule: {alert.relatedRule}
                    </span>
                  )}
                </div>

                {/* Recommended Action snippet */}
                {alert.recommendedAction && (
                  <div className="text-[11px] text-blue-700 bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100">
                    <strong className="font-semibold">Recommended:</strong> {alert.recommendedAction}
                  </div>
                )}
              </div>

              {/* Inline Action Buttons */}
              <div 
                className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5">
                  {alert.status === 'unread' && (
                    <button
                      type="button"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      Acknowledge
                    </button>
                  )}

                  {alert.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      Resolve
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCreateRuleFromAlert(alert)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Create Rule</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 flex items-center gap-0.5 group-hover:text-blue-600 transition-colors">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Details Modal */}
      <AlertDetailsModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAcknowledge={acknowledgeAlert}
        onResolve={resolveAlert}
        onCreateRule={handleCreateRuleFromAlert}
      />
    </div>
  );
};
