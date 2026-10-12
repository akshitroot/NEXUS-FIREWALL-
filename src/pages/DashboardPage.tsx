import React from 'react';
import { useFirewall } from '../hooks/useFirewall';
import { FirewallStatusCard } from '../components/dashboard/FirewallStatusCard';
import { SecurityOverviewCard } from '../components/dashboard/SecurityOverviewCard';
import { RecentActivityTable } from '../components/dashboard/RecentActivityTable';
import { FirewallRulesTable } from '../components/dashboard/FirewallRulesTable';
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard';
import { RecentAlertsCard } from '../components/dashboard/RecentAlertsCard';
import { BrandingCard } from '../components/dashboard/BrandingCard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { DashboardUIState } from '../types/firewall';
import { Shield, Sliders } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { dashboardState, setDashboardState, openRuleWizard } = useFirewall();

  return (
    <div className="space-y-6">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good morning, Akshit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor and control your network security from one place.
          </p>
        </div>

        {/* State preview switcher (allows reviewing all required UI states: Normal, Loading, Empty, Error, Offline) */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl shadow-2xs text-[11px]">
          <span className="text-slate-400 font-semibold px-2 flex items-center gap-1">
            <Sliders className="w-3 h-3" />
            <span>State:</span>
          </span>
          {(['normal', 'loading', 'empty', 'error', 'offline'] as DashboardUIState[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setDashboardState(st)}
              className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors ${
                dashboardState === st
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* STATE 1: LOADING */}
      {dashboardState === 'loading' && (
        <LoadingState type="dashboard" />
      )}

      {/* STATE 2: ERROR */}
      {dashboardState === 'error' && (
        <div className="py-12">
          <ErrorState
            title="Failed to Synchronize Telemetry Stream"
            message="An unexpected condition prevented the socket listener from querying the netlink socket. Please verify that the system is responsive and retry."
            onRetry={() => setDashboardState('normal')}
          />
        </div>
      )}

      {/* STATE 3: OFFLINE / BACKEND UNAVAILABLE */}
      {dashboardState === 'offline' && (
        <div className="py-12">
          <ErrorState
            isOffline
            title="Tauri Security Daemon Unavailable"
            message="NEXUS Firewall frontend is currently running in development preview mode. The Tauri + Rust native security daemon is not yet connected to execute nftables bytecode."
            onRetry={() => setDashboardState('normal')}
          />
        </div>
      )}

      {/* STATE 4: EMPTY */}
      {dashboardState === 'empty' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <FirewallStatusCard />
                </div>
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-center">
                  <EmptyState
                    icon={<Shield className="w-6 h-6 text-slate-400" />}
                    title="No Security Metrics Yet"
                    description="Telemetry will populate once packet traffic flows through the filter."
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <EmptyState
                  title="No Network Activity Recorded"
                  description="All connection channels are currently idle. Inbound and outbound socket sessions will be listed here in real time."
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <EmptyState
                  title="No Custom Rules Configured"
                  description="Your firewall is currently enforcing default policy. Create a custom rule using the Rule Wizard to specify target hosts and protocols."
                  actionText="Open Rule Wizard"
                  onAction={openRuleWizard}
                />
              </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <QuickActionsCard />
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <EmptyState
                  title="Zero Alerts"
                  description="Your system has detected no security incidents or blocked port sweeps."
                />
              </div>
              <BrandingCard />
            </div>
          </div>
        </div>
      )}

      {/* STATE 5: NORMAL (ACTIVE DEMO DASHBOARD) */}
      {dashboardState === 'normal' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols on XL) */}
          <div className="xl:col-span-8 space-y-6">
            {/* Top Status & Overview Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <FirewallStatusCard />
              </div>
              <div className="lg:col-span-5">
                <SecurityOverviewCard />
              </div>
            </div>

            {/* Recent Network Activity */}
            <RecentActivityTable />

            {/* Recent Firewall Rules */}
            <FirewallRulesTable />
          </div>

          {/* Right Column (4 cols on XL) */}
          <div className="xl:col-span-4 space-y-6">
            <QuickActionsCard />
            <RecentAlertsCard />
            <BrandingCard />
          </div>
        </div>
      )}
    </div>
  );
};
