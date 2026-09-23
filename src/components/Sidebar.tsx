import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  User,
  Users,
  Building2,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FileText,
  SlidersHorizontal,
  Shield,
  Lock,
  HardDrive,
  Sun,
  Moon
} from 'lucide-react';
import { Collection, DocumentItem, ScopeResourceAllocation, ScopeType, SystemRole, UserProfile } from '../types';
import { formatBytes, getScopeUsedBytes } from '../utils/resourceUtils';

interface SidebarProps {
  activeView: 'collections' | 'search' | 'admin';
  onSelectView: (view: 'collections' | 'search' | 'admin') => void;
  selectedScope: ScopeType;
  onSelectScope: (scope: ScopeType) => void;
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string | null) => void;
  collections: Collection[];
  documents?: DocumentItem[];
  scopeResourceAllocation?: ScopeResourceAllocation;
  onOpenNewCollection: () => void;
  currentUser: UserProfile;
  onChangeUserRole?: (role: SystemRole) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  selectedScope,
  onSelectScope,
  selectedCollectionId,
  onSelectCollection,
  collections,
  documents,
  scopeResourceAllocation,
  onOpenNewCollection,
  currentUser,
  onChangeUserRole,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const [sharedExpanded, setSharedExpanded] = useState(true);

  const mineCollections = collections.filter((c) => c.scope === 'mine');
  const orgCollections = collections.filter((c) => c.scope === 'org');
  const teamCollections = collections.filter((c) => c.scope === 'team');

  const personalUsedBytes = documents ? getScopeUsedBytes('mine', documents, collections) : 0;
  const personalCapGb = scopeResourceAllocation?.personalPerUserCapGb || 5;
  const personalCapBytes = personalCapGb * 1024 * 1024 * 1024;
  const personalPercent = Math.min(100, Math.round((personalUsedBytes / Math.max(1, personalCapBytes)) * 100));

  const isOwnerOrAdmin = currentUser.systemRole === 'owner' || currentUser.systemRole === 'admin';
  const isTeamLead = currentUser.systemRole === 'team_lead' || !!currentUser.isTeamLeader;

  return (
    <aside className="w-60 h-screen bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 flex flex-col shrink-0 border-r border-neutral-200 dark:border-neutral-800 select-none transition-colors">
      {/* Brand & Workspace Title */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">
            Nexus Knowledge
          </div>
        </div>

        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-amber-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />}
          </button>
        )}
      </div>

      {/* New Collection Action */}
      <div className="p-3 border-b border-neutral-100 dark:border-neutral-800/80">
        <button
          onClick={onOpenNewCollection}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
        {/* Top-Level Quick Links */}
        <div className="space-y-0.5">
          {/* Search */}
          <button
            onClick={() => {
              onSelectView('search');
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeView === 'search'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span>Search</span>
            </div>
          </button>

          {/* All Collections */}
          <button
            onClick={() => {
              onSelectCollection(null);
              onSelectScope('all');
              onSelectView('collections');
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeView === 'collections' && selectedCollectionId === null && selectedScope === 'all'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderKanban className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span>All Collections</span>
            </div>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono tabular-nums">
              {collections.length}
            </span>
          </button>

          {/* Admin & Ingestion Engine */}
          <button
            onClick={() => {
              onSelectView('admin');
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeView === 'admin'
                ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
            title="Resource allocations, ingestion parameters, token budgets, and corpus re-indexing"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className={`w-4 h-4 ${activeView === 'admin' ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`} />
              <span>Admin &amp; Resources</span>
            </div>
            {isOwnerOrAdmin ? (
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-tight ${
                  activeView === 'admin'
                    ? 'bg-blue-800 text-emerald-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                ADMIN
              </span>
            ) : isTeamLead ? (
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-tight ${
                  activeView === 'admin'
                    ? 'bg-blue-800 text-blue-200'
                    : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                }`}
              >
                LEAD
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 text-[9px] font-mono flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                <span>RBAC</span>
              </span>
            )}
          </button>
        </div>

        {/* Scopes Divider */}
        <div className="space-y-1 pt-1">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Scopes
          </div>

          {/* Mine */}
          <button
            onClick={() => {
              onSelectView('collections');
              onSelectScope('mine');
              onSelectCollection(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'collections' && selectedCollectionId === null && selectedScope === 'mine'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>My Collections</span>
            </div>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono tabular-nums">
              {mineCollections.length}
            </span>
          </button>

          {/* Shared Header Toggle */}
          <div className="pt-1">
            <button
              onClick={() => setSharedExpanded(!sharedExpanded)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>Shared</span>
              </div>
              {sharedExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
              )}
            </button>

            {sharedExpanded && (
              <div className="pl-4 mt-0.5 space-y-0.5 border-l border-neutral-200 dark:border-neutral-800 ml-3">
                {/* Organization */}
                <button
                  onClick={() => {
                    onSelectView('collections');
                    onSelectScope('org');
                    onSelectCollection(null);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                    activeView === 'collections' && selectedCollectionId === null && selectedScope === 'org'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                    <span>Organization</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                    {orgCollections.length}
                  </span>
                </button>

                {/* Team */}
                <button
                  onClick={() => {
                    onSelectView('collections');
                    onSelectScope('team');
                    onSelectCollection(null);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                    activeView === 'collections' && selectedCollectionId === null && selectedScope === 'team'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Users className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                    <span>Team</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                    {teamCollections.length}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collections Quick List */}
        <div className="pt-2">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
            Collections
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {collections.map((col) => {
              const isSelected = selectedCollectionId === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => {
                    onSelectCollection(col.id);
                    onSelectView('collections');
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs truncate transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  {col.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Footer Profile & Role Switcher */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/90 space-y-2.5">
        {/* Personal Storage Quota Widget */}
        <div className="p-2 bg-white dark:bg-neutral-800/90 rounded-lg border border-neutral-200 dark:border-neutral-700/80 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span>Personal Storage</span>
            </span>
            <span className="font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
              {formatBytes(personalUsedBytes)} / {personalCapGb} GB
            </span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                personalPercent > 90 ? 'bg-rose-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.max(2, personalPercent)}%` }}
            />
          </div>
        </div>

        <div
          onClick={() => onSelectView('admin')}
          className="flex items-center justify-between text-xs cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/60 p-1.5 rounded-md transition-colors"
          title="Click to open Admin & Resource Governance"
        >
          <div className="min-w-0">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-1.5">
              <span>{currentUser.name}</span>
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              {currentUser.role}
            </div>
          </div>
          <span title={`Role: ${currentUser.systemRole.toUpperCase()}`}>
            {isOwnerOrAdmin ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : isTeamLead ? (
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            ) : (
              <User className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
            )}
          </span>
        </div>

        {/* Quick RBAC Switcher & Theme Pill */}
        <div className="pt-1 flex items-center justify-between gap-1 text-[10px]">
          <span className="text-neutral-400 dark:text-neutral-500">Access:</span>
          {onChangeUserRole && (
            <select
              value={currentUser.systemRole}
              onChange={(e) => onChangeUserRole(e.target.value as SystemRole)}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer focus:outline-hidden focus:border-blue-500"
            >
              <option value="owner">owner (full)</option>
              <option value="admin">admin</option>
              <option value="team_lead">team lead</option>
              <option value="member">member</option>
              <option value="viewer">viewer</option>
            </select>
          )}
        </div>
      </div>
    </aside>
  );
};
