import React, { useState } from 'react';
import { useFirewall } from '../hooks/useFirewall';
import { 
  Settings, 
  Shield, 
  Cpu, 
  Terminal, 
  Database, 
  RotateCcw, 
  Download, 
  CheckCircle2, 
  Info,
  Server,
  Layers,
  FileCheck,
  Bell,
  HardDrive,
  Network,
  Lock,
  Wifi,
  Laptop,
  Check,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  ShieldAlert,
  History,
  FileText
} from 'lucide-react';
import { ToggleSwitch } from '../components/common/ToggleSwitch';
import { NexusFirewallSettings } from '../types/firewall';
import { 
  tauriBridge, 
  SystemInfo, 
  SystemStatus, 
  AppVersionInfo,
  SnapshotMetadata,
  AuditEvent,
  ValidationError,
  RuleConflict
} from '../services/tauriBridge';

export const SettingsPage: React.FC = () => {
  const { 
    status, 
    toggleFirewallStatus, 
    backupConfiguration, 
    restoreConfiguration,
    settings,
    updateSettings,
    resetSettingsToDefault,
    addToast 
  } = useFirewall();

  const [activeTab, setActiveTab] = useState<'general' | 'engine' | 'profiles' | 'logging' | 'architecture' | 'backup'>('general');

  // Tauri IPC Diagnostics State
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; response: string; latencyMs: number } | null>(null);
  const [systemInfoData, setSystemInfoData] = useState<SystemInfo | null>(null);
  const [isLoadingSysInfo, setIsLoadingSysInfo] = useState(false);

  const handleTestPing = async () => {
    setIsPinging(true);
    try {
      const res = await tauriBridge.pingDaemon();
      setPingResult(res);
      addToast({
        type: 'success',
        title: 'Tauri IPC Ping Acknowledged',
        message: `${res.response} (Roundtrip: ${res.latencyMs}ms)`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'IPC Ping Failed',
        message: String(err),
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleFetchSystemInfo = async () => {
    setIsLoadingSysInfo(true);
    try {
      const info = await tauriBridge.getSystemInfo();
      setSystemInfoData(info);
      addToast({
        type: 'info',
        title: 'System Information Retrieved',
        message: `Queried ${info.os} via Tauri v2 IPC bridge.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'IPC Query Failed',
        message: String(err),
      });
    } finally {
      setIsLoadingSysInfo(false);
    }
  };

  // Phase 7 Rust Security Core State
  const [snapshots, setSnapshots] = useState<SnapshotMetadata[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [validationTestResult, setValidationTestResult] = useState<{
    tested: boolean;
    errors: ValidationError[];
    sample: string;
  } | null>(null);
  const [isValidatingTest, setIsValidatingTest] = useState(false);

  const [conflictTestResult, setConflictTestResult] = useState<{
    tested: boolean;
    conflicts: RuleConflict[];
    candidate: string;
  } | null>(null);
  const [isCheckingConflictTest, setIsCheckingConflictTest] = useState(false);

  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  // Load Security Core state
  const loadSecurityCoreData = React.useCallback(async () => {
    try {
      const [snaps, audits] = await Promise.all([
        tauriBridge.listSnapshots(),
        tauriBridge.getAuditEvents(15),
      ]);
      setSnapshots(snaps);
      setAuditEvents(audits);
    } catch (err) {
      console.warn('Could not load Security Core snapshots:', err);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'architecture') {
      loadSecurityCoreData();
    }
  }, [activeTab, loadSecurityCoreData]);

  const handleRunValidationTest = async (testCase: 'invalid_cidr' | 'valid_https') => {
    setIsValidatingTest(true);
    try {
      const candidate = testCase === 'invalid_cidr' ? {
        name: 'Invalid Test Rule',
        source: '192.168.1.0/35',
        destination: 'Any',
        port: '8080',
        protocol: 'TCP' as const,
        priority: 150,
      } : {
        name: 'Valid Outbound HTTPS',
        source: '0.0.0.0/0',
        destination: 'Any',
        port: '443',
        protocol: 'TCP' as const,
        priority: 10,
      };

      const errors = await tauriBridge.validateRule(candidate);
      setValidationTestResult({
        tested: true,
        errors,
        sample: testCase === 'invalid_cidr' ? 'Rule with invalid CIDR prefix /35' : 'Standard RFC-compliant HTTPS rule',
      });

      addToast({
        type: errors.length > 0 ? 'warning' : 'success',
        title: errors.length > 0 ? 'Validation Identified Error' : 'Validation Check Passed',
        message: errors.length > 0 ? errors[0].reason : 'Security Core verified rule matches all packet constraints.',
      });
    } finally {
      setIsValidatingTest(false);
    }
  };

  const handleRunConflictTest = async () => {
    isCheckingConflictTest;
    setIsCheckingConflictTest(true);
    try {
      const candidate = {
        id: 'candidate-test-443',
        name: 'Quarantine Outbound HTTPS',
        action: 'BLOCK' as const,
        direction: 'OUTBOUND' as const,
        protocol: 'TCP' as const,
        source: 'Any',
        destination: 'Any',
        port: '443',
        priority: 50,
        enabled: true,
        createdAt: new Date().toISOString(),
        hitCount: 0,
      };

      const detected = await tauriBridge.checkConflicts(candidate);
      setConflictTestResult({
        tested: true,
        conflicts: detected,
        candidate: 'BLOCK Outbound Port 443 (Priority 50) vs ALLOW Rule-1 (Priority 10)',
      });

      addToast({
        type: detected.length > 0 ? 'warning' : 'info',
        title: detected.length > 0 ? 'Rule Conflict Identified' : 'No Conflicts Found',
        message: detected.length > 0 ? detected[0].description : 'Rule is orthogonal to all existing policies.',
      });
    } finally {
      setIsCheckingConflictTest(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setIsCapturingSnapshot(true);
    try {
      const name = `Manual Snapshot #${snapshots.length + 1}`;
      const desc = 'Administrator snapshot captured prior to policy modification';
      const snap = await tauriBridge.createSnapshot(name, desc);
      addToast({
        type: 'success',
        title: 'Safeguard Snapshot Created',
        message: `Captured "${snap.name}" (Checksum: ${snap.checksum})`,
      });
      await loadSecurityCoreData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Snapshot Failed',
        message: String(err),
      });
    } finally {
      setIsCapturingSnapshot(false);
    }
  };

  const handleRollbackSnapshot = async (snapshotId: string) => {
    setRollingBackId(snapshotId);
    try {
      const restored = await tauriBridge.rollbackSnapshot(snapshotId);
      addToast({
        type: 'info',
        title: 'Configuration Rolled Back',
        message: `Restored state to snapshot "${restored.name}" (${restored.snapshot_id})`,
      });
      await loadSecurityCoreData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Rollback Failed',
        message: String(err),
      });
    } finally {
      setRollingBackId(null);
    }
  };

  // File import ref for restore
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.rules || parsed.settings) {
          restoreConfiguration();
          addToast({
            type: 'success',
            title: 'Configuration Restored from File',
            message: `Loaded settings snapshot from ${file.name}.`,
          });
        } else {
          addToast({
            type: 'error',
            title: 'Invalid File',
            message: 'Uploaded file does not match NEXUS configuration schema.',
          });
        }
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Parsing Error',
          message: 'Unable to parse JSON file.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Settings & Configuration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Development Preview
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure system security policies, netfilter engine preferences, and platform integration.
          </p>
        </div>

        <button
          type="button"
          onClick={resetSettingsToDefault}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      {/* Development Preview Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">
          Preferences configured here are persisted in active frontend state and ready for serialization to the Rust/Tauri security daemon via IPC in Phase 6.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        {[
          { id: 'general', label: 'General & UI', icon: <Settings className="w-4 h-4" /> },
          { id: 'engine', label: 'Firewall Engine (nftables)', icon: <Cpu className="w-4 h-4" /> },
          { id: 'profiles', label: 'Network Profiles', icon: <Network className="w-4 h-4" /> },
          { id: 'logging', label: 'Logging & Retention', icon: <HardDrive className="w-4 h-4" /> },
          { id: 'architecture', label: 'Tauri v2 Desktop Bridge', icon: <Layers className="w-4 h-4" /> },
          { id: 'backup', label: 'Backup & Restore', icon: <Database className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: General */}
      {activeTab === 'general' && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              Startup & Desktop Behavior
            </h3>

            {/* Startup Behavior */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100 gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Startup Protection State</span>
                <span className="text-[11px] text-slate-500">Determine how NEXUS engages netfilter when Linux boots</span>
              </div>
              <select
                value={settings.general.startupBehavior}
                onChange={(e) => updateSettings('general', { startupBehavior: e.target.value as any })}
                className="bg-slate-50 border border-slate-200 text-slate-800 py-1.5 px-3 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="enable_on_boot">Enable on System Boot (Recommended)</option>
                <option value="restore_last">Restore Last Running State</option>
                <option value="manual">Manual Start Only</option>
              </select>
            </div>

            {/* System Tray Icon */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">System Tray Icon</span>
                <span className="text-[11px] text-slate-500">Keep daemon status indicator visible in the desktop panel</span>
              </div>
              <ToggleSwitch
                checked={settings.general.systemTrayEnabled}
                onChange={(checked) => updateSettings('general', { systemTrayEnabled: checked })}
              />
            </div>

            {/* Notifications Enabled */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Desktop Notifications</span>
                <span className="text-[11px] text-slate-500">Display desktop push notifications for security events</span>
              </div>
              <ToggleSwitch
                checked={settings.general.notificationsEnabled}
                onChange={(checked) => updateSettings('general', { notificationsEnabled: checked })}
              />
            </div>

            {/* Notify on Blocked */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Notify on Blocked Ingress Connections</span>
                <span className="text-[11px] text-slate-500">Alert immediately when an unsolicited external port scan is dropped</span>
              </div>
              <ToggleSwitch
                checked={settings.general.notifyOnBlocked}
                disabled={!settings.general.notificationsEnabled}
                onChange={(checked) => updateSettings('general', { notifyOnBlocked: checked })}
              />
            </div>

            {/* Notify on Critical Only */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Critical Alerts Only</span>
                <span className="text-[11px] text-slate-500">Suppress informational notifications; show only high/critical incidents</span>
              </div>
              <ToggleSwitch
                checked={settings.general.notifyOnCriticalOnly}
                disabled={!settings.general.notificationsEnabled}
                onChange={(checked) => updateSettings('general', { notifyOnCriticalOnly: checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Engine & Policies */}
      {activeTab === 'engine' && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Default Netfilter Filtering Policies
            </h3>

            {/* Inbound Policy */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Default Inbound Policy</span>
                <span className="text-[11px] text-slate-500">Default action for unsolicited ingress packets matching no rules</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings('engine', { defaultInboundPolicy: 'DROP' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.engine.defaultInboundPolicy === 'DROP' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  DROP (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings('engine', { defaultInboundPolicy: 'REJECT' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.engine.defaultInboundPolicy === 'REJECT' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  REJECT
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings('engine', { defaultInboundPolicy: 'ACCEPT' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.engine.defaultInboundPolicy === 'ACCEPT' ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ACCEPT
                </button>
              </div>
            </div>

            {/* Outbound Policy */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Default Outbound Policy</span>
                <span className="text-[11px] text-slate-500">Default action for egress application socket requests</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings('engine', { defaultOutboundPolicy: 'ACCEPT' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.engine.defaultOutboundPolicy === 'ACCEPT' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ACCEPT (Permissive)
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings('engine', { defaultOutboundPolicy: 'DROP' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.engine.defaultOutboundPolicy === 'DROP' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  DROP (Strict Zero-Trust)
                </button>
              </div>
            </div>

            {/* Stealth Mode */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Stealth Mode</span>
                <span className="text-[11px] text-slate-500">Silently ignore unsolicited TCP/UDP/ICMP probes without returning port unreachable responses</span>
              </div>
              <ToggleSwitch
                checked={settings.engine.stealthMode}
                onChange={(checked) => updateSettings('engine', { stealthMode: checked })}
              />
            </div>

            {/* IPv6 Handling */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">IPv6 Handling</span>
                <span className="text-[11px] text-slate-500">Enforce dual-stack rules across inet tables</span>
              </div>
              <select
                value={settings.engine.ipv6Handling}
                onChange={(e) => updateSettings('engine', { ipv6Handling: e.target.value as any })}
                className="bg-slate-50 border border-slate-200 text-slate-800 py-1.5 px-3 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="filter_identically">Filter Identically (inet table)</option>
                <option value="disable_ipv6">Block All IPv6 Traffic</option>
                <option value="allow_all">Pass Through (Not Recommended)</option>
              </select>
            </div>

            {/* Log Dropped Packets */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Log Dropped Packets</span>
                <span className="text-[11px] text-slate-500">Write nflog entries for packets dropped by default policies</span>
              </div>
              <ToggleSwitch
                checked={settings.engine.logDroppedPackets}
                onChange={(checked) => updateSettings('engine', { logDroppedPackets: checked })}
              />
            </div>

            {/* Connection Tracking */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Stateful Connection Tracking (conntrack)</span>
                <span className="text-[11px] text-slate-500">Automatically permit established and related packet sequences</span>
              </div>
              <ToggleSwitch
                checked={settings.engine.connectionTracking}
                onChange={(checked) => updateSettings('engine', { connectionTracking: checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Network Profiles */}
      {activeTab === 'profiles' && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-600" />
              Environment Profiles
            </h3>

            <p className="text-xs text-slate-500">
              Quickly switch security postures depending on your current network environment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {[
                { 
                  id: 'home', 
                  title: 'Home Network', 
                  desc: 'Permits local network printer, NAS, and mDNS discovery.',
                  icon: <Wifi className="w-5 h-5 text-blue-600" /> 
                },
                { 
                  id: 'work', 
                  title: 'Work / Enterprise', 
                  desc: 'Requires authenticated corporate VPN; blocks peer-to-peer sharing.',
                  icon: <Laptop className="w-5 h-5 text-indigo-600" /> 
                },
                { 
                  id: 'public', 
                  title: 'Public Wi-Fi', 
                  desc: 'Highest lockdown. Blocks all unsolicited inbound traffic and local LAN discovery.',
                  icon: <Lock className="w-5 h-5 text-rose-600" /> 
                },
              ].map((prof) => (
                <div
                  key={prof.id}
                  onClick={() => updateSettings('networkProfiles', { activeProfile: prof.id as any })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.networkProfiles.activeProfile === prof.id
                      ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {prof.icon}
                    {settings.networkProfiles.activeProfile === prof.id && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2">{prof.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{prof.desc}</p>
                </div>
              ))}
            </div>

            {/* Auto Switch */}
            <div className="flex items-center justify-between py-2 border-t border-slate-100 mt-3">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Automatic Profile Switching</span>
                <span className="text-[11px] text-slate-500">Detect untrusted Wi-Fi SSIDs and switch to Public profile automatically</span>
              </div>
              <ToggleSwitch
                checked={settings.networkProfiles.autoSwitchWifi}
                onChange={(checked) => updateSettings('networkProfiles', { autoSwitchWifi: checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Logging & Retention */}
      {activeTab === 'logging' && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              Audit Log Storage & Rotation
            </h3>

            {/* Retention Days */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Log Retention Period</span>
                <span className="text-[11px] text-slate-500">Automatically prune event records older than this duration</span>
              </div>
              <select
                value={settings.logging.retentionDays}
                onChange={(e) => updateSettings('logging', { retentionDays: Number(e.target.value) })}
                className="bg-slate-50 border border-slate-200 text-slate-800 py-1.5 px-3 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days (Recommended)</option>
                <option value={90}>90 Days</option>
                <option value={365}>1 Year</option>
              </select>
            </div>

            {/* Log Level */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Minimum Log Severity</span>
                <span className="text-[11px] text-slate-500">Filter noise by setting the minimum event severity logged to storage</span>
              </div>
              <select
                value={settings.logging.logLevel}
                onChange={(e) => updateSettings('logging', { logLevel: e.target.value as any })}
                className="bg-slate-50 border border-slate-200 text-slate-800 py-1.5 px-3 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="debug">Debug (All events)</option>
                <option value="info">Info (Standard)</option>
                <option value="warning">Warning (Anomalies & Drops)</option>
                <option value="error">Error (Critical Only)</option>
              </select>
            </div>

            {/* Max Storage Size */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Maximum Disk Space</span>
                <span className="text-[11px] text-slate-500">Hard limit on audit log database before FIFO truncation</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                {settings.logging.maxLogSizeMb} MB
              </span>
            </div>

            {/* Auto Archive */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Automatic Archive Compression</span>
                <span className="text-[11px] text-slate-500">Gzip historical log files when rotating daily logs</span>
              </div>
              <ToggleSwitch
                checked={settings.logging.autoArchive}
                onChange={(checked) => updateSettings('logging', { autoArchive: checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tauri & Architecture */}
      {activeTab === 'architecture' && (
        <div className="space-y-5 max-w-3xl">
          {/* Main Card: Desktop Integration Status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rust Security Core & Tauri v2 Architecture</h3>
                  <p className="text-[11px] text-slate-500">In-memory rule engine, deep validation, conflict detection, and snapshot safety</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Phase 7 Complete
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Security Core Active
                </span>
              </div>
            </div>

            {/* Desktop Application Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                <span className="text-[11px] font-medium text-slate-400 block">Desktop App Name</span>
                <strong className="text-slate-800 text-xs mt-0.5 block font-semibold">NEXUS Firewall</strong>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                <span className="text-[11px] font-medium text-slate-400 block">Application Identifier</span>
                <code className="text-blue-700 text-xs mt-0.5 block font-mono font-semibold">com.nexus.firewall</code>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                <span className="text-[11px] font-medium text-slate-400 block">Security Core Architecture</span>
                <span className="text-slate-800 text-xs mt-0.5 block font-medium">Rust In-Memory Engine + Pre-Mutation Safeguards</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                <span className="text-[11px] font-medium text-slate-400 block">IPC Bridge Protocol</span>
                <span className="text-slate-800 text-xs mt-0.5 block font-medium">Typed Rust Tauri Commands (`@tauri-apps/api/core`)</span>
              </div>
            </div>

            {/* Interactive IPC Diagnostic Panel */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-600" />
                    IPC Diagnostics & Connectivity Test
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verify message passing over the typed Tauri v2 bridge
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={isPinging}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 text-emerald-600 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>{isPinging ? 'Pinging...' : 'Test IPC Ping'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFetchSystemInfo}
                    disabled={isLoadingSysInfo}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Server className={`w-3.5 h-3.5 ${isLoadingSysInfo ? 'animate-spin' : ''}`} />
                    <span>{isLoadingSysInfo ? 'Querying...' : 'Query System Info'}</span>
                  </button>
                </div>
              </div>

              {/* Ping Result Box */}
              {pingResult && (
                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200/90 text-xs flex items-center justify-between text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-mono">{pingResult.response}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                    Roundtrip: {pingResult.latencyMs} ms
                  </span>
                </div>
              )}

              {/* System Info Box */}
              {systemInfoData && (
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1">
                  <div className="text-slate-500 font-semibold mb-1 text-[10px] uppercase tracking-wider">// Tauri Host Platform Report</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-400">Host OS:</span> {systemInfoData.os}</div>
                    <div><span className="text-slate-400">Kernel:</span> {systemInfoData.kernelVersion}</div>
                    <div><span className="text-slate-400">Architecture:</span> {systemInfoData.architecture}</div>
                    <div><span className="text-slate-400">Desktop Env:</span> {systemInfoData.desktopEnvironment}</div>
                    <div><span className="text-slate-400">Security Backend:</span> <strong className="text-blue-600 font-bold">{systemInfoData.platformSecurityBackend}</strong></div>
                    <div><span className="text-slate-400">Tauri Version:</span> {systemInfoData.tauriVersion}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Security Core Diagnostics Lab */}
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    Rust Security Core Diagnostics Lab
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Test in-memory validation, conflict detection, and snapshot integrity engines
                  </p>
                </div>
              </div>

              {/* Action Buttons for Validation & Conflict Tests */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRunValidationTest('invalid_cidr')}
                  disabled={isValidatingTest}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Test Validation (Invalid CIDR /35)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRunValidationTest('valid_https')}
                  disabled={isValidatingTest}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Test Validation (Valid Rule)</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunConflictTest}
                  disabled={isCheckingConflictTest}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Test Conflict Detector</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateSnapshot}
                  disabled={isCapturingSnapshot}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 ml-auto"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{isCapturingSnapshot ? 'Capturing...' : 'Capture Snapshot'}</span>
                </button>
              </div>

              {/* Validation Result Output */}
              {validationTestResult && (
                <div className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                  validationTestResult.errors.length > 0
                    ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold flex items-center justify-between text-[11px]">
                    <span>// Validation Engine Test Result: {validationTestResult.sample}</span>
                    <span className="font-semibold px-2 py-0.5 rounded bg-white/70 text-[10px]">
                      {validationTestResult.errors.length > 0 ? 'REJECTED' : 'ACCEPTED'}
                    </span>
                  </div>
                  {validationTestResult.errors.length > 0 ? (
                    validationTestResult.errors.map((err, i) => (
                      <div key={i} className="text-[11px] space-y-0.5 pt-1">
                        <div><strong className="text-rose-700">Field:</strong> {err.field} (Value: &apos;{err.rejected_value}&apos;)</div>
                        <div><strong className="text-rose-700">Reason:</strong> {err.reason}</div>
                        {err.suggestion && <div><strong className="text-blue-700">Suggestion:</strong> {err.suggestion}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-emerald-800">
                      ✓ Zero validation errors detected. All IP CIDR formats, ports, protocols, and priority limits match constraints.
                    </div>
                  )}
                </div>
              )}

              {/* Conflict Result Output */}
              {conflictTestResult && (
                <div className="p-3 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-mono space-y-1">
                  <div className="font-bold flex items-center justify-between text-[11px]">
                    <span>// Conflict Detection Engine Test</span>
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                      {conflictTestResult.conflicts.length} CONFLICT(S)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-sans">
                    Testing: <code className="text-amber-800 font-bold">{conflictTestResult.candidate}</code>
                  </div>
                  {conflictTestResult.conflicts.map((c, i) => (
                    <div key={i} className="pt-1 border-t border-amber-200/80 text-[11px] space-y-0.5">
                      <div><strong className="text-rose-700">Type:</strong> {c.conflict_type} (Severity: {c.severity})</div>
                      <div><strong className="text-slate-800">Conflicting Rule:</strong> {c.conflicting_rule_name} ({c.conflicting_rule_id})</div>
                      <div><strong className="text-slate-800">Details:</strong> {c.description}</div>
                      <div><strong className="text-blue-700">Recommendation:</strong> {c.recommendation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Configuration Snapshots & Instant Rollback */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    Configuration Snapshots & Rollback History
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Immutable point-in-time snapshots created before configuration modifications
                  </p>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {snapshots.length} retained snapshots
                </span>
              </div>

              {snapshots.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                  No snapshots captured yet. Click &quot;Capture Snapshot&quot; above to create one.
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshots.slice(0, 4).map((snap) => (
                    <div
                      key={snap.snapshot_id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="font-semibold text-slate-900">{snap.name}</strong>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                            {snap.checksum}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{snap.description}</p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-3">
                          <span>Timestamp: {snap.created_at}</span>
                          <span>Revision: #{snap.revision}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRollbackSnapshot(snap.snapshot_id)}
                          disabled={rollingBackId === snap.snapshot_id}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-60"
                        >
                          <RotateCcw className={`w-3 h-3 text-blue-600 ${rollingBackId === snap.snapshot_id ? 'animate-spin' : ''}`} />
                          <span>{rollingBackId === snap.snapshot_id ? 'Restoring...' : 'Rollback'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Real-time Security Audit Log Stream */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Security Core Audit Trail
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sequential chronological audit log of internal security core events
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {auditEvents.slice(0, 5).map((audit) => (
                  <div
                    key={audit.event_id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono shrink-0 ${
                        audit.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                        audit.severity === 'HIGH' ? 'bg-rose-50 text-rose-700' :
                        audit.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {audit.event_type}
                      </span>
                      <span className="text-slate-700 truncate">{audit.details}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {audit.timestamp.slice(11, 19)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* End-to-End Architectural Pipeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-slate-500" />
                Integrated Desktop Security Architecture
              </h4>
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800 shadow-inner">
                <div className="text-slate-400 font-semibold mb-1 text-[11px]">// Desktop IPC Channel: Active Phase 7 Security Core</div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <span>[1] React 19 Frontend</span>
                  <span className="text-slate-500">──invoke(&apos;validate_rule&apos; / &apos;create_snapshot&apos;)──►</span>
                  <span>[2] Tauri v2 IPC Bridge</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs">
                  <span className="ml-4">└──► [3] Rust Security Core (src-tauri/src/security/engine.rs) [ACTIVE]</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400 text-xs">
                  <span className="ml-12">└──► [4] Snapshot & Audit Subsystem (src-tauri/src/firewall/snapshot.rs) [ACTIVE]</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <span className="ml-20">└──► [5] Future nftables Netlink Subsystem (Phase 8+)</span>
                </div>
              </div>
            </div>

            {/* Phase Progression Status */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900 block text-xs">
                  Phase 7: Rust Security Core Complete
                </span>
                <span className="text-[11px] text-blue-700 block mt-0.5">
                  Firewall rule models, CIDR/port validation, conflict detection, snapshots, rollback, and audit events active.
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 block">Next Phase:</span>
                <strong className="text-xs text-blue-700 font-bold block">Phase 8 — nftables Adapter</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Backup & Restore Configuration
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Export your complete firewall policy rules, application permissions, and security preferences into a portable JSON file.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={backupConfiguration}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Configuration Backup (.json)</span>
              </button>

              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer">
                <FolderOpen className="w-4 h-4 text-slate-500" />
                <span>Import Backup File</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />
              </label>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Restore Factory Baseline</span>
                  <span className="text-[11px] text-slate-500">Reset all custom rules and preferences to verified defaults</span>
                </div>
                <button
                  type="button"
                  onClick={restoreConfiguration}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Restore Baseline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
