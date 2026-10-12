import React from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { 
  X, 
  Shield, 
  Edit2, 
  Copy, 
  Trash2, 
  Power, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Sliders, 
  Network, 
  Cpu, 
  FileText 
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { RuleService } from '../../services/ruleService';

import { FirewallRule } from '../../types/firewall';

const generateNftablesPreview = (rule: FirewallRule): string => {
  const chain = rule.direction === 'INBOUND' ? 'input' : rule.direction === 'OUTBOUND' ? 'output' : 'forward';
  const proto = rule.protocol.toLowerCase();
  const dportPart = rule.port !== 'Any' ? `${proto} dport { ${rule.port} }` : '';
  const saddrPart = rule.source !== 'Any' ? `ip saddr ${rule.source}` : '';
  const daddrPart = rule.destination !== 'Any' ? `ip daddr ${rule.destination}` : '';
  const actionPart = rule.action.toLowerCase();
  const logPart = rule.logging ? 'log prefix "[NEXUS] " ' : '';
  
  const tokens = [proto !== 'all' ? proto : '', saddrPart, daddrPart, dportPart, logPart, actionPart].filter(Boolean).join(' ');
  return `add rule inet nexus_filter ${chain} ${tokens} comment "${rule.name}"`;
};

export const RuleDetailsDrawer: React.FC = () => {
  const { 
    viewingRule, 
    closeRuleDetails, 
    openEditRuleModal, 
    duplicateRule, 
    openDeleteConfirm, 
    toggleRule,
    rules,
    addToast
  } = useFirewall();

  if (!viewingRule) return null;

  const conflicts = RuleService.getConflicts(viewingRule, rules);

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-details-title"
    >
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  PRIORITY #{viewingRule.priority}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                  Development Preview
                </span>
              </div>
              <h3 id="rule-details-title" className="text-base font-bold text-slate-900 truncate mt-0.5">
                {viewingRule.name}
              </h3>
            </div>
          </div>

          <button
            onClick={closeRuleDetails}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Potential Conflicts Warning Banner */}
          {conflicts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Potential Rule Conflict ({conflicts.length})</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                This rule may conflict with another rule depending on evaluation order:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-900">
                {conflicts.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
              </ul>
              <p className="text-[10px] text-amber-600 font-medium italic pt-1">
                Note: Frontend analysis only. The authoritative conflict engine resides in the future Rust security core.
              </p>
            </div>
          )}

          {/* Section: Status & Verdict */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Action</span>
              <div className="mt-1">
                <StatusBadge type="action" value={viewingRule.action} size="sm" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Direction</span>
              <div className="mt-1">
                <StatusBadge type="direction" value={viewingRule.direction} size="sm" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Status</span>
              <div className="mt-1">
                <StatusBadge type="status" value={viewingRule.enabled ? 'Active' : 'Disabled'} size="sm" />
              </div>
            </div>
          </div>

          {/* Section: Basic Information */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
              Basic Information
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white p-3 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Rule Name</span>
                <span className="font-semibold text-slate-900">{viewingRule.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Description</span>
                <span className="text-slate-700 max-w-xs text-right font-medium">
                  {viewingRule.description || 'No description provided'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Evaluation Priority</span>
                <span className="font-mono font-bold text-slate-900">
                  #{viewingRule.priority} <span className="font-normal text-slate-400 text-[10px]">(Lower numbers evaluate first)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section: Network & Traffic Target */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
              Traffic Selectors
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white p-3 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Protocol</span>
                <span className="font-semibold text-slate-900 font-mono">{viewingRule.protocol}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Port / Range</span>
                <span className="font-mono font-bold text-slate-900">{viewingRule.port}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Source Host/CIDR</span>
                <span className="font-mono text-slate-700">{viewingRule.source}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Destination Host/CIDR</span>
                <span className="font-mono text-slate-700">{viewingRule.destination}</span>
              </div>
            </div>
          </div>

          {/* Section: Application & Advanced Configuration */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
              Application & System Binding
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white p-3 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Application Match</span>
                <span className="font-semibold text-slate-900">{viewingRule.application || 'Any Application'}</span>
              </div>
              {viewingRule.applicationPath && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Executable Path</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate max-w-xs">
                    {viewingRule.applicationPath}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Network Interface</span>
                <span className="font-mono text-slate-700">{viewingRule.interface || 'Any Interface'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Audit Logging</span>
                <span className={`font-semibold ${viewingRule.logging ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {viewingRule.logging ? 'Enabled (Logs to journal)' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Packets Matched (Hits)</span>
                <span className="font-mono font-bold text-slate-800">{viewingRule.hitCount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Section: nftables Syntax Preview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
                Linux nftables Syntax (Preview)
              </h4>
              <button
                type="button"
                onClick={() => {
                  const cmd = generateNftablesPreview(viewingRule);
                  navigator.clipboard.writeText(cmd);
                  addToast({
                    type: 'info',
                    title: 'Syntax Copied',
                    message: 'nftables rule definition copied to clipboard.',
                  });
                }}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <div className="rounded-xl bg-slate-900 text-slate-200 p-3.5 font-mono text-[11px] space-y-1.5 shadow-inner">
              <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800 flex items-center justify-between">
                <span>nftables target preview</span>
                <span className="text-amber-400 text-[10px]">Non-enforcing (Frontend Demo)</span>
              </div>
              <p className="text-emerald-400 break-all select-all pt-1">
                {generateNftablesPreview(viewingRule)}
              </p>
            </div>
          </div>

          {/* Metadata Timestamps */}
          <div className="pt-2 text-[11px] text-slate-400 space-y-1 font-mono">
            <p>Created: {viewingRule.createdAt}</p>
            <p>Last Modified: {viewingRule.updatedAt || viewingRule.createdAt}</p>
            <p>Internal ID: {viewingRule.id}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              const target = viewingRule;
              closeRuleDetails();
              openDeleteConfirm(target);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                duplicateRule(viewingRule.id);
                closeRuleDetails();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                toggleRule(viewingRule.id);
                closeRuleDetails();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                viewingRule.enabled 
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{viewingRule.enabled ? 'Disable' : 'Enable'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const target = viewingRule;
                closeRuleDetails();
                openEditRuleModal(target);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Rule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
