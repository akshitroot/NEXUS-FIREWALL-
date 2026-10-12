import React, { useState, useMemo } from 'react';
import { useFirewall } from '../hooks/useFirewall';
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Filter, 
  Info,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  ChevronRight,
  Database,
  ExternalLink
} from 'lucide-react';
import { getSeverityBadgeClasses } from '../lib/utils';
import { SecurityEvent } from '../types/firewall';
import { LogService, LogFilterState } from '../services/logService';
import { LogDetailsDrawer } from '../components/logs/LogDetailsDrawer';

const initialFilters: LogFilterState = {
  search: '',
  severity: 'ALL',
  action: 'ALL',
  eventType: 'ALL',
  protocol: 'ALL',
  application: 'ALL',
  timeRange: 'ALL',
};

export const LogsPage: React.FC = () => {
  const { securityEvents, clearLogs, addToast } = useFirewall();
  const [filters, setFilters] = useState<LogFilterState>(initialFilters);
  const [selectedLog, setSelectedLog] = useState<SecurityEvent | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Filtered dataset
  const filteredEvents = useMemo(() => {
    return LogService.filterLogs(securityEvents, filters);
  }, [securityEvents, filters]);

  // Summary statistics
  const summary = useMemo(() => {
    return LogService.calculateSummary(securityEvents);
  }, [securityEvents]);

  // Unique applications and event types for dropdowns
  const availableEventTypes = useMemo(() => {
    const set = new Set<string>();
    securityEvents.forEach(e => set.add(e.type));
    return Array.from(set);
  }, [securityEvents]);

  const availableApplications = useMemo(() => {
    const set = new Set<string>();
    securityEvents.forEach(e => {
      if (e.application) set.add(e.application);
    });
    return Array.from(set);
  }, [securityEvents]);

  const isFiltered = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.severity !== 'ALL' ||
      filters.action !== 'ALL' ||
      filters.eventType !== 'ALL' ||
      filters.protocol !== 'ALL' ||
      filters.application !== 'ALL' ||
      filters.timeRange !== 'ALL'
    );
  }, [filters]);

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleExportJSON = () => {
    LogService.exportToJson(filteredEvents);
    setIsExportMenuOpen(false);
    addToast({
      type: 'success',
      title: 'Audit Logs Exported',
      message: `${filteredEvents.length} log records exported to JSON format.`,
    });
  };

  const handleExportCSV = () => {
    LogService.exportToCsv(filteredEvents);
    setIsExportMenuOpen(false);
    addToast({
      type: 'success',
      title: 'Audit Logs Exported',
      message: `${filteredEvents.length} log records exported to CSV format.`,
    });
  };

  // Drawer Navigation
  const currentSelectedIndex = useMemo(() => {
    if (!selectedLog) return -1;
    return filteredEvents.findIndex(e => e.id === selectedLog.id);
  }, [selectedLog, filteredEvents]);

  const handleNavigateNext = () => {
    if (currentSelectedIndex >= 0 && currentSelectedIndex < filteredEvents.length - 1) {
      setSelectedLog(filteredEvents[currentSelectedIndex + 1]);
    }
  };

  const handleNavigatePrev = () => {
    if (currentSelectedIndex > 0) {
      setSelectedLog(filteredEvents[currentSelectedIndex - 1]);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'Allowed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Blocked':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Modified':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Enabled':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Security Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Development Preview
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review firewall events, system activity, and security changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Logs</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Export as JSON</span>
                  <span className="text-[10px] text-slate-400">.json</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Export as CSV</span>
                  <span className="text-[10px] text-slate-400">.csv</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={clearLogs}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Trash2 className="w-4 h-4 text-slate-500" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">
          Security audit logs are generated from demonstration events. Real system netfilter netlink events and kernel audit records will be streamed in Phase 6 through the Tauri desktop backend.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Events</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {summary.totalEvents.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">recorded</span>
          </div>
        </div>

        {/* Blocked */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-medium">Blocked</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700 font-mono">
              {summary.blockedCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-rose-500">drops</span>
          </div>
        </div>

        {/* Allowed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-medium">Allowed</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {summary.allowedCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-500">permitted</span>
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-medium">Warnings</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700 font-mono">
              {summary.warningCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-amber-500">anomalies</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by IP, port, app, rule, or description..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Quick Selects */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Severity */}
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value as any }))}
              className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl focus:outline-none font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>

            {/* Action */}
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value as any }))}
              className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl focus:outline-none font-medium"
            >
              <option value="ALL">All Actions</option>
              <option value="Allowed">Allowed</option>
              <option value="Blocked">Blocked</option>
              <option value="Modified">Modified</option>
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
              <option value="Warning">Warning</option>
              <option value="System">System</option>
            </select>

            {/* Event Type */}
            <select
              value={filters.eventType}
              onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
              className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl focus:outline-none font-medium"
            >
              <option value="ALL">All Event Types</option>
              {availableEventTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Application */}
            <select
              value={filters.application}
              onChange={(e) => setFilters(prev => ({ ...prev, application: e.target.value }))}
              className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl focus:outline-none font-medium"
            >
              <option value="ALL">All Applications</option>
              {availableApplications.map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>

            {/* Protocol */}
            <select
              value={filters.protocol}
              onChange={(e) => setFilters(prev => ({ ...prev, protocol: e.target.value as any }))}
              className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl focus:outline-none font-medium"
            >
              <option value="ALL">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>

            {/* Reset Filters */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Feedback */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Showing <strong className="text-slate-800">{filteredEvents.length}</strong> of {securityEvents.length} events</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Port</th>
                <th className="py-3 px-4">Protocol</th>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Rule</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No security events found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isFiltered ? 'Try adjusting your search criteria or active filters.' : 'The security audit log is currently empty.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr 
                    key={evt.id}
                    onClick={() => setSelectedLog(evt)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {evt.timestamp}
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getSeverityBadgeClasses(evt.severity)}`}>
                        {evt.severity}
                      </span>
                    </td>

                    {/* Event Type */}
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {evt.type}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getActionBadgeColor(evt.action)}`}>
                        {evt.action}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {evt.sourceIp || '—'}
                    </td>

                    {/* Destination */}
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {evt.destinationIp || '—'}
                    </td>

                    {/* Port */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {evt.destinationPort !== undefined ? evt.destinationPort : (evt.sourcePort !== undefined ? evt.sourcePort : '—')}
                    </td>

                    {/* Protocol */}
                    <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {evt.protocol || '—'}
                    </td>

                    {/* Application */}
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {evt.application || 'System'}
                    </td>

                    {/* Rule */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap max-w-[140px] truncate" title={evt.rule}>
                      {evt.rule || '—'}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate group-hover:text-slate-800">
                      {evt.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Drawer */}
      <LogDetailsDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        onNavigateNext={handleNavigateNext}
        onNavigatePrev={handleNavigatePrev}
        hasNext={currentSelectedIndex < filteredEvents.length - 1}
        hasPrev={currentSelectedIndex > 0}
      />
    </div>
  );
};
