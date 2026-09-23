import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  Sliders,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  Layers,
  Database,
  Cpu,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  AlertTriangle,
  Play,
  RotateCcw,
  UserCheck,
  HardDrive,
  Users,
  User,
  Building2,
  Plus,
  Trash2,
  Lock,
  PieChart
} from 'lucide-react';
import {
  Collection,
  DocumentItem,
  IngestionConfig,
  ReindexJob,
  ScopeResourceAllocation,
  SystemRole,
  TeamAllocationRecord,
  UserProfile
} from '../types';
import {
  formatBytes,
  getScopeUsedBytes,
  getTeamUsedBytes,
  getTotalSystemUsedBytes,
  getCollectionUsedBytes
} from '../utils/resourceUtils';

interface AdminViewProps {
  currentUser: UserProfile;
  onChangeUserRole: (newRole: SystemRole) => void;
  collections: Collection[];
  documents: DocumentItem[];
  ingestionConfig: IngestionConfig;
  onUpdateIngestionConfig: (newConfig: IngestionConfig) => void;
  onTriggerReindex: (targetScope: 'all' | string) => Promise<ReindexJob>;
  reindexHistory: ReindexJob[];
  scopeResourceAllocation: ScopeResourceAllocation;
  onUpdateScopeResourceAllocation: (newAlloc: ScopeResourceAllocation) => void;
  teamAllocations: TeamAllocationRecord[];
  onUpdateTeamAllocation: (updated: TeamAllocationRecord) => void;
  onOpenTeamAllocationModal: (teamRecord: TeamAllocationRecord) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  onChangeUserRole,
  collections,
  documents,
  ingestionConfig,
  onUpdateIngestionConfig,
  onTriggerReindex,
  reindexHistory,
  scopeResourceAllocation,
  onUpdateScopeResourceAllocation,
  teamAllocations,
  onUpdateTeamAllocation,
  onOpenTeamAllocationModal,
}) => {
  // Navigation Tabs inside Admin & Governance Console
  const [adminTab, setAdminTab] = useState<'resources' | 'ingestion' | 'reindex'>('resources');

  // Local Resource Allocation editable form state
  const [scopeForm, setScopeForm] = useState<ScopeResourceAllocation>({
    ...scopeResourceAllocation,
  });
  const [resourceSaveSuccess, setResourceSaveSuccess] = useState(false);

  // Local Team Allocations list state for admin editing
  const [localTeams, setLocalTeams] = useState<TeamAllocationRecord[]>([...teamAllocations]);

  // Selected Team for Team Leader autonomous allocation sub-panel
  const defaultTeamId =
    currentUser.teamId ||
    teamAllocations.find(
      (t) => t.teamName.toLowerCase() === (currentUser.teamName || '').toLowerCase()
    )?.teamId ||
    teamAllocations[0]?.teamId ||
    'team-platform';

  const [activeLeaderTeamId, setActiveLeaderTeamId] = useState<string>(defaultTeamId);
  const [leaderSaveSuccess, setLeaderSaveSuccess] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState('');
  const [newTeamGb, setNewTeamGb] = useState(40);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);

  // Local state for Ingestion config
  const [formConfig, setFormConfig] = useState<IngestionConfig>({ ...ingestionConfig });
  const [ingestionSaveSuccess, setIngestionSaveSuccess] = useState(false);

  // Re-indexing target & progress state
  const [reindexTarget, setReindexTarget] = useState<'all' | string>('all');
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexProgress, setReindexProgress] = useState<{
    step: number;
    message: string;
    completedJob?: ReindexJob;
  } | null>(null);

  // Authorization checks
  const isOwnerOrAdmin = currentUser.systemRole === 'owner' || currentUser.systemRole === 'admin';
  const isTeamLead = currentUser.systemRole === 'team_lead' || !!currentUser.isTeamLeader;
  const isAuthorized = isOwnerOrAdmin || isTeamLead;

  // Resource & Storage Computations
  const totalStoredBytes = getTotalSystemUsedBytes(documents);
  const mineStoredBytes = getScopeUsedBytes('mine', documents, collections);
  const teamStoredBytes = getScopeUsedBytes('team', documents, collections);
  const orgStoredBytes = getScopeUsedBytes('org', documents, collections);

  const totalAssignedTiersGb =
    scopeForm.personalPoolQuotaGb + scopeForm.teamPoolQuotaGb + scopeForm.orgPoolQuotaGb;
  const unallocatedEnterpriseBufferGb = scopeForm.totalEnterpriseCapGb - totalAssignedTiersGb;
  const isScopeOverAllocated = unallocatedEnterpriseBufferGb < 0;

  const totalTeamAllocatedGb = localTeams.reduce((acc, t) => acc + (Number(t.allocatedGb) || 0), 0);
  const teamPoolRemainingGb = scopeForm.teamPoolQuotaGb - totalTeamAllocatedGb;

  // Selected Team for Team Lead view
  const currentLeaderTeam =
    localTeams.find((t) => t.teamId === activeLeaderTeamId) || localTeams[0];

  // Ingestion metrics
  const totalChunks = (documents || []).reduce((acc, d) => acc + (d.chunkCount || 0), 0);
  const avgTokensPerChunk =
    totalChunks > 0
      ? Math.round(
          (documents || [])
            .flatMap((d) => (d.pages || []).flatMap((p) => p.chunks || []))
            .reduce((acc, c) => acc + (c?.tokenCount || 0), 0) / totalChunks
        )
      : 0;

  const overlapRatio = Math.round(
    (((formConfig && formConfig.chunkOverlapTokens) ?? 32) /
      Math.max(1, (formConfig && formConfig.maxChunkSizeTokens) || 256)) *
      100
  );

  // Handlers
  const handleSaveScopeAllocations = () => {
    onUpdateScopeResourceAllocation(scopeForm);
    setResourceSaveSuccess(true);
    setTimeout(() => setResourceSaveSuccess(false), 2500);
  };

  const handleAdminUpdateTeamGb = (teamId: string, gb: number) => {
    const updated = localTeams.map((t) => (t.teamId === teamId ? { ...t, allocatedGb: Math.max(0, gb) } : t));
    setLocalTeams(updated);
    const target = updated.find((t) => t.teamId === teamId);
    if (target) {
      onUpdateTeamAllocation(target);
    }
  };

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    const newTeamRecord: TeamAllocationRecord = {
      teamId: `team-${Date.now()}`,
      teamName: newTeamName.trim(),
      teamLeader: {
        name: newTeamLeader.trim() || 'Assigned Team Lead',
        email: `${newTeamName.toLowerCase().replace(/[^a-z0-9]/g, '')}@enterprise.internal`,
      },
      allocatedGb: Math.max(5, newTeamGb),
      collectionAllocations: [],
    };
    const updated = [...localTeams, newTeamRecord];
    setLocalTeams(updated);
    onUpdateTeamAllocation(newTeamRecord);
    setActiveLeaderTeamId(newTeamRecord.teamId);
    setNewTeamName('');
    setNewTeamLeader('');
    setNewTeamGb(40);
    setShowAddTeamModal(false);
  };

  const handleLeaderUpdateCollectionGb = (collectionId: string, gb: number) => {
    if (!currentLeaderTeam) return;
    const updatedColAllocs = currentLeaderTeam.collectionAllocations.map((a) =>
      a.collectionId === collectionId ? { ...a, allocatedGb: Math.max(0, gb) } : a
    );

    const updatedTeam: TeamAllocationRecord = {
      ...currentLeaderTeam,
      collectionAllocations: updatedColAllocs,
    };

    setLocalTeams((prev) => prev.map((t) => (t.teamId === currentLeaderTeam.teamId ? updatedTeam : t)));
    onUpdateTeamAllocation(updatedTeam);
  };

  const handleLeaderSave = () => {
    if (currentLeaderTeam) {
      onUpdateTeamAllocation(currentLeaderTeam);
      setLeaderSaveSuccess(true);
      setTimeout(() => setLeaderSaveSuccess(false), 2500);
    }
  };

  const handleSaveIngestionConfig = () => {
    onUpdateIngestionConfig(formConfig);
    setIngestionSaveSuccess(true);
    setTimeout(() => setIngestionSaveSuccess(false), 2500);
  };

  const handleRunReindex = async () => {
    setIsReindexing(true);
    setReindexProgress({ step: 1, message: 'Extracting source text & parsing document AST...' });

    await new Promise((r) => setTimeout(r, 450));
    setReindexProgress({
      step: 2,
      message: `Applying token window: ${formConfig.maxChunkSizeTokens} tokens with ${formConfig.chunkOverlapTokens} overlap...`,
    });

    await new Promise((r) => setTimeout(r, 550));
    setReindexProgress({
      step: 3,
      message: `Generating dense vector embeddings (${formConfig.embeddingModel})...`,
    });

    await new Promise((r) => setTimeout(r, 400));
    setReindexProgress({
      step: 4,
      message: 'Updating collection chunk indices & cross-reference relationships...',
    });

    const job = await onTriggerReindex(reindexTarget);
    setReindexProgress({
      step: 5,
      message: 'Re-indexing complete!',
      completedJob: job,
    });
    setIsReindexing(false);
  };

  // RBAC Guard for unauthorized users
  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-100/60 dark:bg-neutral-950 overflow-y-auto">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-xl border border-neutral-300 dark:border-neutral-800 shadow-sm p-8 text-center space-y-5">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50 dark:ring-red-950/40">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 text-[11px] font-semibold uppercase tracking-wider border border-red-200 dark:border-red-900/60">
              Access Restricted · 403 Forbidden
            </span>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Administrative &amp; Resource Allocation Access Required
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Storage quotas, personal/team/org GB allocations, token budgets, and corpus re-indexing are restricted to enterprise <strong className="text-neutral-700 dark:text-neutral-300 font-medium">Owner</strong>, <strong className="text-neutral-700 dark:text-neutral-300 font-medium">Admin</strong>, or <strong className="text-neutral-700 dark:text-neutral-300 font-medium">Team Leader</strong> roles.
            </p>
          </div>

          {/* Current User Role Notice */}
          <div className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-xs text-left space-y-1.5">
            <div className="flex justify-between items-center text-neutral-500 dark:text-neutral-400">
              <span>Current User:</span>
              <strong className="text-neutral-900 dark:text-neutral-100">{currentUser.name}</strong>
            </div>
            <div className="flex justify-between items-center text-neutral-500 dark:text-neutral-400">
              <span>Assigned Role:</span>
              <span className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono text-[11px] text-neutral-800 dark:text-neutral-200 uppercase font-semibold">
                {currentUser.systemRole}
              </span>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Evaluate and simulate capabilities as:
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => onChangeUserRole('owner')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Owner</span>
              </button>
              <button
                onClick={() => onChangeUserRole('admin')}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-300 dark:border-neutral-700"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => onChangeUserRole('team_lead')}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team Leader</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-neutral-50/70 dark:bg-neutral-950 select-none transition-colors">
      {/* Top Header */}
      <div className="px-8 py-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-blue-600 text-white shadow-2xs">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Enterprise Resource Quota &amp; Governance
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                <Shield className="w-2.5 h-2.5" />
                <span>{currentUser.systemRole.toUpperCase()}</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Allocate cloud resources across Personal, Team, and Org tiers. Team leaders autonomously distribute quotas within their team.
            </p>
          </div>

          {/* Quick Role & Persona Switcher */}
          <div className="flex items-center gap-2 self-start sm:self-center bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">Simulate:</span>
            <select
              value={currentUser.systemRole}
              onChange={(e) => onChangeUserRole(e.target.value as SystemRole)}
              className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded px-2 py-0.5 text-xs font-medium cursor-pointer"
            >
              <option value="owner">Owner (Elena Rostova - Full Control)</option>
              <option value="admin">Admin (Sarah Jenkins - IT Admin)</option>
              <option value="team_lead">Team Leader (Marcus Vance - Team Lead)</option>
              <option value="member">Member (Liam Zhang - Contributor)</option>
              <option value="viewer">Viewer (Auditor - Read-Only)</option>
            </select>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="max-w-6xl mx-auto flex items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setAdminTab('resources')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              adminTab === 'resources'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Resource &amp; Quota Allocation</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('ingestion')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              adminTab === 'ingestion'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Token Budget &amp; Ingestion</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('reindex')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              adminTab === 'reindex'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Corpus Re-Indexing Engine</span>
          </button>
        </div>
      </div>

      {/* Main Body Content based on active tab */}
      <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* ============================================================== */}
        {/* TAB 1: RESOURCE & QUOTA ALLOCATION (ADMIN + TEAM LEADER)        */}
        {/* ============================================================== */}
        {adminTab === 'resources' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Enterprise Cloud Storage Capacity Overview */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Enterprise Cloud Storage Capacity
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    High-level cloud storage subscription quota allocated across corporate scopes.
                  </p>
                </div>

                {isOwnerOrAdmin && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Total Cloud Subscription:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="100"
                        max="10000"
                        step="50"
                        value={scopeForm.totalEnterpriseCapGb}
                        onChange={(e) =>
                          setScopeForm({
                            ...scopeForm,
                            totalEnterpriseCapGb: Number(e.target.value) || 0,
                          })
                        }
                        className="w-24 px-2.5 py-1 text-right font-mono font-bold text-xs border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      />
                      <span className="text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400">GB</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                    Total Enterprise Cap
                  </div>
                  <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                    {scopeForm.totalEnterpriseCapGb} <span className="text-xs font-sans text-neutral-500 dark:text-neutral-400">GB</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    Cloud subscription ceiling
                  </div>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                    Allocated Across Tiers
                  </div>
                  <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                    {totalAssignedTiersGb} <span className="text-xs font-sans text-neutral-500 dark:text-neutral-400">GB</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    Personal + Team + Org
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-lg border ${
                    isScopeOverAllocated
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50'
                  }`}
                >
                  <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                    Unallocated Buffer
                  </div>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      isScopeOverAllocated ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {unallocatedEnterpriseBufferGb} <span className="text-xs font-sans text-neutral-500 dark:text-neutral-400">GB</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isScopeOverAllocated ? 'Over-allocated pool!' : 'Reserve cloud capacity'}
                  </div>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                    Actual Content Stored
                  </div>
                  <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                    {formatBytes(totalStoredBytes)}
                  </div>
                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {documents.length} ingested documents
                  </div>
                </div>
              </div>

              {/* Aggregate Allocation Visual Bar */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Tier Distribution vs Subscription Cap</span>
                  <span className="font-mono text-neutral-500 dark:text-neutral-400">
                    {totalAssignedTiersGb} / {scopeForm.totalEnterpriseCapGb} GB ({Math.round((totalAssignedTiersGb / Math.max(1, scopeForm.totalEnterpriseCapGb)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex border border-neutral-200 dark:border-neutral-700">
                  <div
                    title={`Personal: ${scopeForm.personalPoolQuotaGb} GB`}
                    className="bg-sky-500 h-full transition-all duration-300"
                    style={{
                      width: `${(scopeForm.personalPoolQuotaGb / Math.max(1, scopeForm.totalEnterpriseCapGb)) * 100}%`,
                    }}
                  />
                  <div
                    title={`Team Pool: ${scopeForm.teamPoolQuotaGb} GB`}
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{
                      width: `${(scopeForm.teamPoolQuotaGb / Math.max(1, scopeForm.totalEnterpriseCapGb)) * 100}%`,
                    }}
                  />
                  <div
                    title={`Org Pool: ${scopeForm.orgPoolQuotaGb} GB`}
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{
                      width: `${(scopeForm.orgPoolQuotaGb / Math.max(1, scopeForm.totalEnterpriseCapGb)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-600 dark:text-neutral-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                    <span>Personal Pool ({scopeForm.personalPoolQuotaGb} GB)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                    <span>Team Pool ({scopeForm.teamPoolQuotaGb} GB)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Organization Pool ({scopeForm.orgPoolQuotaGb} GB)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Tier Allocation Form (Personal, Team, Org) */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Scope Resource Allocation Controls
                  </h2>
                </div>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                  Configured by Workspace Administrator
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 1. Personal Scope */}
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300">
                          <User className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                          Personal Scope (Mine)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800 font-medium">
                        Per User Cap
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Scratchpads, individual RFC drafts, and personal sandbox experiments.
                    </p>

                    <div className="space-y-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-700">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Per-User Limit:</span>
                          <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                            {scopeForm.personalPerUserCapGb} GB
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          disabled={!isOwnerOrAdmin}
                          value={scopeForm.personalPerUserCapGb}
                          onChange={(e) =>
                            setScopeForm({
                              ...scopeForm,
                              personalPerUserCapGb: Number(e.target.value),
                            })
                          }
                          className="w-full accent-blue-600 cursor-pointer disabled:opacity-50"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">
                          <span>1 GB</span>
                          <span>10 GB</span>
                          <span>20 GB</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-neutral-600 dark:text-neutral-400">Personal Pool Quota:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="5"
                            max="500"
                            step="5"
                            disabled={!isOwnerOrAdmin}
                            value={scopeForm.personalPoolQuotaGb}
                            onChange={(e) =>
                              setScopeForm({
                                ...scopeForm,
                                personalPoolQuotaGb: Number(e.target.value) || 0,
                              })
                            }
                            className="w-16 px-2 py-0.5 text-right font-mono text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 disabled:bg-neutral-100 dark:disabled:bg-neutral-800/40"
                          />
                          <span className="font-mono text-neutral-500 dark:text-neutral-400">GB</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 text-[11px] flex justify-between items-center">
                        <span className="text-neutral-500 dark:text-neutral-400">Current Storage Used:</span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {formatBytes(mineStoredBytes)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Team Scope */}
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                          <Users className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                          Team Scope Pool
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 font-medium">
                        Team Leader Delegated
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Shared team spaces. IT Admin allocates team quotas; Team Leaders distribute across projects.
                    </p>

                    <div className="space-y-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-700">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Aggregate Team Pool:</span>
                          <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                            {scopeForm.teamPoolQuotaGb} GB
                          </span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="800"
                          step="25"
                          disabled={!isOwnerOrAdmin}
                          value={scopeForm.teamPoolQuotaGb}
                          onChange={(e) =>
                            setScopeForm({
                              ...scopeForm,
                              teamPoolQuotaGb: Number(e.target.value),
                            })
                          }
                          className="w-full accent-blue-600 cursor-pointer disabled:opacity-50"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">
                          <span>50 GB</span>
                          <span>400 GB</span>
                          <span>800 GB</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-neutral-600 dark:text-neutral-400">Assigned to Teams:</span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {totalTeamAllocatedGb} / {scopeForm.teamPoolQuotaGb} GB
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 text-[11px] flex justify-between items-center">
                        <span className="text-neutral-500 dark:text-neutral-400">Current Storage Used:</span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {formatBytes(teamStoredBytes)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Organization Scope */}
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                          Organization (Org)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-medium">
                        Centrally Governed
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Company-wide repository for compliance, security standards, and executive policies.
                    </p>

                    <div className="space-y-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-700">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Org Repository Quota:</span>
                          <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                            {scopeForm.orgPoolQuotaGb} GB
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="500"
                          step="10"
                          disabled={!isOwnerOrAdmin}
                          value={scopeForm.orgPoolQuotaGb}
                          onChange={(e) =>
                            setScopeForm({
                              ...scopeForm,
                              orgPoolQuotaGb: Number(e.target.value),
                            })
                          }
                          className="w-full accent-blue-600 cursor-pointer disabled:opacity-50"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">
                          <span>20 GB</span>
                          <span>250 GB</span>
                          <span>500 GB</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-neutral-600 dark:text-neutral-400">Enterprise Collections:</span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {collections.filter((c) => c.scope === 'org').length} collections
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 text-[11px] flex justify-between items-center">
                        <span className="text-neutral-500 dark:text-neutral-400">Current Storage Used:</span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {formatBytes(orgStoredBytes)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scope Allocation Save Controls */}
                {isOwnerOrAdmin && (
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Scope storage limits are enforced dynamically across all upload and Drive ingestion operations.
                    </span>

                    <div className="flex items-center gap-2">
                      {resourceSaveSuccess && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Scope quotas saved successfully!</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setScopeForm({ ...scopeResourceAllocation })}
                        className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-medium rounded-md transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveScopeAllocations}
                        disabled={isScopeOverAllocated}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
                      >
                        Save Scope Allocations
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Team Allocation Table (Admin sets quota per team) */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Team Quota Allocations (Admin Assigned)
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Admins grant base storage quotas to teams. Team Leaders then allocate these resources to internal projects.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded text-neutral-700 dark:text-neutral-300">
                    Team Pool Remaining: <strong className={teamPoolRemainingGb < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}>{teamPoolRemainingGb} GB</strong>
                  </div>
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowAddTeamModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Team Allocation</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Add Team Modal / Inline Drawer */}
              {showAddTeamModal && (
                <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60 space-y-3 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                    <span>Provision New Team Storage Quota</span>
                    <button
                      onClick={() => setShowAddTeamModal(false)}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Team Name (e.g. Data Science & ML)"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <input
                      type="text"
                      placeholder="Team Leader Name (e.g. Alex Rivera)"
                      value={newTeamLeader}
                      onChange={(e) => setNewTeamLeader(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={newTeamGb}
                        onChange={(e) => setNewTeamGb(Number(e.target.value) || 0)}
                        className="w-20 px-2 py-1.5 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-right focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">GB</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateTeam}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      Provision Team Quota
                    </button>
                  </div>
                </div>
              )}

              {/* Teams Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
                    <tr>
                      <th className="py-2.5 px-6">Team Name</th>
                      <th className="py-2.5 px-4">Designated Leader</th>
                      <th className="py-2.5 px-4">Quota (Admin Granted)</th>
                      <th className="py-2.5 px-4">Sub-Allocated by Lead</th>
                      <th className="py-2.5 px-4">Team Buffer</th>
                      <th className="py-2.5 px-4">Storage Stored</th>
                      <th className="py-2.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {localTeams.map((team) => {
                      const subAllocated = team.collectionAllocations.reduce(
                        (acc, c) => acc + (c.allocatedGb || 0),
                        0
                      );
                      const buffer = team.allocatedGb - subAllocated;
                      const usedBytes = getTeamUsedBytes(team.teamName, documents, collections);

                      return (
                        <tr key={team.teamId} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="py-3 px-6 font-semibold text-neutral-900 dark:text-neutral-100">
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>{team.teamName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                            <div>
                              <span className="font-medium">{team.teamLeader.name}</span>
                              <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">{team.teamLeader.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {isOwnerOrAdmin ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="5"
                                  max="500"
                                  step="5"
                                  value={team.allocatedGb}
                                  onChange={(e) =>
                                    handleAdminUpdateTeamGb(team.teamId, Number(e.target.value) || 0)
                                  }
                                  className="w-16 px-2 py-1 text-right font-mono font-bold text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                                <span className="font-mono text-neutral-500 dark:text-neutral-400">GB</span>
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{team.allocatedGb} GB</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                            {subAllocated} GB ({team.collectionAllocations.length} targets)
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-mono font-semibold ${
                                buffer < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {buffer} GB
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                            {formatBytes(usedBytes)}
                          </td>
                          <td className="py-3 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveLeaderTeamId(team.teamId);
                                onOpenTeamAllocationModal(team);
                              }}
                              className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <span>Manage Collections</span>
                              <ArrowRight className="w-3 h-3 text-neutral-400" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team Leader Sub-Allocation Console (The Team Leader view) */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-800/40">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Team Leader Allocation Panel: {currentLeaderTeam?.teamName}
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    As Team Leader (<strong className="text-neutral-700 dark:text-neutral-300 font-medium">{currentLeaderTeam?.teamLeader.name}</strong>), you allocate how many GB each project and collection receives out of your team's <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{currentLeaderTeam?.allocatedGb} GB</strong> budget.
                  </p>
                </div>

                {/* Team Selector for Admins & Owners */}
                {isOwnerOrAdmin && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Active Team:</span>
                    <select
                      value={activeLeaderTeamId}
                      onChange={(e) => setActiveLeaderTeamId(e.target.value)}
                      className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    >
                      {localTeams.map((t) => (
                        <option key={t.teamId} value={t.teamId}>
                          {t.teamName} ({t.allocatedGb} GB)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {currentLeaderTeam && (
                <div className="p-6 space-y-6">
                  {/* Team Quota Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                        Admin Allocated Quota
                      </div>
                      <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                        {currentLeaderTeam.allocatedGb} <span className="text-xs font-sans text-neutral-500 dark:text-neutral-400">GB</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        Base allowance for {currentLeaderTeam.teamName}
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                        Distributed to Collections
                      </div>
                      <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                        {currentLeaderTeam.collectionAllocations.reduce((acc, c) => acc + (c.allocatedGb || 0), 0)}{' '}
                        <span className="text-xs font-sans text-neutral-500 dark:text-neutral-400">GB</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {currentLeaderTeam.collectionAllocations.length} collection targets
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                      <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                        Unallocated Team Buffer
                      </div>
                      <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                        {currentLeaderTeam.allocatedGb -
                          currentLeaderTeam.collectionAllocations.reduce(
                            (acc, c) => acc + (c.allocatedGb || 0),
                            0
                          )}{' '}
                        <span className="text-xs font-sans text-neutral-500 dark:text-neutral-400">GB</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Available for new team repositories
                      </div>
                    </div>
                  </div>

                  {/* List of Collections for this team with adjustable quotas */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                        Team Collections Quota Breakdown
                      </h3>
                      <button
                        type="button"
                        onClick={() => onOpenTeamAllocationModal(currentLeaderTeam)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer flex items-center gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Open Modal Allocator</span>
                      </button>
                    </div>

                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
                      {currentLeaderTeam.collectionAllocations.length === 0 ? (
                        <div className="p-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                          No collection allocations defined yet. Click below to add allocations for your team.
                        </div>
                      ) : (
                        currentLeaderTeam.collectionAllocations.map((alloc) => {
                          const col = collections.find((c) => c.id === alloc.collectionId);
                          const usedBytes = col ? getCollectionUsedBytes(col.id, documents) : 0;

                          return (
                            <div
                              key={alloc.collectionId}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors"
                            >
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                    {alloc.collectionName}
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                                  <span>Used: <strong className="font-mono text-neutral-700 dark:text-neutral-300">{formatBytes(usedBytes)}</strong></span>
                                  <span>·</span>
                                  <span>{col?.documentCount || 0} documents</span>
                                </div>
                              </div>

                              {/* Slider + Numeric Control */}
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="w-32 hidden sm:block">
                                  <input
                                    type="range"
                                    min="0"
                                    max={currentLeaderTeam.allocatedGb}
                                    step="5"
                                    value={alloc.allocatedGb}
                                    onChange={(e) =>
                                      handleLeaderUpdateCollectionGb(
                                        alloc.collectionId,
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="w-full accent-blue-600 cursor-pointer"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max={currentLeaderTeam.allocatedGb}
                                    value={alloc.allocatedGb}
                                    onChange={(e) =>
                                      handleLeaderUpdateCollectionGb(
                                        alloc.collectionId,
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="w-16 px-2 py-1 text-right font-mono text-xs border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                  />
                                  <span className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400">GB</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Save Team Leader Allocations Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Changes are enforced on all team contributors immediately upon saving.
                    </span>

                    <div className="flex items-center gap-2">
                      {leaderSaveSuccess && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Team allocations saved!</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleLeaderSave}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                      >
                        Save Team Allocations
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: INGESTION & TOKEN CONFIGURATION                         */}
        {/* ============================================================== */}
        {adminTab === 'ingestion' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* System Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
                  <span>Active Chunk Budget</span>
                  <Sliders className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                  {ingestionConfig.maxChunkSizeTokens}{' '}
                  <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">tokens</span>
                </div>
                <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Overlap: <strong className="text-neutral-700 dark:text-neutral-300">{ingestionConfig.chunkOverlapTokens} tokens</strong> ({overlapRatio}%)
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
                  <span>Corpus Documents</span>
                  <FileText className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                  {documents.length}
                </div>
                <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Across <strong className="text-neutral-700 dark:text-neutral-300">{collections.length}</strong> collections
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
                  <span>Indexed Chunks</span>
                  <Layers className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                  {totalChunks}
                </div>
                <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Avg: <strong className="text-neutral-700 dark:text-neutral-300">{avgTokensPerChunk} tokens</strong> / chunk
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
                  <span>Embedding Model</span>
                  <Cpu className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <div className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 truncate">
                  {ingestionConfig.embeddingModel}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {ingestionConfig.embeddingDimensions}-dim dense vectors
                </div>
              </div>
            </div>

            {/* Ingestion & Token Configuration Form */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Token Budget &amp; Overlap Configuration
                  </h2>
                </div>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                  Applies to direct uploads, Drive sync &amp; re-indexes
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* Max Chunk Size Setting */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                        Maximum Chunk Size (Tokens)
                      </label>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Defines the upper bound of text tokens packed into a single searchable chunk. Smaller chunks yield precise citations; larger chunks retain narrative context.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="64"
                        max="1024"
                        step="16"
                        value={formConfig.maxChunkSizeTokens}
                        onChange={(e) =>
                          setFormConfig({
                            ...formConfig,
                            maxChunkSizeTokens: Math.max(64, Math.min(1024, Number(e.target.value) || 256)),
                          })
                        }
                        className="w-20 px-2 py-1 text-right font-mono text-xs border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">tokens</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="64"
                    max="1024"
                    step="16"
                    value={formConfig.maxChunkSizeTokens}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        maxChunkSizeTokens: Number(e.target.value),
                      })
                    }
                    className="w-full accent-blue-600 cursor-pointer"
                  />

                  {/* Presets */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500">Presets:</span>
                    {[
                      { label: 'Fine (128t)', val: 128 },
                      { label: 'Balanced (256t)', val: 256 },
                      { label: 'Deep (512t)', val: 512 },
                      { label: 'Wide (1024t)', val: 1024 },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() =>
                          setFormConfig({
                            ...formConfig,
                            maxChunkSizeTokens: p.val,
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                          formConfig.maxChunkSizeTokens === p.val
                            ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-2xs'
                            : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overlap Window Setting */}
                <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                        Chunk Sliding Overlap Window (Tokens)
                      </label>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Consecutive tokens shared across adjoining chunks. Prevents cross-sentence context cuts at chunk boundaries.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="128"
                        step="4"
                        value={formConfig.chunkOverlapTokens}
                        onChange={(e) =>
                          setFormConfig({
                            ...formConfig,
                            chunkOverlapTokens: Math.max(0, Math.min(128, Number(e.target.value) || 0)),
                          })
                        }
                        className="w-20 px-2 py-1 text-right font-mono text-xs border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">tokens</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="128"
                    step="4"
                    value={formConfig.chunkOverlapTokens}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        chunkOverlapTokens: Number(e.target.value),
                      })
                    }
                    className="w-full accent-blue-600 cursor-pointer"
                  />

                  {/* Presets */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500">Presets:</span>
                    {[
                      { label: 'None (0t)', val: 0 },
                      { label: 'Low (16t)', val: 16 },
                      { label: 'Standard (32t)', val: 32 },
                      { label: 'High (64t)', val: 64 },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() =>
                          setFormConfig({
                            ...formConfig,
                            chunkOverlapTokens: p.val,
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                          formConfig.chunkOverlapTokens === p.val
                            ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-2xs'
                            : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Strategy & Model Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block mb-1">
                      Chunking Boundary Strategy
                    </label>
                    <select
                      value={formConfig.chunkingStrategy}
                      onChange={(e) =>
                        setFormConfig({
                          ...formConfig,
                          chunkingStrategy: e.target.value as any,
                        })
                      }
                      className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md p-2 text-xs text-neutral-800 dark:text-neutral-200"
                    >
                      <option value="paragraph_boundary">
                        Paragraph Boundary (Semantic Markdown Sections)
                      </option>
                      <option value="sliding_window">
                        Strict Sliding Window (Fixed Token Stride)
                      </option>
                      <option value="sentence_boundary">
                        Sentence Boundary (Splits on punctuation)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block mb-1">
                      Dense Embedding Model
                    </label>
                    <select
                      value={formConfig.embeddingModel}
                      onChange={(e) => {
                        const model = e.target.value;
                        const dims =
                          model === 'multilingual-e5-large' ? 1024 : model === 'bge-small-en-v1.5' ? 384 : 768;
                        setFormConfig({
                          ...formConfig,
                          embeddingModel: model,
                          embeddingDimensions: dims,
                        });
                      }}
                      className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md p-2 text-xs text-neutral-800 dark:text-neutral-200"
                    >
                      <option value="text-embedding-004">Google text-embedding-004 (768d, recommended)</option>
                      <option value="multilingual-e5-large">Multilingual E5 Large (1024d)</option>
                      <option value="bge-small-en-v1.5">BGE Small English (384d, fast)</option>
                    </select>
                  </div>
                </div>

                {/* Save Ingestion Config Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Unsaved adjustments will take effect upon clicking Save Configuration.
                  </span>

                  <div className="flex items-center gap-2">
                    {ingestionSaveSuccess && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Configuration saved!</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setFormConfig({ ...ingestionConfig })}
                      className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-medium rounded-md transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveIngestionConfig}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      Save Ingestion Parameters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CORPUS RE-INDEXING ENGINE & AUDIT TRAIL                */}
        {/* ============================================================== */}
        {adminTab === 'reindex' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Corpus Re-Indexing Engine */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-neutral-700 dark:text-neutral-300 ${isReindexing ? 'animate-spin' : ''}`} />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Corpus Re-Indexing &amp; Re-Chunking Engine
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-semibold">
                  CRITICAL OPERATION
                </span>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Triggering a re-index reads all original document text and executes fresh tokenization according to your current active settings (<strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{ingestionConfig.maxChunkSizeTokens} tokens / {ingestionConfig.chunkOverlapTokens} overlap</strong>). It updates all document chunk spans, recalibrates inverted BM25 indices, and refreshes collection totals.
                </p>

                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                      Re-Indexing Target Scope:
                    </label>
                    <select
                      value={reindexTarget}
                      onChange={(e) => setReindexTarget(e.target.value)}
                      disabled={isReindexing}
                      className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer min-w-64"
                    >
                      <option value="all">
                        All Collections ({collections.length} collections · {documents.length} docs)
                      </option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          Collection: {c.name} ({c.documentCount} docs)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunReindex}
                    disabled={isReindexing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Play className={`w-3.5 h-3.5 fill-white ${isReindexing ? 'animate-pulse' : ''}`} />
                    <span>{isReindexing ? 'Re-Indexing Corpus...' : 'Execute Re-Index'}</span>
                  </button>
                </div>

                {/* Live Progress Telemetry */}
                {reindexProgress && (
                  <div className="p-4 bg-neutral-900 dark:bg-neutral-950 text-white rounded-lg space-y-3 animate-in fade-in duration-200 border border-neutral-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-neutral-300">
                        <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isReindexing ? 'animate-spin' : ''}`} />
                        <span className="font-mono">{reindexProgress.message}</span>
                      </span>
                      <span className="font-mono text-neutral-400">Step {reindexProgress.step} of 5</span>
                    </div>

                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full transition-all duration-300"
                        style={{ width: `${(reindexProgress.step / 5) * 100}%` }}
                      />
                    </div>

                    {reindexProgress.completedJob && (
                      <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-300 font-mono">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Re-index Successful!</span>
                        </div>
                        <div>
                          Docs: <strong className="text-white">{reindexProgress.completedJob.docsCount}</strong>
                        </div>
                        <div>
                          Chunks Before: <strong className="text-white">{reindexProgress.completedJob.chunksBefore}</strong> → After:{' '}
                          <strong className="text-amber-300">{reindexProgress.completedJob.chunksAfter}</strong>
                        </div>
                        <div>
                          Duration: <strong className="text-white">{reindexProgress.completedJob.durationMs}ms</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Audit & Re-Indexing History Log */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Re-Indexing Audit Trail &amp; Ingestion History
                  </h2>
                </div>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                  {reindexHistory.length} recorded operations
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
                    <tr>
                      <th className="py-2.5 px-6">Timestamp</th>
                      <th className="py-2.5 px-4">Target Scope</th>
                      <th className="py-2.5 px-4">Triggered By</th>
                      <th className="py-2.5 px-4">Token Bounds</th>
                      <th className="py-2.5 px-4">Docs</th>
                      <th className="py-2.5 px-4">Chunks (Pre → Post)</th>
                      <th className="py-2.5 px-4">Latency</th>
                      <th className="py-2.5 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                    {reindexHistory.map((job) => (
                      <tr key={job.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50">
                        <td className="py-3 px-6 text-neutral-500 dark:text-neutral-400 text-[11px]">
                          {new Date(job.timestamp).toLocaleTimeString()} · {new Date(job.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-neutral-900 dark:text-neutral-100">
                          {job.targetName}
                        </td>
                        <td className="py-3 px-4 font-sans text-neutral-600 dark:text-neutral-300">
                          {job.triggeredBy}
                        </td>
                        <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                          {job.chunkSizeTokens}t / {job.chunkOverlapTokens}t
                        </td>
                        <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                          {job.docsCount}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-neutral-500 dark:text-neutral-400">{job.chunksBefore}</span>
                          <span className="text-neutral-400 dark:text-neutral-500 mx-1">→</span>
                          <span className="font-bold text-neutral-900 dark:text-neutral-100">{job.chunksAfter}</span>
                        </td>
                        <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400">
                          {job.durationMs}ms
                        </td>
                        <td className="py-3 px-6 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-sans font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
