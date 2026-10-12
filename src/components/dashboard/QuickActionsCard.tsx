import React from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { Zap, Plus, Ban, Wifi, Bell, ArrowRight } from 'lucide-react';

export const QuickActionsCard: React.FC = () => {
  const { 
    setActivePage, 
    openRuleWizard, 
    addToast 
  } = useFirewall();

  const handleCreateRule = () => {
    setActivePage('rules');
    // Open the Rule Wizard
    openRuleWizard();
  };

  const handleBlockApplication = () => {
    setActivePage('applications');
    addToast({
      type: 'info',
      title: 'Applications View',
      message: 'Select any executable binary to set its policy to BLOCKED or ASK.',
    });
  };

  const handleViewNetworkActivity = () => {
    setActivePage('activity');
  };

  const handleReviewAlerts = () => {
    setActivePage('alerts');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-800">
          Quick Actions
        </h3>
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleCreateRule}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Plus className="w-4 h-4" />
            <span>Create Firewall Rule</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={handleBlockApplication}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Ban className="w-4 h-4 text-slate-500" />
            <span>Block Application</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={handleViewNetworkActivity}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Wifi className="w-4 h-4 text-slate-500" />
            <span>View Network Activity</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={handleReviewAlerts}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-slate-500" />
            <span>Review Alerts</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
