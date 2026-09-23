import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  ArrowUpDown,
  Building2,
  Users,
  User,
  HardDrive,
  FileText,
  SlidersHorizontal,
  Sliders
} from 'lucide-react';
import { Collection, ScopeType, TeamAllocationRecord, UserProfile } from '../types';

interface CollectionsViewProps {
  collections: Collection[];
  selectedScope: ScopeType;
  onSelectScope: (scope: ScopeType) => void;
  onSelectCollection: (collectionId: string) => void;
  onOpenNewCollection: () => void;
  onOpenAdmin?: () => void;
  currentUser?: UserProfile;
  teamAllocations?: TeamAllocationRecord[];
  onOpenTeamAllocationModal?: (teamRecord: TeamAllocationRecord) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  selectedScope,
  onSelectScope,
  onSelectCollection,
  onOpenNewCollection,
  onOpenAdmin,
  currentUser,
  teamAllocations,
  onOpenTeamAllocationModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sharedSubFilter, setSharedSubFilter] = useState<'all-shared' | 'org' | 'team'>('all-shared');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'docs'>('updated');

  // Filter collections based on scope and search
  const filteredCollections = collections.filter((col) => {
    // 1. Scope filter
    if (selectedScope === 'mine' && col.scope !== 'mine') return false;
    if (selectedScope === 'org' && col.scope !== 'org') return false;
    if (selectedScope === 'team' && col.scope !== 'team') return false;

    // In 'Shared' general view, filter by sub-filter if set
    if (selectedScope === 'org' && sharedSubFilter === 'team' && col.scope !== 'team') return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = col.name.toLowerCase().includes(q);
      const matchDesc = col.description.toLowerCase().includes(q);
      const matchTeam = col.teamName?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchTeam) return false;
    }

    return true;
  });

  // Sort
  filteredCollections.sort((a, b) => {
    if (sortBy === 'updated') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (sortBy === 'docs') {
      return b.documentCount - a.documentCount;
    }
    return a.name.localeCompare(b.name);
  });

  // Split into groups when in 'all' or 'shared' view
  const orgCollections = filteredCollections.filter((c) => c.scope === 'org');
  const teamCollections = filteredCollections.filter((c) => c.scope === 'team');
  const mineCollections = filteredCollections.filter((c) => c.scope === 'mine');

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Top Header Bar */}
      <div className="h-14 px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Collections</h1>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono tabular-nums ml-1">
            ({filteredCollections.length})
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
              title="Configure token budgets, overlap windows, and re-indexing"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Admin &amp; Ingestion</span>
            </button>
          )}
          <button
            onClick={onOpenNewCollection}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Collection</span>
          </button>
        </div>
      </div>

      {/* Scope Navigation Bar & Filters */}
      <div className="px-6 pt-4 pb-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shrink-0">
        {/* Scope Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Segmented Control for Scope */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200/80 dark:border-neutral-700">
            <button
              onClick={() => onSelectScope('mine')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedScope === 'mine'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <User className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Mine</span>
            </button>

            <button
              onClick={() => {
                onSelectScope('org');
                setSharedSubFilter('all-shared');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedScope === 'org' || selectedScope === 'team'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Shared</span>
            </button>

            <button
              onClick={() => onSelectScope('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedScope === 'all'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>All</span>
            </button>
          </div>

          {/* If inside Shared scope, show sub-groups toggle */}
          {(selectedScope === 'org' || selectedScope === 'team') && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-neutral-400 dark:text-neutral-500 mr-1 text-[11px]">Sub-group:</span>
              <button
                onClick={() => {
                  onSelectScope('org');
                  setSharedSubFilter('all-shared');
                }}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  sharedSubFilter === 'all-shared'
                    ? 'bg-blue-600 text-white font-medium shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                All Shared
              </button>
              <button
                onClick={() => {
                  onSelectScope('org');
                  setSharedSubFilter('org');
                }}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedScope === 'org' && sharedSubFilter === 'org'
                    ? 'bg-blue-600 text-white font-medium shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Organization
              </button>
              <button
                onClick={() => {
                  onSelectScope('team');
                  setSharedSubFilter('team');
                }}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedScope === 'team'
                    ? 'bg-blue-600 text-white font-medium shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Team
              </button>
            </div>
          )}

          {/* Search & Sort */}
          <div className="flex items-center gap-2.5 ml-auto">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600 w-48"
              />
            </div>

            <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-neutral-700 dark:text-neutral-300 py-1 pr-2 border-0 focus:ring-0 cursor-pointer font-medium"
              >
                <option value="updated" className="dark:bg-neutral-800">Recently Updated</option>
                <option value="name" className="dark:bg-neutral-800">Alphabetical</option>
                <option value="docs" className="dark:bg-neutral-800">Document Count</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Collections Content Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredCollections.length === 0 ? (
          <div className="h-64 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-neutral-900">
            <FolderKanban className="w-10 h-10 text-neutral-400 dark:text-neutral-500 mb-2" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No collections found</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1 mb-4">
              {searchQuery
                ? `No collections matched "${searchQuery}". Try adjusting your search query or scope.`
                : 'No collections in this scope yet. Create a collection to organize ingested documents.'}
            </p>
            <button
              onClick={onOpenNewCollection}
              className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
            >
              Create New Collection
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* If All scope or Shared all-shared, display with clear section hierarchy */}
            {(selectedScope === 'all' || (selectedScope === 'org' && sharedSubFilter === 'all-shared')) ? (
              <>
                {/* Organization Collections Group */}
                {orgCollections.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-neutral-200 dark:border-neutral-800">
                      <Building2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      <h2 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                        Organization Collections
                      </h2>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono tabular-nums">
                        ({orgCollections.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {orgCollections.map((col) => (
                        <CollectionCard
                          key={col.id}
                          collection={col}
                          onSelect={() => onSelectCollection(col.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Collections Group */}
                {teamCollections.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                          Team Collections
                        </h2>
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono tabular-nums">
                          ({teamCollections.length})
                        </span>
                      </div>

                      {teamAllocations && onOpenTeamAllocationModal && (
                        <button
                          type="button"
                          onClick={() => {
                            const targetTeam =
                              teamAllocations.find(
                                (t) =>
                                  t.teamName.toLowerCase() ===
                                  (currentUser?.teamName || '').toLowerCase()
                              ) || teamAllocations[0];
                            if (targetTeam) onOpenTeamAllocationModal(targetTeam);
                          }}
                          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Manage Team Quotas</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {teamCollections.map((col) => (
                        <CollectionCard
                          key={col.id}
                          collection={col}
                          onSelect={() => onSelectCollection(col.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Mine Group (if in All view) */}
                {selectedScope === 'all' && mineCollections.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-neutral-200 dark:border-neutral-800">
                      <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      <h2 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                        Personal Collections (Mine)
                      </h2>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono tabular-nums">
                        ({mineCollections.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {mineCollections.map((col) => (
                        <CollectionCard
                          key={col.id}
                          collection={col}
                          onSelect={() => onSelectCollection(col.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : selectedScope === 'team' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                      Team Collections ({filteredCollections.length})
                    </h2>
                  </div>

                  {teamAllocations && onOpenTeamAllocationModal && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetTeam =
                          teamAllocations.find(
                            (t) =>
                              t.teamName.toLowerCase() ===
                              (currentUser?.teamName || '').toLowerCase()
                          ) || teamAllocations[0];
                        if (targetTeam) onOpenTeamAllocationModal(targetTeam);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Manage Team Quotas</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCollections.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      onSelect={() => onSelectCollection(col.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Flat grid for Mine or Org-only views */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCollections.map((col) => (
                  <CollectionCard
                    key={col.id}
                    collection={col}
                    onSelect={() => onSelectCollection(col.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CollectionCard: React.FC<{
  collection: Collection;
  onSelect: () => void;
}> = ({ collection, onSelect }) => {
  const formattedDate = new Date(collection.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const scopeLabel =
    collection.scope === 'mine'
      ? 'Personal'
      : collection.scope === 'org'
      ? 'Enterprise'
      : collection.teamName || 'Team';

  return (
    <div
      onClick={onSelect}
      className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Scope, Owner, and Quota badge */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 mb-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-medium text-neutral-600 dark:text-neutral-300">{scopeLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{collection.createdBy.name}</span>
          </div>

          <span className="shrink-0 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-semibold border border-blue-100 dark:border-blue-900/60">
            {collection.allocatedGb || 10} GB Quota
          </span>
        </div>

        {/* Collection Title */}
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
          {collection.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
          {collection.description}
        </p>
      </div>

      {/* Footer Metrics & Metadata */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums">
          <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
            <FileText className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
            {collection.documentCount} docs
          </span>
          <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
          <span>{collection.totalChunks} chunks</span>
        </div>

        <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
          {formattedDate}
        </div>
      </div>
    </div>
  );
};
