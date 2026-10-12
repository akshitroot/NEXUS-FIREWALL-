import React from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { Shield, ArrowRight, Plus } from 'lucide-react';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';

interface FirewallRulesTableProps {
  isLoading?: boolean;
}

export const FirewallRulesTable: React.FC<FirewallRulesTableProps> = ({ isLoading = false }) => {
  const { rules, toggleRule, openRuleWizard, setActivePage } = useFirewall();
  const displayRules = rules.slice(0, 5);

  if (isLoading) {
    return <LoadingState type="table" rows={5} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4.5 h-4.5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Recent Firewall Rules
          </h3>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            (Demo Policy Set)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openRuleWizard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Rule</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('rules')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>View all rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Rules Table */}
      {displayRules.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-2.5 font-medium">Rule Name</th>
                <th className="pb-2.5 font-medium">Direction</th>
                <th className="pb-2.5 font-medium">Protocol</th>
                <th className="pb-2.5 font-medium">Port</th>
                <th className="pb-2.5 font-medium">Action</th>
                <th className="pb-2.5 font-medium text-center pr-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 text-slate-700">
              {displayRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <span className={`w-1.5 h-1.5 rounded-full ${rule.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="font-semibold text-xs text-slate-900">{rule.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <StatusBadge type="direction" value={rule.direction} size="sm" />
                  </td>
                  <td className="py-2.5 font-semibold text-slate-600">{rule.protocol}</td>
                  <td className="py-2.5 font-mono text-[11px] text-slate-600">{rule.port}</td>
                  <td className="py-2.5">
                    <StatusBadge type="action" value={rule.action} size="sm" />
                  </td>
                  <td className="py-2.5 text-center pr-2">
                    <ToggleSwitch
                      size="sm"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                      label={`Toggle ${rule.name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<Shield className="w-6 h-6 text-slate-400" />}
          title="No Firewall Rules Defined"
          description="Create your first packet inspection rule using the Rule Wizard."
          actionText="Create Rule"
          onAction={openRuleWizard}
        />
      )}
    </div>
  );
};
