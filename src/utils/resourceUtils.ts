import { Collection, DocumentItem, ScopeResourceAllocation, TeamAllocationRecord } from '../types';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(i >= 3 ? 2 : 1));
  return `${val} ${sizes[i]}`;
}

export function bytesToGb(bytes: number): number {
  return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(3));
}

export function gbToBytes(gb: number): number {
  return Math.round(gb * 1024 * 1024 * 1024);
}

export function getCollectionUsedBytes(collectionId: string, documents: DocumentItem[]): number {
  return documents
    .filter((d) => d.collectionId === collectionId)
    .reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
}

export function getScopeUsedBytes(scope: 'mine' | 'team' | 'org', documents: DocumentItem[], collections: Collection[]): number {
  const colIdsInScope = new Set(collections.filter((c) => c.scope === scope).map((c) => c.id));
  return documents
    .filter((d) => colIdsInScope.has(d.collectionId))
    .reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
}

export function getTeamUsedBytes(teamName: string, documents: DocumentItem[], collections: Collection[]): number {
  const teamColIds = new Set(
    collections.filter((c) => c.scope === 'team' && c.teamName?.toLowerCase() === teamName.toLowerCase()).map((c) => c.id)
  );
  return documents
    .filter((d) => teamColIds.has(d.collectionId))
    .reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
}

export function getTotalSystemUsedBytes(documents: DocumentItem[]): number {
  return documents.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
}

export interface QuotaCheckResult {
  allowed: boolean;
  remainingBytes: number;
  allocatedGb: number;
  currentUsedBytes: number;
  projectedUsedBytes: number;
  reason?: string;
}

export function checkCollectionQuota(
  collection: Collection,
  additionalBytes: number,
  documents: DocumentItem[],
  scopeAllocation: ScopeResourceAllocation,
  teamAllocations: TeamAllocationRecord[]
): QuotaCheckResult {
  const currentUsedBytes = getCollectionUsedBytes(collection.id, documents);
  const projectedUsedBytes = currentUsedBytes + additionalBytes;

  // Determine effective allocated GB for this collection
  let effectiveAllocatedGb = collection.allocatedGb || 0;

  if (collection.scope === 'mine') {
    // If not specifically set on collection, falls back to personal per-user cap
    effectiveAllocatedGb = collection.allocatedGb || scopeAllocation.personalPerUserCapGb;
  } else if (collection.scope === 'team') {
    // Check team allocations
    const teamRecord = teamAllocations.find(
      (t) => t.teamName.toLowerCase() === (collection.teamName || '').toLowerCase()
    );
    const colAlloc = teamRecord?.collectionAllocations.find((c) => c.collectionId === collection.id);
    if (colAlloc) {
      effectiveAllocatedGb = colAlloc.allocatedGb;
    } else if (teamRecord) {
      effectiveAllocatedGb = collection.allocatedGb || Math.floor(teamRecord.allocatedGb / 2);
    } else {
      effectiveAllocatedGb = collection.allocatedGb || 20;
    }
  } else if (collection.scope === 'org') {
    effectiveAllocatedGb = collection.allocatedGb || scopeAllocation.orgPoolQuotaGb;
  }

  const allocatedBytes = gbToBytes(effectiveAllocatedGb);
  const remainingBytes = Math.max(0, allocatedBytes - currentUsedBytes);
  const allowed = projectedUsedBytes <= allocatedBytes;

  return {
    allowed,
    remainingBytes,
    allocatedGb: effectiveAllocatedGb,
    currentUsedBytes,
    projectedUsedBytes,
    reason: allowed
      ? undefined
      : `Operation requires ${formatBytes(additionalBytes)}, but collection quota is capped at ${effectiveAllocatedGb} GB (${formatBytes(remainingBytes)} remaining).`,
  };
}
