import React, { useState, useEffect } from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { X, ShieldCheck, ArrowRightLeft, Cpu, Hash, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { ActionType, DirectionType, ProtocolType, FirewallRule } from '../../types/firewall';
import { tauriBridge, ValidationError, RuleConflict } from '../../services/tauriBridge';

export const RuleModal: React.FC = () => {
  const { 
    isCreateRuleModalOpen, 
    closeCreateRuleModal, 
    editingRule, 
    addRule, 
    updateRule 
  } = useFirewall();

  const [name, setName] = useState('');
  const [action, setAction] = useState<ActionType>('ALLOW');
  const [direction, setDirection] = useState<DirectionType>('OUTBOUND');
  const [protocol, setProtocol] = useState<ProtocolType>('TCP');
  const [source, setSource] = useState('Any');
  const [destination, setDestination] = useState('Any');
  const [port, setPort] = useState('443');
  const [priority, setPriority] = useState<number>(100);
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Security Core feedback states
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [conflicts, setConflicts] = useState<RuleConflict[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name);
      setAction(editingRule.action);
      setDirection(editingRule.direction);
      setProtocol(editingRule.protocol);
      setSource(editingRule.source);
      setDestination(editingRule.destination);
      setPort(editingRule.port);
      setPriority(editingRule.priority);
      setDescription(editingRule.description || '');
      setEnabled(editingRule.enabled);
    } else {
      setName('');
      setAction('ALLOW');
      setDirection('OUTBOUND');
      setProtocol('TCP');
      setSource('Any');
      setDestination('Any');
      setPort('443');
      setPriority(100);
      setDescription('');
      setEnabled(true);
    }
    setErrors({});
    setValidationErrors([]);
    setConflicts([]);
  }, [editingRule, isCreateRuleModalOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCreateRuleModalOpen) {
        closeCreateRuleModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateRuleModalOpen, closeCreateRuleModal]);

  // Live Security Core Pre-Check Debounce
  useEffect(() => {
    if (!isCreateRuleModalOpen) return;

    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const candidatePartial = {
          name,
          action,
          direction,
          protocol,
          source,
          destination,
          port,
          priority,
        };

        const vErrs = await tauriBridge.validateRule(candidatePartial);
        setValidationErrors(vErrs || []);

        const candidateRule: FirewallRule = {
          id: editingRule ? editingRule.id : 'candidate',
          name,
          action,
          direction,
          protocol,
          source,
          destination,
          port,
          priority,
          enabled,
          createdAt: editingRule ? editingRule.createdAt : new Date().toISOString(),
          hitCount: editingRule ? editingRule.hitCount : 0,
        };

        const detectedConflicts = await tauriBridge.checkConflicts(candidateRule);
        setConflicts(detectedConflicts || []);
      } catch (err) {
        console.error('Security Core pre-validation failed:', err);
      } finally {
        setIsValidating(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [name, action, direction, protocol, source, destination, port, priority, enabled, editingRule, isCreateRuleModalOpen]);

  if (!isCreateRuleModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Rule name is required';
    }
    if (!port.trim()) {
      newErrors.port = 'Port or range is required (e.g. 443 or Any)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingRule) {
      updateRule(editingRule.id, {
        name: name.trim(),
        action,
        direction,
        protocol,
        source: source.trim() || 'Any',
        destination: destination.trim() || 'Any',
        port: port.trim() || 'Any',
        priority,
        description: description.trim(),
        enabled,
      });
    } else {
      addRule({
        name: name.trim(),
        action,
        direction,
        protocol,
        source: source.trim() || 'Any',
        destination: destination.trim() || 'Any',
        port: port.trim() || 'Any',
        priority,
        description: description.trim(),
        enabled,
      });
    }

    closeCreateRuleModal();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="rule-modal-title" className="text-base font-semibold text-slate-900">
                {editingRule ? 'Edit Firewall Rule' : 'Create New Rule'}
              </h3>
              <p className="text-xs text-slate-500">
                Rust Security Core policy definition & validation
              </p>
            </div>
          </div>
          <button
            onClick={closeCreateRuleModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Rule Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Rule Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Allow HTTPS Outbound"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 text-xs transition-all"
              autoFocus
            />
            {errors.name && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.name}</span>
            )}
          </div>

          {/* Action & Direction */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as ActionType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs bg-white"
              >
                <option value="ALLOW">ALLOW</option>
                <option value="BLOCK">BLOCK (Drop)</option>
                <option value="REJECT">REJECT (Reset)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Traffic Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as DirectionType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs bg-white"
              >
                <option value="INBOUND">INBOUND</option>
                <option value="OUTBOUND">OUTBOUND</option>
                <option value="BOTH">BIDIRECTIONAL</option>
              </select>
            </div>
          </div>

          {/* Protocol & Port */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Protocol
              </label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as ProtocolType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs bg-white"
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
                <option value="ALL">ALL PROTOCOLS</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Port / Range *
              </label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="443, 80-90, or Any"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs"
              />
              {errors.port && (
                <span className="text-[11px] text-rose-500 mt-1 block">{errors.port}</span>
              )}
            </div>
          </div>

          {/* Source & Destination */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Source IP / Subnet
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Any or 192.168.1.0/24"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Destination IP / Subnet
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Any or 10.0.0.0/8"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Priority & Description */}
          <div className="grid grid-cols-3 gap-3.5">
            <div className="col-span-1">
              <label className="block font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1.5">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reason or purpose for this rule"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Live Security Core Feedback Banner */}
          {conflicts.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Security Core Pre-Check: Rule Conflict Detected</span>
              </div>
              <p className="text-amber-800">{conflicts[0].description}</p>
              <p className="text-amber-700 font-medium">💡 {conflicts[0].recommendation}</p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-900 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Validation Failure: {validationErrors[0].field}</span>
              </div>
              <p className="text-rose-800">{validationErrors[0].reason}</p>
              {validationErrors[0].suggestion && (
                <p className="text-rose-700 font-medium">Suggestion: {validationErrors[0].suggestion}</p>
              )}
            </div>
          )}

          {conflicts.length === 0 && validationErrors.length === 0 && name.trim().length > 0 && (
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 text-[11px] flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Security Core Check: Policy parameters valid with zero conflicting precedence.</span>
            </div>
          )}

          {/* Initial State Switch */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <span className="font-semibold text-slate-800 block text-xs">Enable Rule Immediately</span>
              <span className="text-[11px] text-slate-500">Inject into active Security Core table upon creation</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                enabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-4.5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeCreateRuleModal}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-colors"
            >
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
