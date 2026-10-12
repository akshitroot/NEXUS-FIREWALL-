import React from 'react';
import { AlertCircle, RefreshCw, ServerOff, ShieldAlert } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  isOffline?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  isOffline = false,
  onRetry,
  className = '',
}) => {
  if (isOffline) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200/90 p-8 text-center max-w-lg mx-auto shadow-xs ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 mx-auto mb-3.5">
          <ServerOff className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 mb-2">
          Development Preview Mode
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1.5">
          {title || 'Tauri Security Daemon Disconnected'}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mb-4">
          {message || 'The frontend is currently operating in presentation preview mode. Native Linux nftables inspection requires the Tauri + Rust security backend.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Daemon Connection</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-rose-200/80 p-8 text-center max-w-lg mx-auto shadow-xs ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600 mx-auto mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1.5">
        {title || 'Failed to Synchronize Telemetry'}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mb-4">
        {message || 'An unexpected condition prevented telemetry stream synchronization. Please retry the request.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
