import React from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useFirewall();

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
            case 'warning':
              return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
            case 'error':
              return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
            case 'info':
            default:
              return <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />;
          }
        };

        const getBorderClass = () => {
          switch (toast.type) {
            case 'success': return 'border-emerald-200 bg-white shadow-emerald-500/5';
            case 'warning': return 'border-amber-200 bg-white shadow-amber-500/5';
            case 'error': return 'border-rose-200 bg-white shadow-rose-500/5';
            case 'info': default: return 'border-blue-200 bg-white shadow-blue-500/5';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${getBorderClass()}`}
          >
            {getIcon()}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-semibold text-slate-900 leading-snug">
                {toast.title}
              </p>
              {toast.message && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
