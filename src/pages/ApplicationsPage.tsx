import React, { useState, useMemo } from 'react';
import { useFirewall } from '../hooks/useFirewall';
import { 
  LayoutGrid, 
  List, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Folder, 
  ArrowDown, 
  ArrowUp, 
  Radio, 
  ShieldCheck, 
  Lock,
  Plus,
  HelpCircle,
  Shield,
  FileText,
  Filter,
  X,
  Layers,
  ArrowRight,
  MoreVertical,
  Check,
  ChevronRight
} from 'lucide-react';
import { AppIcon } from '../components/common/AppIcon';
import { AppPolicyStatus, ApplicationInfo, FirewallRule } from '../types/firewall';
import { ApplicationDetailsDrawer } from '../components/applications/ApplicationDetailsDrawer';
import { AddApplicationModal } from '../components/applications/AddApplicationModal';

export const ApplicationsPage: React.FC = () => {
  const { 
    applications, 
    updateApplicationStatus, 
    addApplication, 
    rules, 
    networkConnections, 
    setActivePage, 
    openRuleDetails,
    addToast 
  } = useFirewall();

  // Search and filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [policyFilter, setPolicyFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals & drawers
  const [selectedApp, setSelectedApp] = useState<ApplicationInfo | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Categories
  const categories = ['ALL', 'Browser', 'Development', 'Communication', 'System', 'Background Service'];

  // Summary Metrics calculated directly from demo data
  const summary = useMemo(() => {
    const total = applications.length;
    const allowed = applications.filter(a => a.status === 'ALLOWED').length;
    const blocked = applications.filter(a => a.status === 'BLOCKED').length;
    const ask = applications.filter(a => a.status === 'ASK').length;
    const active = applications.filter(a => a.activeConnections > 0).length;
    return { total, allowed, blocked, ask, active };
  }, [applications]);

  // Filtering
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const searchLower = search.trim().toLowerCase();
      const matchesSearch = !searchLower || 
        app.name.toLowerCase().includes(searchLower) ||
        app.executablePath.toLowerCase().includes(searchLower) ||
        app.description.toLowerCase().includes(searchLower);

      const matchesCat = categoryFilter === 'ALL' || app.category === categoryFilter;
      const matchesPolicy = policyFilter === 'ALL' || app.status === policyFilter;

      return matchesSearch && matchesCat && matchesPolicy;
    });
  }, [applications, search, categoryFilter, policyFilter]);

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setPolicyFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Applications
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[11px] font-semibold text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Development Preview</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Control how NEXUS Firewall handles network access for individual applications.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-900">
            Application Policy Preview
          </p>
          <p className="text-amber-800/90 text-[11px] leading-relaxed">
            Application policies defined here demonstrate how NEXUS Firewall tracks binary hashes and enforces cgroup/socket permissions before binding to the Linux netfilter core.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Applications</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.total}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Managed profiles</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 block">Allowed</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.allowed}</p>
          <span className="text-[10px] text-emerald-600/80 mt-0.5 block">Permitted sockets</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-600 block">Blocked</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{summary.blocked}</p>
          <span className="text-[10px] text-rose-600/80 mt-0.5 block">Zero connectivity</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 block">Ask Policy</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{summary.ask}</p>
          <span className="text-[10px] text-amber-600/80 mt-0.5 block">Prompt on new connect</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-blue-600 block">Active Sockets</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{summary.active}</p>
          <span className="text-[10px] text-blue-600/80 mt-0.5 block">Running with traffic</span>
        </div>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by application name, binary path, or description..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Policy Filter */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-[11px] text-slate-400">Policy:</span>
              <select
                value={policyFilter}
                onChange={(e) => setPolicyFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Policies</option>
                <option value="ALLOWED">Allowed</option>
                <option value="BLOCKED">Blocked</option>
                <option value="ASK">Ask</option>
              </select>
            </div>

            {(categoryFilter !== 'ALL' || policyFilter !== 'ALL' || search) && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors text-xs"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-50 text-blue-600 border border-blue-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Display: Grid or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app) => {
            const hasRules = (app.associatedRuleIds && app.associatedRuleIds.length > 0);

            return (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AppIcon name={app.name} size={34} />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                          {app.name}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                          {app.category}
                        </span>
                      </div>
                    </div>

                    {app.signatureVerified ? (
                      <span 
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50"
                        title="Digitally signed and verified binary"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span 
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50"
                        title="Unsigned executable"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Unsigned</span>
                      </span>
                    )}
                  </div>

                  {/* Executable Path */}
                  <div className="mt-3.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-slate-500 font-mono text-[11px] truncate">
                    <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{app.executablePath}</span>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                    {app.description}
                  </p>

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Sockets</span>
                      <span className="text-xs font-bold text-slate-800">{app.activeConnections}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium flex items-center justify-center gap-0.5">
                        <ArrowDown className="w-2.5 h-2.5 text-emerald-500" /> Ingress
                      </span>
                      <span className="text-xs font-bold text-slate-800">{app.downloadBytes}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium flex items-center justify-center gap-0.5">
                        <ArrowUp className="w-2.5 h-2.5 text-blue-500" /> Egress
                      </span>
                      <span className="text-xs font-bold text-slate-800">{app.uploadBytes}</span>
                    </div>
                  </div>
                </div>

                {/* Policy Controls */}
                <div 
                  className="mt-5 pt-3.5 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Access Policy:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedApp(app)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs">
                    {(['ALLOWED', 'BLOCKED', 'ASK'] as AppPolicyStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateApplicationStatus(app.id, st)}
                        className={`py-1.5 rounded-lg font-bold text-[10px] transition-all ${
                          app.status === st
                            ? st === 'ALLOWED'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : st === 'BLOCKED'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Applications Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Application</th>
                  <th className="py-3.5 px-4">Binary Path</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Signature</th>
                  <th className="py-3.5 px-3">Sockets</th>
                  <th className="py-3.5 px-3">Bandwidth</th>
                  <th className="py-3.5 px-4">Policy</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 font-semibold text-slate-900">
                        <AppIcon name={app.name} size={18} />
                        <span className="group-hover:text-blue-600 transition-colors">
                          {app.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                      {app.executablePath}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {app.category}
                    </td>
                    <td className="py-3 px-3">
                      {app.signatureVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Unsigned</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-800 font-semibold">
                      {app.activeConnections}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      ↓{app.downloadBytes} ↑{app.uploadBytes}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex gap-1 p-0.5 bg-slate-100 rounded-lg">
                        {(['ALLOWED', 'BLOCKED', 'ASK'] as AppPolicyStatus[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => updateApplicationStatus(app.id, st)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              app.status === st
                                ? st === 'ALLOWED'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'BLOCKED'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
                        className="px-2.5 py-1 text-[11px] text-blue-600 group-hover:bg-blue-50 rounded-lg font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <Folder className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">No applications found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No application binary rules match the current filters or search term.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Application Details Drawer */}
      <ApplicationDetailsDrawer
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
      />

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addApplication}
      />
    </div>
  );
};
