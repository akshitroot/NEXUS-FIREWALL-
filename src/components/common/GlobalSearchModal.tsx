import React, { useState, useEffect, useRef } from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { Search, Shield, Globe, LayoutGrid, Bell, ArrowRight, X } from 'lucide-react';
import { AppIcon } from './AppIcon';
import { getActionBadgeClasses } from '../../lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { rules, applications, alerts, setActivePage, openEditRuleModal } = useFirewall();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingRules = q ? rules.filter(r => 
    r.name.toLowerCase().includes(q) ||
    r.port.toLowerCase().includes(q) ||
    r.source.toLowerCase().includes(q) ||
    r.destination.toLowerCase().includes(q) ||
    r.protocol.toLowerCase().includes(q)
  ) : rules.slice(0, 3);

  const matchingApps = q ? applications.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.executablePath.toLowerCase().includes(q) ||
    a.category.toLowerCase().includes(q)
  ) : applications.slice(0, 3);

  const matchingAlerts = q ? alerts.filter(al =>
    al.title.toLowerCase().includes(q) ||
    al.description.toLowerCase().includes(q)
  ) : alerts.slice(0, 3);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rules, applications, ports, or IP addresses..."
            className="flex-1 text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="p-3 overflow-y-auto space-y-4 max-h-[60vh]">
          {/* Rules Section */}
          {matchingRules.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Firewall Rules ({matchingRules.length})</span>
                <button
                  onClick={() => { setActivePage('rules'); onClose(); }}
                  className="text-blue-600 hover:underline capitalize"
                >
                  View all
                </button>
              </div>
              <div className="space-y-1">
                {matchingRules.map(rule => {
                  const badge = getActionBadgeClasses(rule.action);
                  return (
                    <div
                      key={rule.id}
                      onClick={() => {
                        openEditRuleModal(rule);
                        onClose();
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{rule.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {rule.protocol} · Port: {rule.port} · {rule.direction}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                        {rule.action}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Applications Section */}
          {matchingApps.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Applications ({matchingApps.length})</span>
                <button
                  onClick={() => { setActivePage('applications'); onClose(); }}
                  className="text-blue-600 hover:underline capitalize"
                >
                  View all
                </button>
              </div>
              <div className="space-y-1">
                {matchingApps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => {
                      setActivePage('applications');
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AppIcon name={app.name} size={18} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{app.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{app.executablePath}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      app.status === 'ALLOWED' ? 'bg-emerald-50 text-emerald-700' :
                      app.status === 'BLOCKED' ? 'bg-rose-50 text-rose-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Section */}
          {matchingAlerts.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Security Alerts ({matchingAlerts.length})</span>
                <button
                  onClick={() => { setActivePage('alerts'); onClose(); }}
                  className="text-blue-600 hover:underline capitalize"
                >
                  View all
                </button>
              </div>
              <div className="space-y-1">
                {matchingAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setActivePage('alerts');
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Bell className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{alert.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{alert.description}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">{alert.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {q && matchingRules.length === 0 && matchingApps.length === 0 && matchingAlerts.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching by IP, port (e.g. 443, 22), or protocol name.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Navigation: Click item to view</span>
          </div>
          <span>NEXUS Firewall Engine</span>
        </div>
      </div>
    </div>
  );
};
