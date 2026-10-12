import React, { useState } from 'react';
import { useFirewall } from '../hooks/useFirewall';
import { Search, Bell, Minus, Square, X, ChevronRight, Activity } from 'lucide-react';
import { NotificationPanel } from '../components/common/NotificationPanel';
import { UserMenu } from '../components/common/UserMenu';

interface TopBarProps {
  onOpenSearch: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSearch }) => {
  const { status, unreadAlertsCount, activePage, addToast, dashboardState, setDashboardState } = useFirewall();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const getPageTitleAndBreadcrumbs = () => {
    switch (activePage) {
      case 'dashboard':
        return { title: 'Dashboard', crumb: 'Overview' };
      case 'rules':
        return { title: 'Firewall Rules', crumb: 'Policy Engine' };
      case 'activity':
        return { title: 'Network Activity', crumb: 'Live Sockets' };
      case 'applications':
        return { title: 'Applications', crumb: 'Binary Access' };
      case 'logs':
        return { title: 'Security Logs', crumb: 'Audit Journal' };
      case 'alerts':
        return { title: 'Security Alerts', crumb: 'Incident Center' };
      case 'settings':
        return { title: 'Settings', crumb: 'System Configuration' };
      default:
        return { title: 'Dashboard', crumb: 'Overview' };
    }
  };

  const { title, crumb } = getPageTitleAndBreadcrumbs();

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Breadcrumbs & Page Identifier */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span className="font-bold text-slate-800">NEXUS</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-500 font-semibold">{title}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden md:block" />
          <span className="text-slate-400 text-[11px] hidden md:block">{crumb}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-left text-xs text-slate-400 hover:text-slate-500 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          aria-label="Search rules, applications, or IP addresses"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="text-slate-500 text-xs truncate">Search rules, applications, or IP addresses...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Header Section */}
      <div className="flex items-center gap-4">
        {/* System Status: Clearly labeled Development Preview */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
          <span className={`w-2 h-2 rounded-full ${status.isActive ? 'bg-emerald-500' : 'bg-slate-400'} ring-4 ${status.isActive ? 'ring-emerald-50' : 'ring-slate-100'}`} />
          <div className="text-left leading-tight">
            <span className="font-bold text-slate-800 text-[11px] block">
              {status.isActive ? 'Protected' : 'Paused'}
            </span>
            <span className="text-[10px] text-blue-600 font-semibold block">
              Development Preview
            </span>
          </div>
        </div>

        {/* Notifications Button with Panel Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label={`View notifications (${unreadAlertsCount} unread)`}
            aria-expanded={isNotificationOpen}
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <NotificationPanel
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        {/* User Profile Menu */}
        <UserMenu />
      </div>
    </header>
  );
};
