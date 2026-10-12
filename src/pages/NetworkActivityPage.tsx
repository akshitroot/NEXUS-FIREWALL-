import React, { useState, useMemo } from 'react';
import { useFirewall } from '../hooks/useFirewall';
import { 
  Wifi, 
  Pause, 
  Play, 
  Trash2, 
  Search, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Filter, 
  Info,
  X,
  Radio,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowUpDown,
  FileText
} from 'lucide-react';
import { AppIcon } from '../components/common/AppIcon';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatBytes } from '../lib/utils';
import { NetworkConnection } from '../types/firewall';
import { NetworkActivityService, ActivityFilterState } from '../services/networkActivityService';
import { ConnectionDetailsDrawer } from '../components/network/ConnectionDetailsDrawer';

export const NetworkActivityPage: React.FC = () => {
  const { 
    networkConnections, 
    isLiveFeedActive, 
    toggleLiveFeed, 
    clearConnections,
    status 
  } = useFirewall();

  // Filters state
  const [filterState, setFilterState] = useState<ActivityFilterState>({
    search: '',
    direction: 'ALL',
    protocol: 'ALL',
    action: 'ALL',
    state: 'ALL',
    application: 'ALL',
    severity: 'ALL',
    timeRange: 'ALL',
  });

  const [selectedConnection, setSelectedConnection] = useState<NetworkConnection | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'application' | 'port' | 'bytes'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Compute live summary metrics directly from demo data
  const metrics = useMemo(() => {
    return NetworkActivityService.calculateMetrics(networkConnections);
  }, [networkConnections]);

  // Extract unique applications for filter dropdown
  const uniqueApplications = useMemo(() => {
    const set = new Set<string>();
    networkConnections.forEach(c => set.add(c.application));
    return Array.from(set).sort();
  }, [networkConnections]);

  // Apply filters
  const filteredConnections = useMemo(() => {
    let result = NetworkActivityService.filterConnections(networkConnections, filterState);

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'time') {
        const cmp = a.timestamp.localeCompare(b.timestamp);
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      if (sortBy === 'application') {
        const cmp = a.application.localeCompare(b.application);
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      if (sortBy === 'port') {
        const cmp = a.port - b.port;
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      if (sortBy === 'bytes') {
        const cmp = (a.bytesTransferred || 0) - (b.bytesTransferred || 0);
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      return 0;
    });

    return result;
  }, [networkConnections, filterState, sortBy, sortOrder]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterState.direction !== 'ALL') count++;
    if (filterState.protocol !== 'ALL') count++;
    if (filterState.action !== 'ALL') count++;
    if (filterState.state !== 'ALL') count++;
    if (filterState.application !== 'ALL') count++;
    if (filterState.severity !== 'ALL') count++;
    return count;
  }, [filterState]);

  const resetFilters = () => {
    setFilterState({
      search: '',
      direction: 'ALL',
      protocol: 'ALL',
      action: 'ALL',
      state: 'ALL',
      application: 'ALL',
      severity: 'ALL',
      timeRange: 'ALL',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Network Activity
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[11px] font-semibold text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Development Preview</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
              <span className={`w-2 h-2 rounded-full ${isLiveFeedActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isLiveFeedActive ? 'Live Telemetry' : 'Paused'}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor network connections and understand how applications communicate.
          </p>
        </div>

        {/* Top-Right Feed Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleLiveFeed}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors border shadow-2xs ${
              isLiveFeedActive 
                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
            }`}
          >
            {isLiveFeedActive ? (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-500" />
                <span>Pause Feed</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Feed</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={clearConnections}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear Buffer</span>
          </button>
        </div>
      </div>

      {/* Development Preview Advisory Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-900">
            Demonstration Data Notice
          </p>
          <p className="text-amber-800/90 text-[11px] leading-relaxed">
            Network activity shown here is demonstration data. Live system monitoring will be connected through the NEXUS security backend in a later phase.
          </p>
        </div>
      </div>

      {/* Network Activity Summary Cards (Calculated directly from demo data) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Active Connections */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs col-span-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Active Connections</span>
            <Radio className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">({metrics.activeSockets} open)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Total monitored socket streams</p>
        </div>

        {/* Allowed */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs col-span-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Allowed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{metrics.allowedCount}</span>
            <span className="text-[11px] text-emerald-700/80 font-medium">
              ({metrics.totalCount > 0 ? Math.round((metrics.allowedCount / metrics.totalCount) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Conforming socket sessions</p>
        </div>

        {/* Blocked */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs col-span-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Blocked</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{metrics.blockedCount}</span>
            <span className="text-[11px] text-rose-700/80 font-medium">
              ({metrics.totalCount > 0 ? Math.round((metrics.blockedCount / metrics.totalCount) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Unauthorized attempts dropped</p>
        </div>

        {/* Suspicious */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs col-span-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Suspicious</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{metrics.suspiciousCount}</span>
            <span className="text-[11px] text-amber-700 font-medium">flagged</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">High & critical severity</p>
        </div>

        {/* Inbound */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs col-span-1 md:col-span-2">
          <div className="text-[10px] uppercase font-bold text-slate-400">Inbound</div>
          <div className="text-lg font-bold text-slate-800 mt-1">{metrics.inboundCount}</div>
        </div>

        {/* Outbound */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs col-span-1 md:col-span-2">
          <div className="text-[10px] uppercase font-bold text-slate-400">Outbound</div>
          <div className="text-lg font-bold text-slate-800 mt-1">{metrics.outboundCount}</div>
        </div>

        {/* TCP */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs col-span-1 md:col-span-2">
          <div className="text-[10px] uppercase font-bold text-slate-400">TCP</div>
          <div className="text-lg font-bold text-slate-800 mt-1">{metrics.tcpCount}</div>
        </div>

        {/* UDP */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs col-span-1 md:col-span-2">
          <div className="text-[10px] uppercase font-bold text-slate-400">UDP</div>
          <div className="text-lg font-bold text-slate-800 mt-1">{metrics.udpCount}</div>
        </div>
      </div>

      {/* Network Activity Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={filterState.search}
              onChange={(e) => setFilterState(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by application, process, source, destination, port, or hostname..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {filterState.search && (
              <button
                onClick={() => setFilterState(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Direction */}
            <select
              value={filterState.direction}
              onChange={(e) => setFilterState(prev => ({ ...prev, direction: e.target.value as any }))}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Directions</option>
              <option value="INBOUND">Inbound</option>
              <option value="OUTBOUND">Outbound</option>
            </select>

            {/* Protocol */}
            <select
              value={filterState.protocol}
              onChange={(e) => setFilterState(prev => ({ ...prev, protocol: e.target.value as any }))}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>

            {/* Action */}
            <select
              value={filterState.action}
              onChange={(e) => setFilterState(prev => ({ ...prev, action: e.target.value as any }))}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="ALLOW">Allowed</option>
              <option value="BLOCK">Blocked</option>
            </select>

            {/* State */}
            <select
              value={filterState.state}
              onChange={(e) => setFilterState(prev => ({ ...prev, state: e.target.value as any }))}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All States</option>
              <option value="ESTABLISHED">Established</option>
              <option value="LISTENING">Listening</option>
              <option value="CLOSED">Closed</option>
              <option value="SYN_SENT">SYN_SENT</option>
            </select>

            {/* Application */}
            <select
              value={filterState.application}
              onChange={(e) => setFilterState(prev => ({ ...prev, application: e.target.value }))}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="ALL">All Applications</option>
              {uniqueApplications.map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>

            {/* Clear Filters Button */}
            {(activeFilterCount > 0 || filterState.search) && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-xl text-blue-600 hover:bg-blue-50 font-semibold transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Removable Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Active Filters:</span>
            
            {filterState.direction !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium">
                Direction: {filterState.direction}
                <button onClick={() => setFilterState(prev => ({ ...prev, direction: 'ALL' }))}>
                  <X className="w-3 h-3 hover:text-blue-900" />
                </button>
              </span>
            )}

            {filterState.protocol !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium">
                Protocol: {filterState.protocol}
                <button onClick={() => setFilterState(prev => ({ ...prev, protocol: 'ALL' }))}>
                  <X className="w-3 h-3 hover:text-blue-900" />
                </button>
              </span>
            )}

            {filterState.action !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium">
                Action: {filterState.action}
                <button onClick={() => setFilterState(prev => ({ ...prev, action: 'ALL' }))}>
                  <X className="w-3 h-3 hover:text-blue-900" />
                </button>
              </span>
            )}

            {filterState.state !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium">
                State: {filterState.state}
                <button onClick={() => setFilterState(prev => ({ ...prev, state: 'ALL' }))}>
                  <X className="w-3 h-3 hover:text-blue-900" />
                </button>
              </span>
            )}

            {filterState.application !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium">
                App: {filterState.application}
                <button onClick={() => setFilterState(prev => ({ ...prev, application: 'ALL' }))}>
                  <X className="w-3 h-3 hover:text-blue-900" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Network Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Application</th>
                <th className="py-3.5 px-3">Process</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-3">Port</th>
                <th className="py-3.5 px-3">Protocol</th>
                <th className="py-3.5 px-3">Direction</th>
                <th className="py-3.5 px-3">State</th>
                <th className="py-3.5 px-3">Action</th>
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredConnections.length > 0 ? (
                filteredConnections.map((conn) => {
                  return (
                    <tr 
                      key={conn.id} 
                      onClick={() => setSelectedConnection(conn)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Application */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 font-semibold text-slate-900">
                          <AppIcon name={conn.application} size={18} />
                          <span className="group-hover:text-blue-600 transition-colors">
                            {conn.application}
                          </span>
                        </div>
                      </td>

                      {/* Process */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        <div>{conn.processName || conn.application.toLowerCase()}</div>
                        {conn.pid !== undefined && (
                          <div className="text-[10px] text-slate-400">pid: {conn.pid}</div>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        {conn.source}
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        <div>{conn.destination}</div>
                        {conn.hostname && (
                          <div className="text-[10px] text-slate-400 font-sans truncate max-w-[150px]">
                            {conn.hostname}
                          </div>
                        )}
                      </td>

                      {/* Port */}
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-800">
                        {conn.port}
                      </td>

                      {/* Protocol */}
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {conn.protocol}
                      </td>

                      {/* Direction */}
                      <td className="py-3 px-3">
                        <StatusBadge type="direction" value={conn.direction || 'OUTBOUND'} size="sm" />
                      </td>

                      {/* State */}
                      <td className="py-3 px-3 font-mono text-[11px] font-medium text-slate-600">
                        {conn.state || 'ESTABLISHED'}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3">
                        <StatusBadge type="action" value={conn.action} size="sm" />
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${conn.action === 'ALLOW' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{conn.timestamp}</span>
                        </div>
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConnection(conn);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] text-blue-600 group-hover:bg-blue-50 font-semibold transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-slate-400">
                    <Wifi className="w-9 h-9 mx-auto mb-2.5 opacity-30 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-700">No network traffic matching criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting search query or active filter chips.</p>
                    {(activeFilterCount > 0 || filterState.search) && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Status */}
        <div className="p-3.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredConnections.length}</strong> of <strong className="text-slate-800">{networkConnections.length}</strong> connections
          </span>
          <span className="font-mono text-slate-400">
            Buffer: last {networkConnections.length} socket records
          </span>
        </div>
      </div>

      {/* Connection Detail Drawer Component */}
      <ConnectionDetailsDrawer
        connection={selectedConnection}
        onClose={() => setSelectedConnection(null)}
      />
    </div>
  );
};
