import React, { useRef, useEffect } from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { Bell, CheckCheck, ExternalLink, ShieldAlert, AlertTriangle, ShieldCheck, Info, X } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { alerts, markAlertAsRead, markAllAlertsAsRead, setActivePage } = useFirewall();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = alerts.filter(a => a.status === 'unread').length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden text-xs animate-in fade-in duration-150"
      role="region"
      aria-label="Security Notifications"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAlertsAsRead}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {alerts.length > 0 ? (
          alerts.slice(0, 6).map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                alert.status === 'unread' ? 'bg-blue-50/20' : ''
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <StatusBadge type="severity" value={alert.severity} size="sm" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-semibold text-slate-900 truncate">
                    {alert.title}
                  </p>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {alert.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {alert.description}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      markAlertAsRead(alert.id);
                      setActivePage('alerts');
                      onClose();
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View Alert</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>

                  {alert.status === 'unread' && (
                    <button
                      type="button"
                      onClick={() => markAlertAsRead(alert.id)}
                      className="text-[10px] font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400">
            <p className="text-xs">No notifications</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setActivePage('alerts');
            onClose();
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 w-full text-center"
        >
          View all in Alert Center →
        </button>
      </div>
    </div>
  );
};
