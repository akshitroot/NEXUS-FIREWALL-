import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  FirewallStatus, 
  FirewallRule, 
  NetworkConnection, 
  ApplicationInfo, 
  SecurityEvent, 
  Alert, 
  PageView,
  ActionType,
  DirectionType,
  ProtocolType,
  NexusFirewallSettings,
  AppPolicyStatus,
  DashboardUIState
} from '../types/firewall';
import { 
  initialFirewallStatus, 
  initialFirewallRules, 
  initialNetworkConnections, 
  initialApplications, 
  initialAlerts, 
  initialSecurityEvents,
  defaultNexusSettings
} from '../data/demo/firewallData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface FirewallContextType {
  status: FirewallStatus;
  toggleFirewallStatus: () => void;
  rules: FirewallRule[];
  addRule: (rule: Omit<FirewallRule, 'id' | 'createdAt' | 'hitCount'>) => void;
  updateRule: (id: string, updates: Partial<FirewallRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  networkConnections: NetworkConnection[];
  isLiveFeedActive: boolean;
  toggleLiveFeed: () => void;
  clearConnections: () => void;
  applications: ApplicationInfo[];
  updateApplicationStatus: (id: string, status: AppPolicyStatus) => void;
  addApplication: (app: Partial<ApplicationInfo>) => void;
  deleteApplication: (id: string) => void;
  alerts: Alert[];
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  markAllAlertsAsRead: () => void;
  unreadAlertsCount: number;
  securityEvents: SecurityEvent[];
  clearLogs: () => void;
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dashboardState: DashboardUIState;
  setDashboardState: (state: DashboardUIState) => void;
  isCreateRuleModalOpen: boolean;
  openCreateRuleModal: () => void;
  closeCreateRuleModal: () => void;
  openRuleWizard: () => void;
  closeRuleWizard: () => void;
  editingRule: FirewallRule | null;
  openEditRuleModal: (rule: FirewallRule) => void;
  closeEditRuleModal: () => void;
  duplicateRule: (id: string) => void;
  enableRule: (id: string) => void;
  disableRule: (id: string) => void;
  viewingRule: FirewallRule | null;
  openRuleDetails: (rule: FirewallRule) => void;
  closeRuleDetails: () => void;
  deleteConfirmRule: FirewallRule | null;
  openDeleteConfirm: (rule: FirewallRule) => void;
  closeDeleteConfirm: () => void;
  disableConfirmRule: FirewallRule | null;
  openDisableConfirm: (rule: FirewallRule) => void;
  closeDisableConfirm: () => void;
  isImportModalOpen: boolean;
  openImportModal: () => void;
  closeImportModal: () => void;
  importRulesList: (importedRules: FirewallRule[]) => void;
  backupConfiguration: () => void;
  restoreConfiguration: () => void;
  settings: NexusFirewallSettings;
  updateSettings: <K extends keyof NexusFirewallSettings>(section: K, updates: Partial<NexusFirewallSettings[K]>) => void;
  resetSettingsToDefault: () => void;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  markAlertAsRead: (id: string) => void;
}

const FirewallContext = createContext<FirewallContextType | undefined>(undefined);

export const FirewallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<FirewallStatus>(initialFirewallStatus);
  const [rules, setRules] = useState<FirewallRule[]>(initialFirewallRules);
  const [networkConnections, setNetworkConnections] = useState<NetworkConnection[]>(initialNetworkConnections);
  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(true);
  const [applications, setApplications] = useState<ApplicationInfo[]>(initialApplications);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(initialSecurityEvents);
  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dashboardState, setDashboardState] = useState<DashboardUIState>('normal');
  const [isCreateRuleModalOpen, setIsCreateRuleModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [viewingRule, setViewingRule] = useState<FirewallRule | null>(null);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<FirewallRule | null>(null);
  const [disableConfirmRule, setDisableConfirmRule] = useState<FirewallRule | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<NexusFirewallSettings>(defaultNexusSettings);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Toggle master firewall protection
  const toggleFirewallStatus = useCallback(() => {
    setStatus(prev => {
      const nextActive = !prev.isActive;
      addToast({
        type: nextActive ? 'success' : 'warning',
        title: nextActive ? 'Firewall Protection Activated' : 'Firewall Protection Paused',
        message: nextActive 
          ? 'nftables filtering chains are actively inspecting network interfaces.' 
          : 'Warning: Unfiltered network traffic is now allowed.',
      });
      return {
        ...prev,
        isActive: nextActive,
        lastVerified: 'Just now',
      };
    });
  }, [addToast]);

  // Rule management
  const addRule = useCallback((newRuleData: Omit<FirewallRule, 'id' | 'createdAt' | 'hitCount'>) => {
    const id = `rule-${Date.now()}`;
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const rule: FirewallRule = {
      logging: false,
      updatedAt: timeStr,
      ...newRuleData,
      id,
      createdAt: timeStr,
      hitCount: 0,
    };

    setRules(prev => [rule, ...prev]);
    setStatus(prev => ({
      ...prev,
      activeRulesCount: prev.activeRulesCount + (rule.enabled ? 1 : 0),
      lastVerified: 'Just now',
    }));

    // Add security audit event
    const newEvent: SecurityEvent = {
      id: `evt-${Date.now()}`,
      timestamp: timeStr,
      type: 'Rule Created',
      severity: 'low',
      action: 'Modified',
      rule: rule.name,
      title: `Rule "${rule.name}" created`,
      description: `Added ${rule.direction} ${rule.action} rule for ${rule.protocol} port ${rule.port}`,
    };
    setSecurityEvents(prev => [newEvent, ...prev]);

    // Add alert
    const newAlert: Alert = {
      id: `alert-${Date.now()}`,
      timestamp: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      title: 'Rule created',
      description: rule.name,
      severity: 'low',
      status: 'unread',
      port: Number(rule.port) || undefined,
      category: 'config_change',
    };
    setAlerts(prev => [newAlert, ...prev]);

    addToast({
      type: 'success',
      title: 'Rule Created (Development Preview)',
      message: `Rule "${rule.name}" has been registered in the security policy table.`,
    });
  }, [addToast]);

  const updateRule = useCallback((id: string, updates: Partial<FirewallRule>) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: timeStr } : r));
    addToast({
      type: 'info',
      title: 'Rule Updated',
      message: 'Firewall rule specifications have been saved.',
    });
  }, [addToast]);

  const deleteRule = useCallback((id: string) => {
    const target = rules.find(r => r.id === id);
    setRules(prev => {
      const filtered = prev.filter(r => r.id !== id);
      setStatus(s => ({
        ...s,
        activeRulesCount: filtered.filter(r => r.enabled).length,
      }));
      return filtered;
    });
    setDeleteConfirmRule(null);
    addToast({
      type: 'warning',
      title: 'Rule Deleted',
      message: target ? `Rule "${target.name}" removed from policy list.` : 'Firewall rule removed.',
    });
  }, [rules, addToast]);

  const duplicateRule = useCallback((id: string) => {
    const target = rules.find(r => r.id === id);
    if (!target) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const highestPriority = rules.reduce((max, r) => Math.max(max, r.priority), 0);
    const nextPriority = highestPriority + 10;

    let newName = `${target.name} (Copy)`;
    let counter = 2;
    while (rules.some(r => r.name.toLowerCase() === newName.toLowerCase())) {
      newName = `${target.name} (Copy ${counter})`;
      counter++;
    }

    const duplicated: FirewallRule = {
      ...target,
      id: `rule-${Date.now()}`,
      name: newName,
      priority: nextPriority,
      enabled: false,
      createdAt: timeStr,
      updatedAt: timeStr,
      hitCount: 0,
    };

    setRules(prev => [duplicated, ...prev]);
    addToast({
      type: 'info',
      title: 'Rule Duplicated',
      message: `Created disabled copy "${duplicated.name}" with priority #${duplicated.priority}.`,
    });
  }, [rules, addToast]);

  const enableRule = useCallback((id: string) => {
    setRules(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, enabled: true } : r);
      setStatus(s => ({ ...s, activeRulesCount: updated.filter(r => r.enabled).length }));
      return updated;
    });
    const target = rules.find(r => r.id === id);
    addToast({
      type: 'success',
      title: 'Rule Enabled',
      message: target ? `Rule "${target.name}" is now active in development preview.` : 'Rule enabled.',
    });
  }, [rules, addToast]);

  const disableRule = useCallback((id: string) => {
    setRules(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, enabled: false } : r);
      setStatus(s => ({ ...s, activeRulesCount: updated.filter(r => r.enabled).length }));
      return updated;
    });
    setDisableConfirmRule(null);
    const target = rules.find(r => r.id === id);
    addToast({
      type: 'info',
      title: 'Rule Disabled',
      message: target ? `Rule "${target.name}" is now paused.` : 'Rule disabled.',
    });
  }, [rules, addToast]);

  const toggleRule = useCallback((id: string) => {
    const target = rules.find(r => r.id === id);
    if (!target) return;
    if (target.enabled) {
      setDisableConfirmRule(target);
    } else {
      enableRule(id);
    }
  }, [rules, enableRule]);

  const openRuleDetails = useCallback((rule: FirewallRule) => {
    setViewingRule(rule);
  }, []);

  const closeRuleDetails = useCallback(() => {
    setViewingRule(null);
  }, []);

  const openDeleteConfirm = useCallback((rule: FirewallRule) => {
    setDeleteConfirmRule(rule);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirmRule(null);
  }, []);

  const openDisableConfirm = useCallback((rule: FirewallRule) => {
    setDisableConfirmRule(rule);
  }, []);

  const closeDisableConfirm = useCallback(() => {
    setDisableConfirmRule(null);
  }, []);

  const openImportModal = useCallback(() => {
    setIsImportModalOpen(true);
  }, []);

  const closeImportModal = useCallback(() => {
    setIsImportModalOpen(false);
  }, []);

  const importRulesList = useCallback((importedRules: FirewallRule[]) => {
    setRules(prev => {
      const merged = [...importedRules, ...prev];
      setStatus(s => ({ ...s, activeRulesCount: merged.filter(r => r.enabled).length }));
      return merged;
    });
    setIsImportModalOpen(false);
    addToast({
      type: 'success',
      title: 'Rules Imported Successfully',
      message: `Added ${importedRules.length} validated rule(s) to the local policy list.`,
    });
  }, [addToast]);

  // Live network traffic simulation (clean frontend state, zero shell calls)
  const toggleLiveFeed = useCallback(() => {
    setIsLiveFeedActive(prev => {
      const next = !prev;
      addToast({
        type: 'info',
        title: next ? 'Live Feed Resumed' : 'Live Feed Paused',
        message: next ? 'Real-time connection monitoring is active.' : 'Connection list frozen for inspection.',
      });
      return next;
    });
  }, [addToast]);

  const clearConnections = useCallback(() => {
    setNetworkConnections([]);
    addToast({
      type: 'info',
      title: 'Connections Cleared',
      message: 'Network activity buffer has been reset.',
    });
  }, [addToast]);

  // Simulating periodic background traffic stream for a live, authentic dashboard feel
  useEffect(() => {
    if (!isLiveFeedActive || !status.isActive) return;

    const mockEndpoints = [
      { 
        app: 'Google Chrome', 
        appId: 'app-1', 
        proc: 'google-chrome', 
        path: '/usr/bin/google-chrome-stable', 
        icon: 'chrome' as const, 
        port: 443, 
        proto: 'TCP' as ProtocolType, 
        dst: '142.250.180.206', 
        host: 'google.com', 
        action: 'ALLOW' as ActionType, 
        ruleId: 'rule-1', 
        ruleName: 'Allow HTTPS' 
      },
      { 
        app: 'Visual Studio Code', 
        appId: 'app-5', 
        proc: 'code', 
        path: '/usr/share/code/code', 
        icon: 'code' as const, 
        port: 443, 
        proto: 'TCP' as ProtocolType, 
        dst: '20.198.118.150', 
        host: 'marketplace.visualstudio.com', 
        action: 'ALLOW' as ActionType, 
        ruleId: 'rule-1', 
        ruleName: 'Allow HTTPS' 
      },
      { 
        app: 'Discord Desktop', 
        appId: 'app-6', 
        proc: 'discord', 
        path: '/opt/discord/Discord', 
        icon: 'discord' as const, 
        port: 443, 
        proto: 'TCP' as ProtocolType, 
        dst: '162.159.129.232', 
        host: 'gateway.discord.gg', 
        action: 'ALLOW' as ActionType, 
        ruleId: 'rule-1', 
        ruleName: 'Allow HTTPS' 
      },
      { 
        app: 'System Core Services', 
        appId: 'app-2', 
        proc: 'systemd-resolved', 
        path: '/usr/lib/systemd/systemd-resolved', 
        icon: 'system' as const, 
        port: 53, 
        proto: 'UDP' as ProtocolType, 
        dst: '1.1.1.1', 
        host: 'one.one.one.one', 
        action: 'ALLOW' as ActionType, 
        ruleId: 'rule-3', 
        ruleName: 'Allow DNS' 
      },
      { 
        app: 'OpenSSH Server', 
        appId: 'app-4', 
        proc: 'sshd', 
        path: '/usr/sbin/sshd', 
        icon: 'ssh' as const, 
        port: 22, 
        proto: 'TCP' as ProtocolType, 
        dst: '198.51.100.12', 
        host: 'scanner-remote.net', 
        action: 'BLOCK' as ActionType, 
        ruleId: 'rule-6', 
        ruleName: 'Block SSH Inbound' 
      },
      { 
        app: 'Docker Daemon', 
        appId: 'app-7', 
        proc: 'dockerd', 
        path: '/usr/bin/dockerd', 
        icon: 'docker' as const, 
        port: 443, 
        proto: 'TCP' as ProtocolType, 
        dst: '185.199.108.154', 
        host: 'registry-1.docker.io', 
        action: 'ALLOW' as ActionType, 
        ruleId: 'rule-12', 
        ruleName: 'Allow Docker Bridge Traffic' 
      },
    ];

    const interval = setInterval(() => {
      const candidate = mockEndpoints[Math.floor(Math.random() * mockEndpoints.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const newConn: NetworkConnection = {
        id: `conn-${Date.now()}`,
        timestamp: timeStr,
        source: candidate.action === 'BLOCK' ? candidate.dst : '192.168.1.45',
        destination: candidate.action === 'BLOCK' ? '192.168.1.45' : candidate.dst,
        protocol: candidate.proto,
        port: candidate.port,
        direction: candidate.action === 'BLOCK' ? 'INBOUND' : 'OUTBOUND',
        action: candidate.action,
        application: candidate.app,
        appIcon: candidate.icon,
        applicationId: candidate.appId,
        processName: candidate.proc,
        processPath: candidate.path,
        hostname: candidate.host,
        matchedRuleId: candidate.ruleId,
        matchedRuleName: candidate.ruleName,
        severity: candidate.action === 'BLOCK' ? 'high' : 'info',
        pid: Math.floor(Math.random() * 20000) + 1000,
        bytesTransferred: candidate.action === 'BLOCK' ? 0 : Math.floor(Math.random() * 85000),
        state: candidate.action === 'ALLOW' ? 'ESTABLISHED' : 'CLOSED',
      };

      setNetworkConnections(prev => [newConn, ...prev.slice(0, 49)]);

      // Increment stats
      setStatus(prev => ({
        ...prev,
        totalEventsCount: prev.totalEventsCount + 1,
        allowedEventsCount: candidate.action === 'ALLOW' ? prev.allowedEventsCount + 1 : prev.allowedEventsCount,
        blockedEventsCount: candidate.action === 'BLOCK' ? prev.blockedEventsCount + 1 : prev.blockedEventsCount,
      }));
    }, 7000);

    return () => clearInterval(interval);
  }, [isLiveFeedActive, status.isActive]);

  // Application policy update
  const updateApplicationStatus = useCallback((id: string, newStatus: AppPolicyStatus) => {
    setApplications(prev => prev.map(app => {
      if (app.id === id) {
        addToast({
          type: newStatus === 'ALLOWED' ? 'success' : newStatus === 'BLOCKED' ? 'error' : 'warning',
          title: `Application Policy Set: ${app.name}`,
          message: `Network rule updated to ${newStatus}.`,
        });
        return { ...app, status: newStatus };
      }
      return app;
    }));
  }, [addToast]);

  const addApplication = useCallback((appData: Partial<ApplicationInfo>) => {
    const id = `app-${Date.now()}`;
    const newApp: ApplicationInfo = {
      id,
      name: appData.name || 'Unnamed Application',
      executablePath: appData.executablePath || '/usr/bin/unknown',
      icon: (appData.icon as any) || 'terminal',
      status: appData.status || 'ALLOWED',
      category: appData.category || 'Development',
      signatureVerified: appData.signatureVerified ?? true,
      activeConnections: 0,
      downloadBytes: '0 KB',
      uploadBytes: '0 KB',
      lastActive: 'Just registered',
      description: appData.description || 'Custom registered application profile',
      pid: Math.floor(Math.random() * 20000) + 1000,
      publisher: appData.publisher || 'User Defined Binary',
      associatedRuleIds: [],
    };

    setApplications(prev => [newApp, ...prev]);
    addToast({
      type: 'success',
      title: 'Application Registered',
      message: `Profile for "${newApp.name}" saved with ${newApp.status} policy.`,
    });
  }, [addToast]);

  const deleteApplication = useCallback((id: string) => {
    const target = applications.find(a => a.id === id);
    setApplications(prev => prev.filter(a => a.id !== id));
    addToast({
      type: 'info',
      title: 'Application Removed',
      message: target ? `Profile for "${target.name}" removed.` : 'Application profile removed.',
    });
  }, [applications, addToast]);

  // Alert management
  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
    addToast({
      type: 'info',
      title: 'Alert Acknowledged',
    });
  }, [addToast]);

  const resolveAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
    addToast({
      type: 'success',
      title: 'Alert Resolved',
    });
  }, [addToast]);

  const markAllAlertsAsRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, status: 'acknowledged' })));
    addToast({
      type: 'info',
      title: 'All Alerts Marked as Read',
    });
  }, [addToast]);

  const unreadAlertsCount = alerts.filter(a => a.status === 'unread').length;

  const clearLogs = useCallback(() => {
    setSecurityEvents([]);
    addToast({
      type: 'info',
      title: 'Security Audit Logs Cleared',
    });
  }, [addToast]);

  // Modals
  const openCreateRuleModal = useCallback(() => {
    setEditingRule(null);
    setIsCreateRuleModalOpen(true);
  }, []);

  const closeCreateRuleModal = useCallback(() => {
    setIsCreateRuleModalOpen(false);
    setEditingRule(null);
  }, []);

  const openEditRuleModal = useCallback((rule: FirewallRule) => {
    setEditingRule(rule);
    setIsCreateRuleModalOpen(true);
  }, []);

  const closeEditRuleModal = useCallback(() => {
    setEditingRule(null);
    setIsCreateRuleModalOpen(false);
  }, []);

  // Backup & Restore
  const backupConfiguration = useCallback(() => {
    const configSnapshot = {
      product: 'NEXUS Firewall',
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      status,
      rules,
      applications,
    };
    const blob = new Blob([JSON.stringify(configSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus-firewall-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Configuration Exported',
      message: 'Firewall rules and application policies saved to JSON file.',
    });
  }, [status, rules, applications, addToast]);

  const restoreConfiguration = useCallback(() => {
    // Reset to verified healthy baseline
    setRules(initialFirewallRules);
    setApplications(initialApplications);
    setStatus(initialFirewallStatus);
    setSettings(defaultNexusSettings);
    addToast({
      type: 'info',
      title: 'Configuration Restored',
      message: 'Restored default verified enterprise policy ruleset.',
    });
  }, [addToast]);

  const updateSettings = useCallback(<K extends keyof NexusFirewallSettings>(
    section: K, 
    updates: Partial<NexusFirewallSettings[K]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }));
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: `Configuration for [${String(section)}] updated.`,
    });
  }, [addToast]);

  const resetSettingsToDefault = useCallback(() => {
    setSettings(defaultNexusSettings);
    addToast({
      type: 'info',
      title: 'Settings Reset',
      message: 'All engine and interface preferences reset to factory defaults.',
    });
  }, [addToast]);

  const markAlertAsRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
  }, []);

  const openRuleWizard = useCallback(() => {
    setEditingRule(null);
    setIsCreateRuleModalOpen(true);
  }, []);

  const closeRuleWizard = useCallback(() => {
    setIsCreateRuleModalOpen(false);
    setEditingRule(null);
  }, []);

  return (
    <FirewallContext.Provider
      value={{
        status,
        toggleFirewallStatus,
        rules,
        addRule,
        updateRule,
        deleteRule,
        toggleRule,
        networkConnections,
        isLiveFeedActive,
        toggleLiveFeed,
        clearConnections,
        applications,
        updateApplicationStatus,
        addApplication,
        deleteApplication,
        alerts,
        acknowledgeAlert,
        resolveAlert,
        markAllAlertsAsRead,
        markAlertAsRead,
        unreadAlertsCount,
        securityEvents,
        clearLogs,
        activePage,
        setActivePage,
        searchQuery,
        setSearchQuery,
        dashboardState,
        setDashboardState,
        isCreateRuleModalOpen,
        openCreateRuleModal,
        closeCreateRuleModal,
        openRuleWizard,
        closeRuleWizard,
        editingRule,
        openEditRuleModal,
        closeEditRuleModal,
        duplicateRule,
        enableRule,
        disableRule,
        viewingRule,
        openRuleDetails,
        closeRuleDetails,
        deleteConfirmRule,
        openDeleteConfirm,
        closeDeleteConfirm,
        disableConfirmRule,
        openDisableConfirm,
        closeDisableConfirm,
        isImportModalOpen,
        openImportModal,
        closeImportModal,
        importRulesList,
        backupConfiguration,
        restoreConfiguration,
        settings,
        updateSettings,
        resetSettingsToDefault,
        toasts,
        dismissToast,
        addToast,
      }}
    >
      {children}
    </FirewallContext.Provider>
  );
};

export const useFirewall = () => {
  const context = useContext(FirewallContext);
  if (!context) {
    throw new Error('useFirewall must be used within a FirewallProvider');
  }
  return context;
};
