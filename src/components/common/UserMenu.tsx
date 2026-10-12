import React, { useRef, useEffect, useState } from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { User, Sliders, Settings, Info, LogOut, ChevronDown, Check } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { setActivePage, addToast } = useFirewall();
  const [isOpen, setIsOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSignOut = () => {
    setIsSignOutConfirmOpen(false);
    setIsOpen(false);
    addToast({
      type: 'info',
      title: 'Session Notice',
      message: 'Demo session reset. Administrator credentials remain in local preview mode.',
    });
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-expanded={isOpen}
        aria-label="User profile options"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
          A
        </div>
        <div className="text-left hidden lg:block">
          <span className="text-xs font-bold text-slate-900 block leading-tight">
            Akshit
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Security Administrator
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 mt-1 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 text-xs animate-in fade-in duration-150">
          <div className="px-4 py-2.5 border-b border-slate-100">
            <p className="font-bold text-slate-900">Akshit</p>
            <p className="text-[11px] text-slate-500">Security Administrator</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Role: Admin (Preview)
            </span>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setActivePage('settings');
                setIsOpen(false);
                addToast({ type: 'info', title: 'Administrator Profile', message: 'Current role has full netfilter management privileges in development preview.' });
              }}
              className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePage('settings');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Preferences</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePage('settings');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAboutModalOpen(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <Info className="w-4 h-4 text-slate-400" />
              <span>About NEXUS</span>
            </button>
          </div>

          <div className="border-t border-slate-100 my-1" />

          <button
            type="button"
            onClick={() => {
              setIsSignOutConfirmOpen(true);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign out</span>
          </button>
        </div>
      )}

      {/* Confirm Sign Out Dialog */}
      <ConfirmDialog
        isOpen={isSignOutConfirmOpen}
        title="Sign Out of Session?"
        message="This will reset the current active desktop session to presentation preview mode."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        isDestructive={false}
        onConfirm={handleSignOut}
        onCancel={() => setIsSignOutConfirmOpen(false)}
      />

      {/* About NEXUS Modal */}
      {isAboutModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-sm overflow-hidden p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs font-extrabold text-lg">
              N
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">NEXUS Firewall</h3>
              <p className="text-xs text-blue-600 font-medium">Advanced security. Simple control.</p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Version 1.0.0 (Phase 2 Development Preview). Built with React, TypeScript, and Tailwind CSS, prepared for Tauri + Rust Linux desktop security core.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
