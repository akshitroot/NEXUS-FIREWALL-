import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Folder, 
  ArrowDown, 
  ArrowUp, 
  Radio, 
  Hash, 
  FileText, 
  Shield, 
  Check, 
  Copy, 
  ExternalLink,
  Plus,
  ArrowRight
} from 'lucide-react';
import { ApplicationInfo, NetworkConnection, FirewallRule, AppPolicyStatus } from '../../types/firewall';
import { AppIcon } from '../common/AppIcon';
import { StatusBadge } from '../common/StatusBadge';
import { useFirewall } from '../../hooks/useFirewall';

interface ApplicationDetailsDrawerProps {
  application: ApplicationInfo | null;
  onClose: () => void;
  onNavigateToRule?: (ruleId: string) => void;
  onOpenCreateRuleForApp?: (app: ApplicationInfo) => void;
}

export const ApplicationDetailsDrawer: React.FC<ApplicationDetailsDrawerProps> = ({
  application,
  onClose,
  onOpenCreateRuleForApp,
}) => {
  const { 
    networkConnections, 
    rules, 
    updateApplicationStatus, 
    openRuleDetails, 
    setActivePage, 
    addToast 
  } = useFirewall();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!application) return null;

  // Find recent connections for this application
  const appConnections = networkConnections.filter(c => 
    c.applicationId === application.id || 
    c.application.toLowerCase() === application.name.toLowerCase() ||
    (c.processName && application.executablePath.toLowerCase().endsWith(c.processName.toLowerCase()))
  );

  // Find associated rules
  const associatedRules = rules.filter(r => 
    (application.associatedRuleIds && application.associatedRuleIds.includes(r.id)) ||
    (r.application && r.application.toLowerCase().includes(application.name.toLowerCase())) ||
    (r.applicationPath && r.applicationPath === application.executablePath)
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: `${label}: ${text}`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleInspectRule = (rule: FirewallRule) => {
    onClose();
    setActivePage('rules');
    openRuleDetails(rule);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <AppIcon name={application.name} size={36} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {application.name}
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                  {application.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                PID {application.pid || 'Not running'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Development Preview Indicator */}
        <div className="px-6 py-2 bg-blue-50/80 border-b border-blue-100/60 flex items-center justify-between text-[11px] text-blue-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-semibold">Development Preview Application Policy</span>
          </div>
          <span className="text-[10px] font-mono text-blue-600">eBPF / cgroup metadata</span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section: Policy Configuration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Network Permission Policy</span>
              <span className={`font-bold text-xs ${
                application.status === 'ALLOWED' ? 'text-emerald-700' :
                application.status === 'BLOCKED' ? 'text-rose-700' : 'text-amber-700'
              }`}>
                Current: {application.status}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 p-1 bg-white rounded-xl border border-slate-200/80 text-xs">
              {(['ALLOWED', 'BLOCKED', 'ASK'] as AppPolicyStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => updateApplicationStatus(application.id, st)}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    application.status === st
                      ? st === 'ALLOWED'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : st === 'BLOCKED'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              {application.status === 'ALLOWED' && 'Executable is granted permission to open outbound sockets and receive authorized traffic.'}
              {application.status === 'BLOCKED' && 'All socket calls and packet transfers for this executable will be immediately dropped.'}
              {application.status === 'ASK' && 'Prompts administrator approval dialog before allowing new outbound network endpoints.'}
            </p>
          </div>

          {/* Section: Executable Metadata */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">
              Binary & Verification Information
            </h4>
            <div className="bg-white rounded-xl border border-slate-200/80 divide-y divide-slate-100">
              <div className="p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Executable Filesystem Path
                </span>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg font-mono text-[11px] text-slate-800">
                  <span className="truncate">{application.executablePath}</span>
                  <button
                    onClick={() => copyToClipboard(application.executablePath, 'Executable Path')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 shrink-0 ml-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Digital Signature:</span>
                {application.signatureVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 font-semibold text-emerald-700 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Signed & Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/60 font-semibold text-rose-700 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Unsigned Binary</span>
                  </span>
                )}
              </div>

              {application.publisher && (
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Publisher:</span>
                  <span className="font-semibold text-slate-900">{application.publisher}</span>
                </div>
              )}

              {application.hash && (
                <div className="p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    SHA-256 Checksum
                  </span>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg font-mono text-[10px] text-slate-600">
                    <span className="truncate">{application.hash}</span>
                    <button
                      onClick={() => copyToClipboard(application.hash || '', 'SHA-256 Hash')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 shrink-0 ml-2"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Bandwidth & Activity Statistics */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">
              Activity & Bandwidth (Demo)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <span className="text-[10px] text-slate-400 font-semibold block">Active Sockets</span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {application.activeConnections}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <span className="text-[10px] text-slate-400 font-semibold block flex items-center justify-center gap-1">
                  <ArrowDown className="w-3 h-3 text-emerald-500" /> Ingress
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {application.downloadBytes}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <span className="text-[10px] text-slate-400 font-semibold block flex items-center justify-center gap-1">
                  <ArrowUp className="w-3 h-3 text-blue-500" /> Egress
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {application.uploadBytes}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Associated Firewall Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">
                Associated Firewall Rules ({associatedRules.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActivePage('rules');
                }}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View Rules</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {associatedRules.length > 0 ? (
              <div className="space-y-2">
                {associatedRules.map((rule) => (
                  <div
                    key={rule.id}
                    onClick={() => handleInspectRule(rule)}
                    className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          #{rule.priority}
                        </span>
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {rule.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {rule.direction} • {rule.protocol} • Port {rule.port}
                      </div>
                    </div>
                    <StatusBadge type="action" value={rule.action} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-center text-slate-500">
                <Shield className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                <p className="font-medium text-xs">No explicit custom rules created</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Governed by the {application.status} application policy.
                </p>
              </div>
            )}
          </div>

          {/* Section: Recent Sockets */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">
              Recent Socket Activity ({appConnections.length})
            </h4>

            {appConnections.length > 0 ? (
              <div className="space-y-2">
                {appConnections.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <div className="font-mono font-semibold text-slate-800">
                        {conn.destination}:{conn.port}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {conn.protocol} • {conn.timestamp} • {conn.direction}
                      </div>
                    </div>
                    <StatusBadge type="action" value={conn.action} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-center text-slate-400">
                <p className="text-xs">No active sockets recorded in current buffer.</p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            ID: {application.id}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
