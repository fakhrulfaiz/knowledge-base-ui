import React, { useState } from 'react';
import {
  X,
  Users,
  HardDrive,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
  Plus,
  Trash2
} from 'lucide-react';
import { Collection, DocumentItem, TeamAllocationRecord, UserProfile } from '../types';
import { formatBytes, getTeamUsedBytes, getCollectionUsedBytes } from '../utils/resourceUtils';

interface TeamAllocationModalProps {
  teamRecord: TeamAllocationRecord;
  collections: Collection[];
  documents: DocumentItem[];
  currentUser: UserProfile;
  onClose: () => void;
  onSaveAllocations: (updatedRecord: TeamAllocationRecord) => void;
}

export const TeamAllocationModal: React.FC<TeamAllocationModalProps> = ({
  teamRecord,
  collections,
  documents,
  currentUser,
  onClose,
  onSaveAllocations,
}) => {
  // Local editable state for collection allocations
  const [allocations, setAllocations] = useState<
    { collectionId: string; collectionName: string; allocatedGb: number }[]
  >(() => {
    // Merge existing allocations with any team collections that might not have an entry yet
    const teamCols = collections.filter(
      (c) => c.scope === 'team' && c.teamName?.toLowerCase() === teamRecord.teamName.toLowerCase()
    );

    const existingMap = new Map(teamRecord.collectionAllocations.map((a) => [a.collectionId, a]));
    const list = [...teamRecord.collectionAllocations];

    teamCols.forEach((col) => {
      if (!existingMap.has(col.id)) {
        list.push({
          collectionId: col.id,
          collectionName: col.name,
          allocatedGb: col.allocatedGb || 10,
        });
      }
    });

    return list;
  });

  const [newColName, setNewColName] = useState('');
  const [newColGb, setNewColGb] = useState<number>(10);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check user authorization
  const canManage =
    currentUser.systemRole === 'owner' ||
    currentUser.systemRole === 'admin' ||
    currentUser.systemRole === 'team_lead' ||
    currentUser.isTeamLeader;

  const totalTeamCapGb = teamRecord.allocatedGb;
  const currentTotalAllocatedGb = allocations.reduce((acc, a) => acc + (Number(a.allocatedGb) || 0), 0);
  const unallocatedBufferGb = totalTeamCapGb - currentTotalAllocatedGb;
  const isOverAllocated = unallocatedBufferGb < 0;

  const teamUsedBytes = getTeamUsedBytes(teamRecord.teamName, documents, collections);

  const handleAllocationChange = (collectionId: string, val: number) => {
    const clamped = Math.max(0, Math.min(totalTeamCapGb * 2, val));
    setAllocations((prev) =>
      prev.map((item) => (item.collectionId === collectionId ? { ...item, allocatedGb: clamped } : item))
    );
  };

  const handleAddCustomAllocation = () => {
    if (!newColName.trim()) return;
    const newEntry = {
      collectionId: `col-custom-${Date.now()}`,
      collectionName: newColName.trim(),
      allocatedGb: Math.max(1, newColGb),
    };
    setAllocations((prev) => [...prev, newEntry]);
    setNewColName('');
    setNewColGb(10);
    setShowAddCustom(false);
  };

  const handleRemoveAllocation = (collectionId: string) => {
    setAllocations((prev) => prev.filter((a) => a.collectionId !== collectionId));
  };

  const handleSave = () => {
    const updated: TeamAllocationRecord = {
      ...teamRecord,
      collectionAllocations: allocations,
    };
    onSaveAllocations(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Team Resource Allocation
                </h2>
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-semibold border border-blue-200 dark:border-blue-900/60">
                  {teamRecord.teamName}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Team Leader: <span className="text-neutral-700 dark:text-neutral-300 font-medium">{teamRecord.teamLeader.name}</span> · Managed by Team Leader
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Permission Notice */}
          {!canManage && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Read-only mode. Only designated Team Leaders, Admins, or Workspace Owners can modify resource quotas for this team.
              </span>
            </div>
          )}

          {/* Quota Summary Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Budget From Admin */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                Admin Allocated Quota
              </div>
              <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                {totalTeamCapGb} <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">GB</span>
              </div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                Global pool granted by IT admin
              </div>
            </div>

            {/* Distributed to Collections */}
            <div className={`p-3.5 rounded-lg border ${isOverAllocated ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50' : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700'}`}>
              <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                Assigned to Collections
              </div>
              <div className={`text-xl font-bold font-mono mt-1 ${isOverAllocated ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                {currentTotalAllocatedGb} <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">GB</span>
              </div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                {allocations.length} collection allocation target(s)
              </div>
            </div>

            {/* Buffer Reserve */}
            <div className={`p-3.5 rounded-lg border ${isOverAllocated ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50' : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50'}`}>
              <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                Unallocated Team Buffer
              </div>
              <div className={`text-xl font-bold font-mono mt-1 ${isOverAllocated ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {unallocatedBufferGb} <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">GB</span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                {isOverAllocated ? 'Over-allocated quota!' : 'Available for new projects'}
              </div>
            </div>
          </div>

          {/* Allocation Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Team Quota Utilization &amp; Distribution</span>
              <span className="font-mono text-neutral-500 dark:text-neutral-400">
                {currentTotalAllocatedGb} / {totalTeamCapGb} GB ({Math.round((currentTotalAllocatedGb / Math.max(1, totalTeamCapGb)) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex border border-neutral-200 dark:border-neutral-700">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverAllocated ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{
                  width: `${Math.min(100, (currentTotalAllocatedGb / Math.max(1, totalTeamCapGb)) * 100)}%`,
                }}
              />
            </div>
            {isOverAllocated && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Total collection allocations exceed team quota by {Math.abs(unallocatedBufferGb)} GB. Please rebalance before saving.</span>
              </div>
            )}
          </div>

          {/* Collection Distribution List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Collection Quota Distribution
              </h3>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Reserve Collection Quota</span>
                </button>
              )}
            </div>

            {/* Optional Custom Target Creator */}
            {showAddCustom && (
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-lg space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-semibold text-blue-900 dark:text-blue-200">Reserve New Collection or Project Quota</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Microservices &amp; gRPC Docs"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max={totalTeamCapGb}
                      value={newColGb}
                      onChange={(e) => setNewColGb(Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-right focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">GB</span>
                    <button
                      type="button"
                      onClick={handleAddCustomAllocation}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer ml-auto"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List of Collections and their allocated GB */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
              {allocations.map((alloc) => {
                const targetCol = collections.find((c) => c.id === alloc.collectionId);
                const colUsed = targetCol ? getCollectionUsedBytes(targetCol.id, documents) : 0;

                return (
                  <div key={alloc.collectionId} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {alloc.collectionName}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <span>Used: <strong className="font-mono text-neutral-700 dark:text-neutral-300">{formatBytes(colUsed)}</strong></span>
                        <span>·</span>
                        <span>{targetCol?.documentCount || 0} docs</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Quick preset buttons */}
                      {canManage && (
                        <div className="hidden sm:flex items-center gap-1">
                          {[15, 25, 40, 50].map((presetVal) => (
                            <button
                              key={presetVal}
                              type="button"
                              onClick={() => handleAllocationChange(alloc.collectionId, presetVal)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                                alloc.allocatedGb === presetVal
                                  ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                              }`}
                            >
                              {presetVal}G
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Number Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={totalTeamCapGb}
                          disabled={!canManage}
                          value={alloc.allocatedGb}
                          onChange={(e) => handleAllocationChange(alloc.collectionId, Number(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-right font-mono text-xs border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                        />
                        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 font-medium">GB</span>
                      </div>

                      {canManage && allocations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAllocation(alloc.collectionId)}
                          title="Remove allocation target"
                          className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Guidance */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
            <Info className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Team Leader Authority:</strong> As the team leader of <em>{teamRecord.teamName}</em>, you have autonomous control over how your team's {totalTeamCapGb} GB allocation is shared across internal research, architecture runbooks, and compliance archives. If your team requires more capacity, contact the Workspace IT Admin to increase the base team quota.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {saveSuccess ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Team allocations updated successfully!
              </span>
            ) : (
              <span>Unallocated Buffer: <strong className="font-mono text-neutral-700 dark:text-neutral-300">{unallocatedBufferGb} GB</strong></span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-md text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canManage || isOverAllocated}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <span>Save Team Allocations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
