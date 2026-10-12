import React, { useState, useRef } from 'react';
import { useFirewall } from '../../hooks/useFirewall';
import { RuleService } from '../../services/ruleService';
import { FirewallRule } from '../../types/firewall';
import { 
  X, 
  Upload, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Copy, 
  Download, 
  Layers, 
  Plus
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

const SAMPLE_RULE_JSON = JSON.stringify({
  schemaVersion: 1,
  product: "NEXUS Firewall",
  exportedAt: new Date().toISOString(),
  rulesCount: 3,
  rules: [
    {
      id: "rule-sample-dev-api",
      name: "Allow Developer REST API",
      action: "ALLOW",
      direction: "INBOUND",
      protocol: "TCP",
      source: "192.168.1.0/24",
      destination: "Any",
      port: "8080",
      priority: 25,
      logging: true,
      enabled: true,
      description: "Local development REST endpoint access for microservices",
      application: "Node.js Service"
    },
    {
      id: "rule-sample-redis",
      name: "Block External Redis Port",
      action: "BLOCK",
      direction: "INBOUND",
      protocol: "TCP",
      source: "Any",
      destination: "Any",
      port: "6379",
      priority: 30,
      logging: true,
      enabled: true,
      description: "Prevent non-localhost exposure of in-memory cache",
      application: "Redis Server"
    },
    {
      id: "rule-sample-dns-udp",
      name: "Allow Encrypted DNS (UDP 853)",
      action: "ALLOW",
      direction: "OUTBOUND",
      protocol: "UDP",
      source: "Any",
      destination: "1.1.1.1",
      port: "853",
      priority: 35,
      logging: false,
      enabled: true,
      description: "DNS-over-QUIC / DNS-over-TLS query channel",
      application: "System Resolver"
    }
  ]
}, null, 2);

export const ImportRulesModal: React.FC = () => {
  const { isImportModalOpen, closeImportModal, importRulesList, rules: existingRules, addToast } = useFirewall();
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    rulesToImport: FirewallRule[];
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isImportModalOpen) return null;

  const handleValidateContent = (content: string, name?: string) => {
    setJsonText(content);
    if (name) setFileName(name);

    if (!content.trim()) {
      setValidationResult(null);
      return;
    }

    const res = RuleService.parseAndValidateImport(content, existingRules);
    if (res.isValid && res.data) {
      setValidationResult({
        isValid: true,
        errors: [],
        rulesToImport: res.data.rules,
      });
    } else {
      setValidationResult({
        isValid: false,
        errors: res.errors.length > 0 ? res.errors : ['Malformed or invalid rule schema'],
        rulesToImport: [],
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleValidateContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      addToast({
        type: 'error',
        title: 'Invalid File',
        message: 'Please provide a .json file containing NEXUS Firewall rules.',
      });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleValidateContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    handleValidateContent(SAMPLE_RULE_JSON, 'sample-nexus-rules.json');
    setActiveTab('paste');
  };

  const handleExecuteImport = () => {
    if (!validationResult || !validationResult.isValid || validationResult.rulesToImport.length === 0) {
      return;
    }

    importRulesList(validationResult.rulesToImport);
    closeImportModal();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="import-modal-title" className="text-base font-bold text-slate-900">
                  Import Firewall Rules
                </h3>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                  Development Preview
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Load rules from a verified JSON export package into your local rule table.
              </p>
            </div>
          </div>

          <button
            onClick={closeImportModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between bg-white text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Upload JSON File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'paste'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Paste JSON
            </button>
          </div>

          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-[11px] hover:underline"
          >
            <FileCode className="w-3.5 h-3.5" />
            Load Sample Preset
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : fileName
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3 shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-800 text-sm">
                {fileName ? `Selected: ${fileName}` : 'Drop rule package JSON here or click to browse'}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Accepts valid NEXUS schema v1 export files
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 text-xs">
                JSON Package Content
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => handleValidateContent(e.target.value)}
                rows={8}
                placeholder="Paste { ... } JSON schema here..."
                className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
          )}

          {/* Validation Feedback */}
          {validationResult && (
            <div className="space-y-3 pt-2">
              {validationResult.isValid ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Schema Valid: {validationResult.rulesToImport.length} rule(s) ready to import</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-emerald-100/60 bg-white/70 rounded-lg p-2 border border-emerald-100">
                    {validationResult.rulesToImport.map((r, i) => (
                      <div key={i} className="py-1.5 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-slate-400 text-[10px]">#{r.priority}</span>
                          <span className="font-semibold text-slate-800 truncate">{r.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge type="action" value={r.action} size="sm" />
                          <span className="text-[10px] font-mono text-slate-500">{r.protocol}/{r.port}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Validation Failed ({validationResult.errors.length} issue{validationResult.errors.length > 1 ? 's' : ''})</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-700 max-h-32 overflow-y-auto">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={closeImportModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!validationResult || !validationResult.isValid || validationResult.rulesToImport.length === 0}
            onClick={handleExecuteImport}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-xs ${
              validationResult?.isValid
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed opacity-70'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Import {validationResult?.rulesToImport?.length || 0} Rule(s)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
