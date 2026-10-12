import React, { useState } from 'react';
import { X, Shield, Plus, AlertCircle } from 'lucide-react';
import { useFirewall } from '../../hooks/useFirewall';
import { ApplicationInfo, AppPolicyStatus } from '../../types/firewall';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (app: Partial<ApplicationInfo>) => void;
}

export const AddApplicationModal: React.FC<AddApplicationModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [executablePath, setExecutablePath] = useState('');
  const [category, setCategory] = useState<'Browser' | 'Development' | 'System' | 'Communication' | 'Background Service'>('Development');
  const [status, setStatus] = useState<AppPolicyStatus>('ALLOWED');
  const [description, setDescription] = useState('');
  const [signatureVerified, setSignatureVerified] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !executablePath.trim()) return;

    onAdd({
      name: name.trim(),
      executablePath: executablePath.trim(),
      category,
      status,
      description: description.trim() || 'Custom registered application profile',
      signatureVerified,
      activeConnections: 0,
      downloadBytes: '0 KB',
      uploadBytes: '0 KB',
      lastActive: 'Just registered',
    });

    onClose();
    setName('');
    setExecutablePath('');
    setDescription('');
  };

  const handlePickPreset = (presetName: string, path: string, cat: any) => {
    setName(presetName);
    setExecutablePath(path);
    setCategory(cat);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Register Application Policy
            </h3>
            <p className="text-xs text-slate-500">
              Define per-executable network enforcement and firewall policy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Development preview banner */}
        <div className="px-6 py-2 bg-blue-50/70 border-b border-blue-100/60 flex items-center justify-between text-[11px] text-blue-800">
          <span className="font-semibold">Development Preview</span>
          <span className="text-[10px] text-blue-600">eBPF / cgroup binary registration</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Quick Presets */}
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
              Quick Executable Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handlePickPreset('Spotify Desktop', '/usr/bin/spotify', 'Communication')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
              >
                + Spotify
              </button>
              <button
                type="button"
                onClick={() => handlePickPreset('Postman API Client', '/opt/postman/postman', 'Development')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
              >
                + Postman
              </button>
              <button
                type="button"
                onClick={() => handlePickPreset('Slack Desktop', '/usr/bin/slack', 'Communication')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
              >
                + Slack
              </button>
              <button
                type="button"
                onClick={() => handlePickPreset('Redis Server', '/usr/bin/redis-server', 'Background Service')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
              >
                + Redis
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Application Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Postman API Client"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Executable Filesystem Path *
            </label>
            <input
              type="text"
              required
              value={executablePath}
              onChange={(e) => setExecutablePath(e.target.value)}
              placeholder="e.g. /opt/postman/postman or /usr/bin/binary"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="Browser">Browser</option>
                <option value="Development">Development</option>
                <option value="Communication">Communication</option>
                <option value="System">System</option>
                <option value="Background Service">Background Service</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Initial Policy Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="ALLOWED">ALLOWED</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="ASK">ASK (Prompt)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Description / Policy Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of application network privileges..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="sigCheck"
              checked={signatureVerified}
              onChange={(e) => setSignatureVerified(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="sigCheck" className="text-slate-600 cursor-pointer text-xs select-none">
              Verify code signature via local system package database
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Application</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
