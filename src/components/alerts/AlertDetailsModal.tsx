import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Hash, 
  FileText, 
  Shield, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { Alert } from '../../types/firewall';
import { getSeverityBadgeClasses } from '../../lib/utils';
import { useFirewall } from '../../hooks/useFirewall';

interface AlertDetailsModalProps {
  alert: Alert | null;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onCreateRule: (alert: Alert) => void;
}

export const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({
  alert,
  onClose,
  onAcknowledge,
  onResolve,
  onCreateRule,
}) => {
  const { setActivePage } = useFirewall();
  const [copied, setCopied] = useState(false);

  if (!alert) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getSeverityBadgeClasses(alert.severity)}`}>
              {alert.severity}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 capitalize">
              {alert.status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{alert.id}</span>
              <div className="flex items-center gap-1 text-slate-500 font-sans">
                <Clock className="w-3.5 h-3.5" />
                <span>{alert.timestamp}</span>
              </div>
            </div>
            <h3 id="alert-modal-title" className="text-lg font-bold text-slate-900 mt-1">
              {alert.title}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {alert.description}
            </p>
          </div>

          {/* Incident Context Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Source Entity</span>
              <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                {alert.sourceIp || 'Internal / N/A'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Target Entity</span>
              <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                {alert.targetIp || '192.168.1.45 (Local Host)'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Target Port</span>
              <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                {alert.port !== undefined ? alert.port : 'Multiple / N/A'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Related Application</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {alert.application || 'System Service'}
              </span>
            </div>
          </div>

          {/* Related Rule If Any */}
          {alert.relatedRule && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Related Firewall Rule</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{alert.relatedRule}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActivePage('rules');
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>Rules</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Recommended Action */}
          {alert.recommendedAction && (
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block mb-1">
                Recommended Action
              </span>
              <p className="text-xs text-blue-800 leading-relaxed">
                {alert.recommendedAction}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {alert.status === 'unread' && (
              <button
                type="button"
                onClick={() => {
                  onAcknowledge(alert.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Acknowledge
              </button>
            )}
            {alert.status !== 'resolved' && (
              <button
                type="button"
                onClick={() => {
                  onResolve(alert.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                Resolve Incident
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateRule(alert);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Create Rule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
