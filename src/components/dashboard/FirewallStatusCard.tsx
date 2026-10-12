import React from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { ShieldCheck, ShieldAlert, Cpu, Terminal, ListChecks, Clock, Activity, AlertCircle } from 'lucide-react';

export const FirewallStatusCard: React.FC = () => {
  const { status, toggleFirewallStatus } = useFirewall();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              status.isActive 
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                : 'bg-slate-100 text-slate-400'
            }`}>
              {status.isActive ? (
                <ShieldCheck className="w-8 h-8" />
              ) : (
                <ShieldAlert className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Firewall Protection
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                  Development Preview
                </span>
              </div>
              <h3 className={`text-2xl font-bold tracking-tight mt-0.5 ${
                status.isActive ? 'text-slate-900' : 'text-slate-500'
              }`}>
                {status.isActive ? 'Protected' : 'Protection Suspended'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {status.isActive 
                  ? 'Simulated netfilter packet filtering chains are running' 
                  : 'Traffic inspection paused (demo state)'}
              </p>
            </div>
          </div>

          <ToggleSwitch
            size="lg"
            checked={status.isActive}
            onChange={toggleFirewallStatus}
            label="Toggle Firewall Protection"
          />
        </div>

        {/* Demo state notice banner */}
        <div className="mt-4 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Demo state only: Real Linux kernel enforcement will activate upon Tauri + Rust integration.</span>
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5 mt-5 border-t border-slate-100 text-xs">
        <div>
          <p className="text-[10px] text-slate-400 font-medium">Status</p>
          <p className="text-xs font-bold text-emerald-600">{status.isActive ? 'Active' : 'Inactive'}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 font-medium">Backend</p>
          <p className="text-xs font-bold text-slate-800 truncate" title={status.backend}>{status.backend}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 font-medium">Platform</p>
          <p className="text-xs font-bold text-slate-800 truncate" title={status.platform}>{status.platform}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 font-medium">Policy</p>
          <p className="text-xs font-bold text-slate-800">Active</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 font-medium">Last Sync</p>
          <p className="text-xs font-bold text-slate-800 truncate">{status.lastVerified}</p>
        </div>
      </div>
    </div>
  );
};
