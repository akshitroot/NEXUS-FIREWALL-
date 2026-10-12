import React, { useState, useEffect, useRef } from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { Search, Shield, Wifi, LayoutGrid, Bell, ArrowRight, X, Clock, Terminal } from 'lucide-react';
import { AppIcon } from './AppIcon';
import { StatusBadge } from './StatusBadge';

interface SearchCommandProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchCommand: React.FC<SearchCommandProps> = ({ isOpen, onClose }) => {
  const { 
    rules, 
    applications, 
    networkConnections, 
    alerts, 
    setActivePage, 
    openEditRuleModal 
  } = useFirewall();

  const [inputVal, setInputVal] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input (200ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(inputVal.trim().toLowerCase());
    }, 200);
    return () => clearTimeout(handler);
  }, [inputVal]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setInputVal('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  // Handle ESC
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

  const q = debouncedQuery;

  // Filter Group 1: Rules
  const matchingRules = q ? rules.filter(r => 
    r.name.toLowerCase().includes(q) ||
    r.port.toLowerCase().includes(q) ||
    r.source.toLowerCase().includes(q) ||
    r.destination.toLowerCase().includes(q) ||
    r.protocol.toLowerCase().includes(q) ||
    r.action.toLowerCase().includes(q)
  ).slice(0, 4) : rules.slice(0, 3);

  // Filter Group 2: Applications
  const matchingApps = q ? applications.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.executablePath.toLowerCase().includes(q) ||
    a.category.toLowerCase().includes(q)
  ).slice(0, 4) : applications.slice(0, 3);

  // Filter Group 3: Network Activity
  const matchingActivity = q ? networkConnections.filter(c =>
    c.application.toLowerCase().includes(q) ||
    c.source.toLowerCase().includes(q) ||
    c.destination.toLowerCase().includes(q) ||
    String(c.port).includes(q) ||
    c.protocol.toLowerCase().includes(q)
  ).slice(0, 4) : networkConnections.slice(0, 3);

  // Filter Group 4: Alerts
  const matchingAlerts = q ? alerts.filter(al =>
    al.title.toLowerCase().includes(q) ||
    al.description.toLowerCase().includes(q) ||
    (al.sourceIp && al.sourceIp.includes(q))
  ).slice(0, 4) : alerts.slice(0, 3);

  const hasAnyResults = 
    matchingRules.length > 0 || 
    matchingApps.length > 0 || 
    matchingActivity.length > 0 || 
    matchingAlerts.length > 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden flex flex-col max-h-[82vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search rules, applications, network traffic, or alerts..."
            className="flex-1 text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {inputVal && (
            <button
              onClick={() => { setInputVal(''); setDebouncedQuery(''); }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="p-3 overflow-y-auto space-y-4 max-h-[62vh]">
          {/* Rules Group */}
          {matchingRules.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rules ({matchingRules.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => { setActivePage('rules'); onClose(); }}
                  className="text-blue-600 hover:underline capitalize font-semibold"
                >
                  View all
                </button>
              </div>
              <div className="space-y-1 mt-1">
                {matchingRules.map(rule => (
                  <div
                    key={rule.id}
                    onClick={() => {
                      setActivePage('rules');
                      openEditRuleModal(rule);
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">{rule.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {rule.protocol} · Port: {rule.port} · {rule.direction}
                      </p>
                    </div>
                    <StatusBadge type="action" value={rule.action} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications Group */}
          {matchingApps.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                  <span>Applications ({matchingApps.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => { setActivePage('applications'); onClose(); }}
                  className="text-blue-600 hover:underline capitalize font-semibold"
                >
                  View all
                </button>
              </div>
              <div className="space-y-1 mt-1">
                {matchingApps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => {
                      setActivePage('applications');
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <AppIcon name={app.name} size={18} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{app.name}</p>
                        <p className="text-[11px] text-slate-500 truncate font-mono">{app.executablePath}</p>
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

          {/* Network Activity Group */}
          {matchingActivity.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-blue-600" />
                  <span>Network Activity ({matchingActivity.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => { setActivePage('activity'); onClose(); }}
                  className="text-blue-600 hover:underline capitalize font-semibold"
                >
                  View all
                </button>
              </div>
              <div className="space-y-1 mt-1">
                {matchingActivity.map(conn => (
                  <div
                    key={conn.id}
                    onClick={() => {
                      setActivePage('activity');
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <AppIcon name={conn.application} size={16} />
                      <div className="min-w-0 font-mono text-[11px]">
                        <p className="font-semibold text-slate-900 truncate">{conn.application} → {conn.destination}:{conn.port}</p>
                        <p className="text-slate-400 text-[10px]">{conn.timestamp} · {conn.protocol} · {conn.direction || 'OUTBOUND'}</p>
                      </div>
                    </div>
                    <StatusBadge type="action" value={conn.action} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Group */}
          {matchingAlerts.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-600" />
                  <span>Alerts ({matchingAlerts.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => { setActivePage('alerts'); onClose(); }}
                  className="text-blue-600 hover:underline capitalize font-semibold"
                >
                  View all
                </button>
              </div>
              <div className="space-y-1 mt-1">
                {matchingAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setActivePage('alerts');
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">{alert.title}</p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">{alert.description}</p>
                    </div>
                    <StatusBadge type="severity" value={alert.severity} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {q && !hasAnyResults && (
            <div className="py-10 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold text-slate-700">No results found for &ldquo;{inputVal}&rdquo;</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Try searching by application (Chrome, SSH), port (443, 22), IP address, or action.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Search scope: Rules, Applications, Network Activity, Alerts</span>
          <span className="font-semibold text-slate-600">NEXUS Global Command</span>
        </div>
      </div>
    </div>
  );
};
