import React, { useState, useEffect } from 'react';
import { useFirewall } from '../hooks/useFirewall';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SearchCommand } from '../components/common/SearchCommand';
import { RuleWizard } from '../components/common/RuleWizard';
import { ToastContainer } from '../components/common/ToastContainer';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { RuleDetailsDrawer } from '../components/rules/RuleDetailsDrawer';
import { ImportRulesModal } from '../components/rules/ImportRulesModal';
import { DashboardPage } from '../pages/DashboardPage';
import { RulesPage } from '../pages/RulesPage';
import { NetworkActivityPage } from '../pages/NetworkActivityPage';
import { ApplicationsPage } from '../pages/ApplicationsPage';
import { LogsPage } from '../pages/LogsPage';
import { AlertsPage } from '../pages/AlertsPage';
import { SettingsPage } from '../pages/SettingsPage';

export const MainLayout: React.FC = () => {
  const { 
    activePage, 
    deleteConfirmRule, 
    closeDeleteConfirm, 
    deleteRule, 
    disableConfirmRule, 
    closeDisableConfirm, 
    disableRule 
  } = useFirewall();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl + K / Cmd + K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'rules':
        return <RulesPage />;
      case 'activity':
        return <NetworkActivityPage />;
      case 'applications':
        return <ApplicationsPage />;
      case 'logs':
        return <LogsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-800 antialiased font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopBar onOpenSearch={() => setIsSearchOpen(true)} />

        {/* Scrollable Main Content Canvas */}
        <main 
          className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 max-w-[1600px] w-full mx-auto"
          role="main"
          id="main-content"
          tabIndex={-1}
        >
          {renderActivePage()}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <SearchCommand isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <RuleWizard />
      <RuleDetailsDrawer />
      <ImportRulesModal />
      
      {/* Delete Rule Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmRule}
        title="Delete Firewall Rule"
        message={deleteConfirmRule ? `Are you sure you want to permanently delete rule "${deleteConfirmRule.name}"? This action will remove it from packet evaluation.` : ''}
        confirmLabel="Delete Rule"
        isDestructive={true}
        onConfirm={() => {
          if (deleteConfirmRule) deleteRule(deleteConfirmRule.id);
        }}
        onCancel={closeDeleteConfirm}
      />

      {/* Disable Rule Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!disableConfirmRule}
        title="Disable Firewall Rule"
        message={disableConfirmRule ? `Are you sure you want to pause rule "${disableConfirmRule.name}"? Traffic matching this rule will no longer be handled by this policy.` : ''}
        confirmLabel="Disable Rule"
        isDestructive={false}
        onConfirm={() => {
          if (disableConfirmRule) disableRule(disableConfirmRule.id);
        }}
        onCancel={closeDisableConfirm}
      />

      <ToastContainer />
    </div>
  );
};

