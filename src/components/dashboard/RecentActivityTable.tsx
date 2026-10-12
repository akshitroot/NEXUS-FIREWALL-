import React from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { Wifi, ArrowRight } from 'lucide-react';
import { AppIcon } from '../common/AppIcon';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';

interface RecentActivityTableProps {
  isLoading?: boolean;
}

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ isLoading = false }) => {
  const { networkConnections, setActivePage, isLiveFeedActive } = useFirewall();
  const displayItems = networkConnections.slice(0, 5);

  if (isLoading) {
    return <LoadingState type="table" rows={5} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Recent Network Activity
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700">
            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isLiveFeedActive ? 'animate-pulse' : ''}`} />
            <span>Live</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('activity')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span>View all activity</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      {displayItems.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-2.5 font-medium">Application</th>
                <th className="pb-2.5 font-medium">Destination</th>
                <th className="pb-2.5 font-medium">Protocol</th>
                <th className="pb-2.5 font-medium">Port</th>
                <th className="pb-2.5 font-medium">Direction</th>
                <th className="pb-2.5 font-medium">Action</th>
                <th className="pb-2.5 font-medium text-right pr-2">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 text-slate-700">
              {displayItems.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => setActivePage('activity')}
                  className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <AppIcon name={item.application} size={16} />
                      <span className="group-hover:text-blue-600 transition-colors">{item.application}</span>
                    </div>
                  </td>
                  <td className="py-2.5 font-mono text-slate-800 text-[11px]">{item.destination}</td>
                  <td className="py-2.5 font-semibold text-slate-600">{item.protocol}</td>
                  <td className="py-2.5 font-mono text-slate-600">{item.port}</td>
                  <td className="py-2.5">
                    <StatusBadge type="direction" value={item.direction || 'OUTBOUND'} size="sm" />
                  </td>
                  <td className="py-2.5">
                    <StatusBadge type="action" value={item.action} size="sm" />
                  </td>
                  <td className="py-2.5 text-right font-mono text-[11px] text-slate-400 pr-2">
                    {item.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<Wifi className="w-6 h-6 text-slate-400" />}
          title="No Network Activity"
          description="There is currently no simulated packet activity in the buffer."
          actionText="View Activity Page"
          onAction={() => setActivePage('activity')}
        />
      )}
    </div>
  );
};
