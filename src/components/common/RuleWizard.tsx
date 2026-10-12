import React, { useState, useEffect } from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { 
  X, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Cpu, 
  Network, 
  Sliders 
} from 'lucide-react';
import { ActionType, DirectionType, ProtocolType } from '../../types/firewall';
import { StatusBadge } from './StatusBadge';

export const RuleWizard: React.FC = () => {
  const { 
    isCreateRuleModalOpen, 
    closeCreateRuleModal, 
    editingRule, 
    addRule, 
    updateRule 
  } = useFirewall();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [direction, setDirection] = useState<DirectionType>('OUTBOUND');
  const [description, setDescription] = useState('');
  
  const [protocol, setProtocol] = useState<ProtocolType>('TCP');
  const [port, setPort] = useState('443');
  const [source, setSource] = useState('Any');
  const [destination, setDestination] = useState('Any');

  const [action, setAction] = useState<ActionType>('ALLOW');
  const [priority, setPriority] = useState<number>(1);
  const [enabled, setEnabled] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name);
      setDirection(editingRule.direction);
      setDescription(editingRule.description || '');
      setProtocol(editingRule.protocol);
      setPort(editingRule.port);
      setSource(editingRule.source);
      setDestination(editingRule.destination);
      setAction(editingRule.action);
      setPriority(editingRule.priority);
      setEnabled(editingRule.enabled);
    } else {
      setName('');
      setDirection('OUTBOUND');
      setDescription('');
      setProtocol('TCP');
      setPort('443');
      setSource('Any');
      setDestination('Any');
      setAction('ALLOW');
      setPriority(1);
      setEnabled(true);
    }
    setStep(1);
    setErrors({});
  }, [editingRule, isCreateRuleModalOpen]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCreateRuleModalOpen) {
        closeCreateRuleModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateRuleModalOpen, closeCreateRuleModal]);

  if (!isCreateRuleModalOpen) return null;

  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};
    if (currentStep === 1) {
      if (!name.trim()) errs.name = 'Rule name is required';
    }
    if (currentStep === 2) {
      if (!port.trim()) errs.port = 'Port or range is required (e.g. 443, 80,443 or Any)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="wizard-modal-title" className="text-base font-bold text-slate-900 leading-tight">
                {editingRule ? 'Edit Firewall Rule' : 'Rule Wizard'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingRule ? 'Modify netfilter policy parameters' : 'Step-by-step netfilter packet rule configuration'}
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

        {/* Step Progress Indicators */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'Scope' },
            { num: 2, label: 'Traffic & Ports' },
            { num: 3, label: 'Verdict & Policy' },
          ].map((st, idx) => (
            <React.Fragment key={st.num}>
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  step === st.num 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : step > st.num 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step > st.num ? <Check className="w-3 h-3" /> : st.num}
                </span>
                <span className={`font-semibold ${step === st.num ? 'text-slate-900' : 'text-slate-400'}`}>
                  {st.label}
                </span>
              </div>
              {idx < 2 && <div className="flex-1 h-0.5 bg-slate-200 mx-3" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step Forms */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* STEP 1: IDENTITY & DIRECTION */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Allow HTTPS or Block Suspicious Port"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 text-xs font-medium"
                  autoFocus
                />
                {errors.name && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.name}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Direction of Traffic
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['OUTBOUND', 'INBOUND', 'BOTH'] as DirectionType[]).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setDirection(dir)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all ${
                        direction === dir
                          ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Description / Justification (optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Reason for creating this rule (e.g., permit secure web browsing or drop backdoor scanners)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs placeholder:text-slate-400 resize-none font-sans"
                />
              </div>
            </div>
          )}

          {/* STEP 2: PROTOCOL & PORTS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Protocol
                  </label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value as ProtocolType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-semibold"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                    <option value="ALL">ALL Protocols</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Port / Range *
                  </label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="443 or 80,443 or Any"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-mono"
                    autoFocus
                  />
                  {errors.port && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.port}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Source IP / Subnet
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Any or 192.168.1.0/24"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Destination IP / Subnet
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Any or 10.0.0.0/8"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[11px] text-slate-600">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Signature Preview</span>
                <code>{protocol.toLowerCase()} dport &#123; {port} &#125; ip saddr {source} ip daddr {destination}</code>
              </div>
            </div>
          )}

          {/* STEP 3: VERDICT & COMMIT */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Policy Verdict (Action)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ALLOW', 'BLOCK', 'REJECT'] as ActionType[]).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setAction(act)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all ${
                        action === act
                          ? act === 'ALLOW'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : act === 'BLOCK'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Rule Evaluation Priority
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Lower numbers evaluate first before default chain drop policies.
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Enable Immediately</span>
                  <span className="text-[11px] text-slate-500">Inject into active netfilter chains upon saving</span>
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

              {/* Summary Card */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1 text-slate-700 text-xs">
                <span className="font-bold text-blue-900 block text-[11px] uppercase tracking-wide">
                  Policy Summary
                </span>
                <p><strong>Name:</strong> {name}</p>
                <p><strong>Verdict:</strong> {action} {direction} {protocol} (Port {port})</p>
                <p><strong>Targets:</strong> {source} → {destination}</p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={closeCreateRuleModal}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 active:bg-blue-800 shadow-xs transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 active:bg-blue-800 shadow-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{editingRule ? 'Save Changes' : 'Commit Firewall Rule'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
