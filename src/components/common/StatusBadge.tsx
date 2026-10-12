import React from 'react';
import { getActionBadgeClasses, getDirectionBadgeClasses, getSeverityBadgeClasses } from '../../lib/utils';
import { ActionType, DirectionType, AlertSeverity } from '../../types/firewall';

interface StatusBadgeProps {
  type: 'action' | 'direction' | 'severity' | 'status';
  value: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  size = 'md',
  className = '',
}) => {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]';

  if (type === 'action') {
    const act = value.toUpperCase() as ActionType;
    const badge = getActionBadgeClasses(act);
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-md border ${badge.bg} ${pad} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
        <span className="capitalize">{value.toLowerCase()}</span>
      </span>
    );
  }

  if (type === 'direction') {
    const dir = value.toUpperCase() as DirectionType;
    const badge = getDirectionBadgeClasses(dir);
    return (
      <span className={`inline-flex items-center font-bold rounded-md border ${badge.bg} ${pad} ${className}`}>
        <span className="uppercase">{value}</span>
      </span>
    );
  }

  if (type === 'severity') {
    const sev = value.toLowerCase() as AlertSeverity;
    const badge = getSeverityBadgeClasses(sev);
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-md border ${badge.bg} ${pad} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
        <span className="capitalize">{value}</span>
      </span>
    );
  }

  // System or general status
  if (value.toLowerCase() === 'active' || value.toLowerCase() === 'protected' || value.toLowerCase() === 'allowed') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200/60 ${pad} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>{value}</span>
      </span>
    );
  }

  if (value.toLowerCase() === 'blocked' || value.toLowerCase() === 'disabled') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-md border bg-rose-50 text-rose-700 border-rose-200/60 ${pad} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>{value}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-md border bg-slate-50 text-slate-700 border-slate-200/60 ${pad} ${className}`}>
      <span>{value}</span>
    </span>
  );
};
