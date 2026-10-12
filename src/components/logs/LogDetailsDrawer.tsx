import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Terminal, 
  Hash, 
  Layers, 
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';
import { SecurityEvent } from '../../types/firewall';
import { getSeverityBadgeClasses } from '../../lib/utils';
import { useFirewall } from '../../hooks/useFirewall';

interface LogDetailsDrawerProps {
  log: SecurityEvent | null;
  onClose: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const LogDetailsDrawer: React.FC<LogDetailsDrawerProps> = ({
  log,
  onClose,
  onNavigateNext,
  onNavigatePrev,
  hasNext = false,
  hasPrev = false,
}) => {
  const { openCreateRuleModal, addToast, setActivePage } = useFirewall();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!log) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: `${label} copied.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end transition-opacity">
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-drawer-title"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider ${getSeverityBadgeClasses(log.severity)}`}>
              {log.severity}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getActionBadgeColor(log.action)}`}>
              {log.action}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Prev/Next navigation */}
            <div className="flex items-center border border-slate-200 rounded-lg bg-white mr-2">
              <button
                type="button"
                onClick={onNavigatePrev}
                disabled={!hasPrev}
                title="Previous Log Event"
                className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNavigateNext}
                disabled={!hasNext}
                title="Next Log Event"
                className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Timestamp */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-medium text-slate-400 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> {log.id}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(log.id, 'Event ID')}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {copiedField === 'Event ID' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedField === 'Event ID' ? 'Copied' : 'Copy ID'}
              </button>
            </div>
            <h2 id="log-drawer-title" className="text-lg font-bold text-slate-900 mt-1">
              {log.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{log.timestamp}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{log.type}</span>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Event Description
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">
              {log.description}
            </p>
          </div>

          {/* Network Parameters */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Network & Socket Data
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Source IP & Port</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-medium text-slate-800">
                    {log.sourceIp || '—'}
                    {log.sourcePort !== undefined ? `:${log.sourcePort}` : ''}
                  </span>
                  {log.sourceIp && (
                    <button
                      type="button"
                      onClick={() => handleCopy(log.sourceIp!, 'Source IP')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Destination IP & Port</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-medium text-slate-800">
                    {log.destinationIp || '—'}
                    {log.destinationPort !== undefined ? `:${log.destinationPort}` : ''}
                  </span>
                  {log.destinationIp && (
                    <button
                      type="button"
                      onClick={() => handleCopy(log.destinationIp!, 'Destination IP')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Protocol</span>
                <span className="font-semibold text-slate-800 mt-1 block">
                  {log.protocol || 'N/A'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Application / Binary</span>
                <span className="font-semibold text-slate-800 mt-1 block truncate">
                  {log.application || 'System Kernel'}
                </span>
              </div>
            </div>
          </div>

          {/* Related Firewall Rule */}
          {log.rule && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Associated Firewall Policy
              </h3>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-emerald-50/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{log.rule}</span>
                  {log.ruleId && (
                    <span className="text-[11px] font-mono text-slate-500">ID: {log.ruleId}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActivePage('rules')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>View Rule</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Metadata Section */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Event Metadata
              </h3>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
                {Object.entries(log.metadata).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-0.5 border-b border-slate-200/50 last:border-0">
                    <span className="text-slate-500 capitalize">{key}:</span>
                    <span className="font-mono font-medium text-slate-800">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Kernel Netfilter Payload */}
          {log.rawPayload && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-600" /> Netfilter Raw Log String
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy(log.rawPayload!, 'Raw Payload')}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 text-slate-200 font-mono text-[11px] break-all leading-relaxed overflow-x-auto">
                {log.rawPayload}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Close
          </button>

          {log.sourceIp && log.action === 'Blocked' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                openCreateRuleModal();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Create Mitigation Rule</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
