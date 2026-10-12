import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Radio, 
  Folder, 
  Server, 
  Cpu, 
  FileText, 
  Shield, 
  Copy, 
  Check, 
  Activity,
  ArrowRight,
  Hash
} from 'lucide-react';
import { NetworkConnection, ApplicationInfo, FirewallRule } from '../../types/firewall';
import { AppIcon } from '../common/AppIcon';
import { StatusBadge } from '../common/StatusBadge';
import { formatBytes } from '../../lib/utils';
import { useFirewall } from '../../hooks/useFirewall';
import { NetworkActivityService } from '../../services/networkActivityService';

interface ConnectionDetailsDrawerProps {
  connection: NetworkConnection | null;
  onClose: () => void;
  onNavigateToRule?: (ruleId: string) => void;
  onNavigateToApp?: (appId: string) => void;
}

export const ConnectionDetailsDrawer: React.FC<ConnectionDetailsDrawerProps> = ({
  connection,
  onClose,
  onNavigateToRule,
  onNavigateToApp,
}) => {
  const { rules, applications, openRuleDetails, setActivePage, addToast } = useFirewall();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!connection) return null;

  const matchedApp = NetworkActivityService.findApplicationForConnection(connection, applications);
  const matchedRule = NetworkActivityService.findRuleForConnection(connection, rules);

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

  const handleInspectRule = () => {
    if (matchedRule) {
      onClose();
      setActivePage('rules');
      openRuleDetails(matchedRule);
    }
  };

  const handleInspectApp = () => {
    if (matchedApp) {
      onClose();
      setActivePage('applications');
    }
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
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <AppIcon name={connection.application} size={28} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {connection.application}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 font-mono text-[10px] text-slate-600 font-semibold">
                  PID {connection.pid || 'kernel'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {connection.source}:{connection.port} → {connection.destination}:{connection.port}
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

        {/* Development Preview Banner */}
        <div className="px-6 py-2.5 bg-blue-50/80 border-b border-blue-100/60 flex items-center justify-between text-[11px] text-blue-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-semibold">Development Preview Connection Trace</span>
          </div>
          <span className="text-[10px] font-mono text-blue-600">simulated socket telemetry</span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Quick Status Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Action / Verdict
              </span>
              <div className="mt-1">
                <StatusBadge type="action" value={connection.action} size="sm" />
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Direction
              </span>
              <div className="mt-1">
                <StatusBadge type="direction" value={connection.direction} size="sm" />
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Socket State
              </span>
              <span className="mt-1 inline-block font-mono font-bold text-slate-800">
                {connection.state || 'ESTABLISHED'}
              </span>
            </div>
          </div>

          {/* Section: Sockets & Protocol */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">
              Network Socket Specification
            </h4>
            <div className="bg-white rounded-xl border border-slate-200/80 divide-y divide-slate-100">
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Source Address:</span>
                <div className="flex items-center gap-2 font-mono font-semibold text-slate-900">
                  <span>{connection.source}</span>
                  <button
                    onClick={() => copyToClipboard(connection.source, 'Source IP')}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    title="Copy Source IP"
                  >
                    {copiedField === 'Source IP' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Destination Address:</span>
                <div className="flex items-center gap-2 font-mono font-semibold text-slate-900">
                  <span>{connection.destination}</span>
                  {connection.hostname && (
                    <span className="text-[11px] text-blue-600 font-sans font-normal">
                      ({connection.hostname})
                    </span>
                  )}
                  <button
                    onClick={() => copyToClipboard(connection.destination, 'Destination IP')}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    title="Copy Destination IP"
                  >
                    {copiedField === 'Destination IP' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Port & Transport:</span>
                <span className="font-mono font-semibold text-slate-900">
                  Port {connection.port} ({connection.protocol})
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Transferred Payload:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatBytes(connection.bytesTransferred || 0)}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Capture Timestamp:</span>
                <span className="font-mono text-slate-600">
                  {connection.timestamp}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Process & Application Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">
                Process & Executable Information
              </h4>
              {matchedApp && (
                <button
                  onClick={handleInspectApp}
                  className="text-[11px] text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
                >
                  <span>View in Applications</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Process Binary</span>
                  <p className="font-mono font-semibold text-slate-900 text-xs">
                    {connection.processName || connection.application}
                  </p>
                </div>
                {matchedApp?.signatureVerified && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Filesystem Path</span>
                <div className="mt-0.5 font-mono text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/70 truncate flex items-center justify-between">
                  <span className="truncate">{connection.processPath || matchedApp?.executablePath || 'Unknown path'}</span>
                  <button
                    onClick={() => copyToClipboard(connection.processPath || matchedApp?.executablePath || '', 'Executable Path')}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 shrink-0 ml-2"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {matchedApp && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Current App Policy:</span>
                  <span className={`font-bold ${
                    matchedApp.status === 'ALLOWED' ? 'text-emerald-700' :
                    matchedApp.status === 'BLOCKED' ? 'text-rose-700' : 'text-amber-700'
                  }`}>
                    {matchedApp.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Matched Firewall Rule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">
                Enforcing Firewall Rule
              </h4>
              {matchedRule && (
                <button
                  onClick={handleInspectRule}
                  className="text-[11px] text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Rule Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {matchedRule ? (
              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      #{matchedRule.priority}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {matchedRule.name}
                    </span>
                  </div>
                  <StatusBadge type="action" value={matchedRule.action} size="sm" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {matchedRule.description || 'Configured security policy matching this connection criteria.'}
                </p>
                <div className="flex items-center gap-3 pt-2 text-[10px] text-slate-400 font-mono">
                  <span>Proto: {matchedRule.protocol}</span>
                  <span>Port: {matchedRule.port}</span>
                  <span>Dir: {matchedRule.direction}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-500 text-center">
                <Shield className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                <p className="font-medium text-xs">Default System Policy Enforced</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Handled by netfilter default chain ingress/egress policy.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            ID: {connection.id}
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
