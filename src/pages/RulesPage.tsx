import React, { useState, useMemo } from 'react';
import { useFirewall } from '../hooks/useFirewall';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Eye, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  RefreshCw, 
  ChevronRight, 
  CheckCircle, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { ToggleSwitch } from '../components/common/ToggleSwitch';
import { StatusBadge } from '../components/common/StatusBadge';
import { getActionBadgeClasses, getDirectionBadgeClasses } from '../lib/utils';
import { ActionType, DirectionType, FirewallRule, ProtocolType } from '../types/firewall';

export const RulesPage: React.FC = () => {
  const { 
    rules, 
    toggleRule, 
    openRuleWizard, 
    openEditRuleModal, 
    openRuleDetails, 
    openDeleteConfirm, 
    duplicateRule, 
    openImportModal, 
    backupConfiguration,
    updateRule
  } = useFirewall();

  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterDirection, setFilterDirection] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProtocol, setFilterProtocol] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'name' | 'hits'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter & Search computation
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || (
        rule.name.toLowerCase().includes(q) ||
        rule.port.toLowerCase().includes(q) ||
        rule.source.toLowerCase().includes(q) ||
        rule.destination.toLowerCase().includes(q) ||
        rule.protocol.toLowerCase().includes(q) ||
        (rule.description && rule.description.toLowerCase().includes(q)) ||
        (rule.application && rule.application.toLowerCase().includes(q))
      );

      const matchesAction = filterAction === 'ALL' || rule.action === filterAction;
      const matchesDirection = filterDirection === 'ALL' || rule.direction === filterDirection || rule.direction === 'BOTH';
      const matchesStatus = 
        filterStatus === 'ALL' || 
        (filterStatus === 'ENABLED' && rule.enabled) || 
        (filterStatus === 'DISABLED' && !rule.enabled);
      const matchesProtocol = filterProtocol === 'ALL' || rule.protocol === filterProtocol || rule.protocol === 'ALL';

      return matchesSearch && matchesAction && matchesDirection && matchesStatus && matchesProtocol;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        return sortOrder === 'asc' ? a.priority - b.priority : b.priority - a.priority;
      }
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === 'hits') {
        return sortOrder === 'asc' ? a.hitCount - b.hitCount : b.hitCount - a.hitCount;
      }
      return 0;
    });
  }, [rules, search, filterAction, filterDirection, filterStatus, filterProtocol, sortBy, sortOrder]);

  const hasActiveFilters = search !== '' || filterAction !== 'ALL' || filterDirection !== 'ALL' || filterStatus !== 'ALL' || filterProtocol !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setFilterAction('ALL');
    setFilterDirection('ALL');
    setFilterStatus('ALL');
    setFilterProtocol('ALL');
  };

  // Rule stats
  const totalCount = rules.length;
  const enabledCount = rules.filter(r => r.enabled).length;
  const disabledCount = rules.filter(r => !r.enabled).length;
  const allowCount = rules.filter(r => r.action === 'ALLOW').length;
  const blockCount = rules.filter(r => r.action === 'BLOCK' || r.action === 'REJECT').length;

  const handleAdjustPriority = (e: React.MouseEvent, rule: FirewallRule, delta: number) => {
    e.stopPropagation();
    const newPriority = Math.max(1, rule.priority + delta);
    updateRule(rule.id, { priority: newPriority });
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Firewall Rules
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Development Preview
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Control how NEXUS Firewall handles inbound and outbound network traffic.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openImportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Import rules from JSON file or snippet"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import Rules</span>
          </button>

          <button
            type="button"
            onClick={backupConfiguration}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Export full rule set to JSON package"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Rules</span>
          </button>

          <button
            type="button"
            onClick={openRuleWizard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Rule</span>
          </button>
        </div>
      </div>

      {/* 2. Rule Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Rules</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
          <span className="text-[10px] text-slate-400">In evaluation chain</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Enabled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{enabledCount}</p>
          <span className="text-[10px] text-slate-400">Actively evaluating</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Disabled</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-500 mt-1">{disabledCount}</p>
          <span className="text-[10px] text-slate-400">Temporarily bypassed</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Allow Rules</span>
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{allowCount}</p>
          <span className="text-[10px] text-slate-400">Permit traffic</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs transition-all hover:border-slate-300 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Block Rules</span>
            <Shield className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-1">{blockCount}</p>
          <span className="text-[10px] text-slate-400">Drop or reject packets</span>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rules by name, port, IP, or protocol..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Action */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Action:</span>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Actions</option>
                <option value="ALLOW">Allow</option>
                <option value="BLOCK">Block</option>
                <option value="REJECT">Reject</option>
              </select>
            </div>

            {/* Direction */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Direction:</span>
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Directions</option>
                <option value="INBOUND">Inbound</option>
                <option value="OUTBOUND">Outbound</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            {/* Protocol */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Protocol:</span>
              <select
                value={filterProtocol}
                onChange={(e) => setFilterProtocol(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Protocols</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ENABLED">Enabled</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>

            {/* Reset Filters button if any active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results indicator bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredRules.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{rules.length}</span> rules
            {hasActiveFilters && <span className="text-blue-600 ml-1">(filtered)</span>}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Sort:</span>
            <button
              onClick={() => {
                if (sortBy === 'priority') {
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('priority');
                  setSortOrder('asc');
                }
              }}
              className={`hover:text-slate-800 cursor-pointer ${sortBy === 'priority' ? 'font-bold text-blue-600' : ''}`}
            >
              Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'name') {
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('name');
                  setSortOrder('asc');
                }
              }}
              className={`hover:text-slate-800 cursor-pointer ${sortBy === 'name' ? 'font-bold text-blue-600' : ''}`}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'hits') {
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('hits');
                  setSortOrder('desc');
                }
              }}
              className={`hover:text-slate-800 cursor-pointer ${sortBy === 'hits' ? 'font-bold text-blue-600' : ''}`}
            >
              Hits {sortBy === 'hits' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3.5 text-center w-16">Priority</th>
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-3 text-center">Action</th>
                <th className="py-3 px-3 text-center">Direction</th>
                <th className="py-3 px-3 text-center">Protocol</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-3">Port</th>
                <th className="py-3 px-3 text-right">Hit Count</th>
                <th className="py-3 px-4 text-center">Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRules.length > 0 ? (
                filteredRules.map((rule) => {
                  return (
                    <tr 
                      key={rule.id} 
                      onClick={() => openRuleDetails(rule)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Priority with subtle nudge controls */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          <span>#{rule.priority}</span>
                          <div className="opacity-0 group-hover:opacity-100 flex flex-col -space-y-1 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleAdjustPriority(e, rule, -1)}
                              className="text-slate-400 hover:text-blue-600 p-0.2"
                              title="Higher priority (lower number)"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleAdjustPriority(e, rule, 1)}
                              className="text-slate-400 hover:text-blue-600 p-0.2"
                              title="Lower priority"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Rule Name & Subtitle */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          <span>{rule.name}</span>
                          {rule.application && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-normal">
                              {rule.application}
                            </span>
                          )}
                        </div>
                        {rule.description ? (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{rule.description}</div>
                        ) : (
                          <div className="text-[10px] text-slate-300 italic">No description</div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <StatusBadge type="action" value={rule.action} size="sm" />
                      </td>

                      {/* Direction */}
                      <td className="py-3 px-3 text-center">
                        <StatusBadge type="direction" value={rule.direction} size="sm" />
                      </td>

                      {/* Protocol */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-600 text-[11px]">
                        {rule.protocol}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {rule.source}
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {rule.destination}
                      </td>

                      {/* Port */}
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-800">
                        {rule.port}
                      </td>

                      {/* Hit Count */}
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-500">
                        {rule.hitCount.toLocaleString()}
                      </td>

                      {/* Active Toggle Switch */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <ToggleSwitch
                          size="sm"
                          checked={rule.enabled}
                          onChange={() => toggleRule(rule.id)}
                          label={`Toggle ${rule.name}`}
                        />
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          <button
                            type="button"
                            onClick={() => openRuleDetails(rule)}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Inspect rule details and syntax"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditRuleModal(rule)}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit rule parameters"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateRule(rule.id)}
                            className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title="Duplicate rule"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm(rule)}
                            className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-slate-400">
                    <Shield className="w-10 h-10 mx-auto mb-2.5 opacity-25 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-700">No matching rules found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {hasActiveFilters 
                        ? 'Try clearing your search query or relaxing your filter parameters to see more rules.' 
                        : 'No firewall rules are currently configured in this profile.'}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                        >
                          Clear All Filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={openRuleWizard}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-xs"
                        >
                          + Create First Rule
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
