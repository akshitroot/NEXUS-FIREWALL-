import React from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { Bell, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';

interface RecentAlertsCardProps {
  isLoading?: boolean;
}

export const RecentAlertsCard: React.FC<RecentAlertsCardProps> = ({ isLoading = false }) => {
  const { alerts, setActivePage } = useFirewall();
  const displayAlerts = alerts.slice(0, 5);

  if (isLoading) {
    return <LoadingState type="table" rows={4} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Recent Alerts
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setActivePage('alerts')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span>View all alerts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {displayAlerts.length > 0 ? (
        <div className="space-y-3">
          {displayAlerts.map((alert) => (
            <div 
              key={alert.id} 
              onClick={() => setActivePage('alerts')}
              className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 shrink-0">
                  <StatusBadge type="severity" value={alert.severity} size="sm" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate leading-snug">
                    {alert.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                    {alert.description}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0 pt-0.5 whitespace-nowrap">
                {alert.timestamp}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="w-6 h-6 text-slate-400" />}
          title="No Alerts"
          description="There are currently no active security alerts."
        />
      )}
    </div>
  );
};
