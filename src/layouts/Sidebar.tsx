import React from 'react';
import { useFirewall } from '../hooks/useFirewall';
import { PageView } from '../types/firewall';
import { NexusLogo } from '../components/common/NexusLogo';
import { 
  Home, 
  Shield, 
  Wifi, 
  LayoutGrid, 
  FileText, 
  Bell, 
  Settings, 
  ShieldCheck 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, unreadAlertsCount, status } = useFirewall();

  const navItems: { id: PageView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-4.5 h-4.5" /> },
    { id: 'rules', label: 'Rules', icon: <Shield className="w-4.5 h-4.5" /> },
    { id: 'activity', label: 'Network Activity', icon: <Wifi className="w-4.5 h-4.5" /> },
    { id: 'applications', label: 'Applications', icon: <LayoutGrid className="w-4.5 h-4.5" /> },
    { id: 'logs', label: 'Logs', icon: <FileText className="w-4.5 h-4.5" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4.5 h-4.5" />, badge: unreadAlertsCount },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4.5 h-4.5" /> },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between shrink-0 select-none">
      {/* Top Branding */}
      <div>
        <div className="h-20 px-6 flex items-center gap-3.5 border-b border-slate-100/80">
          <NexusLogo size={36} />
          <div className="leading-tight">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 block font-sans">
              NEXUS
            </span>
            <span className="text-xs font-semibold text-slate-400 block tracking-wide">
              Firewall
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3.5 space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-blue-600' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-none">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Card: System Protected with green indicator */}
      <div className="p-3.5 border-t border-slate-100">
        <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-xs font-bold text-slate-800">
                System Protected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 pl-4">
              Linux • nftables
            </p>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5 pl-4">
              Development Preview
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>
    </aside>
  );
};
