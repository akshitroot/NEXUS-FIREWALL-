import React from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { ArrowUpRight, ShieldCheck, ShieldAlert, ListChecks, Activity } from 'lucide-react';

export const SecurityOverviewCard: React.FC = () => {
  const { status, rules } = useFirewall();

  // SVG Gauge calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const percentage = status.protectedPercentage;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Security Overview
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">
            Demo Simulation Metrics
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          98% Ratio
        </span>
      </div>

      {/* Center Donut Gauge */}
      <div className="flex items-center justify-between gap-5 py-2 my-1">
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#F1F5F9"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Red segment for blocked */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#EF4444"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * (100 - percentage + 1)) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
            {/* Green segment for protected */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#10B981"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-slate-400 font-medium leading-none">
              Protected
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5">
              {percentage}%
            </span>
          </div>
        </div>

        {/* 4 Required metrics with small trend indicators */}
        <div className="flex-1 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium">Protected Connections</span>
            </div>
            <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
              <span>{status.allowedEventsCount}</span>
              <span className="text-[9px] text-emerald-600 font-normal">↑3%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[11px] font-medium">Blocked Connections</span>
            </div>
            <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
              <span>{status.blockedEventsCount}</span>
              <span className="text-[9px] text-slate-400 font-normal">↓1%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[11px] font-medium">Active Rules</span>
            </div>
            <div className="font-mono font-bold text-slate-900">
              {rules.filter(r => r.enabled).length}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-[11px] font-medium">Security Events</span>
            </div>
            <div className="font-mono font-bold text-slate-900">
              {status.totalEventsCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
