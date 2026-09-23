/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Collection, DocumentItem, IngestionConfig, ReindexJob, ScopeResourceAllocation, ScopeType, SystemRole, TeamAllocationRecord, UserProfile } from './types';
import { CURRENT_USER, DEFAULT_RESOURCE_ALLOCATION, INITIAL_COLLECTIONS, INITIAL_DOCUMENTS, INITIAL_TEAM_ALLOCATIONS, PRESET_USERS } from './data/mockData';
import { DEFAULT_INGESTION_CONFIG, reindexDocument } from './utils/chunker';
import { checkCollectionQuota } from './utils/resourceUtils';
import { Sidebar } from './components/Sidebar';
import { CollectionsView } from './components/CollectionsView';
import { CollectionDetailView } from './components/CollectionDetailView';
import { SearchView } from './components/SearchView';
import { AdminView } from './components/AdminView';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { DrivePickerModal } from './components/DrivePickerModal';
import { UploadModal } from './components/UploadModal';
import { NewCollectionModal } from './components/NewCollectionModal';
import { TeamAllocationModal } from './components/TeamAllocationModal';
import { CheckCircle2 } from 'lucide-react';

const INITIAL_REINDEX_JOBS: ReindexJob[] = [
  {
    id: 'job-init-1',
    timestamp: '2026-09-23T04:15:00Z',
    targetScope: 'all',
    targetName: 'All Collections (Global)',
    triggeredBy: 'Elena Rostova (owner)',
    chunkSizeTokens: 256,
    chunkOverlapTokens: 32,
    strategy: 'paragraph_boundary',
    docsCount: 12,
    chunksBefore: 68,
    chunksAfter: 76,
    durationMs: 820,
    status: 'completed',
  },
  {
    id: 'job-init-2',
    timestamp: '2026-09-20T11:30:00Z',
    targetScope: 'col-org-1',
    targetName: 'Enterprise Zero Trust & Identity Standards',
    triggeredBy: 'Security Architecture Council (admin)',
    chunkSizeTokens: 180,
    chunkOverlapTokens: 24,
    strategy: 'paragraph_boundary',
    docsCount: 3,
    chunksBefore: 20,
    chunksAfter: 22,
    durationMs: 340,
    status: 'completed',
  }
];

export default function App() {
  // Navigation State
  const [activeView, setActiveView] = useState<'collections' | 'search' | 'admin'>('collections');
  const [selectedScope, setSelectedScope] = useState<ScopeType>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // User State with RBAC role
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);

  // Admin Ingestion & Governance Settings State
  const [ingestionConfig, setIngestionConfig] = useState<IngestionConfig>(DEFAULT_INGESTION_CONFIG);
  const [reindexHistory, setReindexHistory] = useState<ReindexJob[]>(INITIAL_REINDEX_JOBS);

  // Storage Resource Allocations (GB Quotas)
  const [scopeResourceAllocation, setScopeResourceAllocation] = useState<ScopeResourceAllocation>(DEFAULT_RESOURCE_ALLOCATION);
  const [teamAllocations, setTeamAllocations] = useState<TeamAllocationRecord[]>(INITIAL_TEAM_ALLOCATIONS);
  const [activeTeamModalRecord, setActiveTeamModalRecord] = useState<TeamAllocationRecord | null>(null);

  // Data State
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);

  // Modal States
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_dark_mode');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexus_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexus_dark_mode', 'false');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Document Viewer Modal with Deep Link Target State
  const [viewingDocState, setViewingDocState] = useState<{
    doc: DocumentItem;
    page?: number;
    chunkId?: string;
  } | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  // User Role Switcher with Persona synchronization
  const handleSwitchUserRole = (newRole: SystemRole) => {
    const preset = PRESET_USERS.find((u) => u.systemRole === newRole);
    if (preset) {
      setCurrentUser(preset);
      showToast(`Switched active user to ${preset.name} (${newRole.toUpperCase()}).`);
    } else {
      setCurrentUser((prev) => ({ ...prev, systemRole: newRole }));
      showToast(`Switched active user role to "${newRole.toUpperCase()}".`);
    }
  };

  // Team Resource Allocation Handler
  const handleUpdateTeamAllocation = (updatedRecord: TeamAllocationRecord) => {
    setTeamAllocations((prev) =>
      prev.map((t) => (t.teamId === updatedRecord.teamId ? updatedRecord : t))
    );

    // Sync collection allocatedGb
    setCollections((prevCols) =>
      prevCols.map((col) => {
        const matchingAlloc = updatedRecord.collectionAllocations.find((a) => a.collectionId === col.id);
        if (matchingAlloc) {
          return { ...col, allocatedGb: matchingAlloc.allocatedGb };
        }
        return col;
      })
    );

    showToast(`Storage quotas updated for team: ${updatedRecord.teamName}.`);
  };

  // Actions
  const handleCreateCollection = (newCol: Collection) => {
    setCollections((prev) => [newCol, ...prev]);
    setSelectedCollectionId(newCol.id);
    setActiveView('collections');
    showToast(`Collection "${newCol.name}" created successfully.`);
  };

  const handleDriveImportComplete = (newDocs: DocumentItem[]): boolean => {
    if (selectedCollectionId) {
      const targetCol = collections.find((c) => c.id === selectedCollectionId);
      if (targetCol) {
        const totalIncomingBytes = newDocs.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
        const quotaCheck = checkCollectionQuota(
          targetCol,
          totalIncomingBytes,
          documents,
          scopeResourceAllocation,
          teamAllocations
        );

        if (!quotaCheck.allowed) {
          showToast(`⚠️ Storage Quota Exceeded: ${quotaCheck.reason || 'Operation blocked by quota limits.'}`);
          return false;
        }
      }
    }

    setDocuments((prev) => [...newDocs, ...prev]);
    if (selectedCollectionId) {
      const addedChunks = newDocs.reduce((acc, d) => acc + d.chunkCount, 0);
      setCollections((prev) =>
        prev.map((c) =>
          c.id === selectedCollectionId
            ? {
                ...c,
                documentCount: c.documentCount + newDocs.length,
                totalChunks: c.totalChunks + addedChunks,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    }
    showToast(`Ingested ${newDocs.length} document(s) from Drive with ${ingestionConfig.maxChunkSizeTokens}t chunks.`);
    return true;
  };

  const handleUploadComplete = (newDoc: DocumentItem): boolean => {
    if (selectedCollectionId) {
      const targetCol = collections.find((c) => c.id === selectedCollectionId);
      if (targetCol) {
        const quotaCheck = checkCollectionQuota(
          targetCol,
          newDoc.sizeBytes || 0,
          documents,
          scopeResourceAllocation,
          teamAllocations
        );

        if (!quotaCheck.allowed) {
          showToast(`⚠️ Storage Quota Exceeded: ${quotaCheck.reason || 'Upload blocked by storage limits.'}`);
          return false;
        }
      }
    }

    setDocuments((prev) => [newDoc, ...prev]);
    if (selectedCollectionId) {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === selectedCollectionId
            ? {
                ...c,
                documentCount: c.documentCount + 1,
                totalChunks: c.totalChunks + newDoc.chunkCount,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    }
    showToast(`Document "${newDoc.title}" extracted and ingested with active token window.`);
    return true;
  };

  const handleDeleteDocument = (docId: string) => {
    const docToDelete = documents.find((d) => d.id === docId);
    if (!docToDelete) return;

    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setCollections((prev) =>
      prev.map((c) =>
        c.id === docToDelete.collectionId
          ? {
              ...c,
              documentCount: Math.max(0, c.documentCount - 1),
              totalChunks: Math.max(0, c.totalChunks - docToDelete.chunkCount),
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    showToast(`Document removed from collection.`);
  };

  // Re-indexing Engine execution
  const handleTriggerReindex = async (targetScope: 'all' | string): Promise<ReindexJob> => {
    const startTime = Date.now();
    const targetDocs =
      targetScope === 'all'
        ? documents
        : documents.filter((d) => d.collectionId === targetScope);

    const targetName =
      targetScope === 'all'
        ? 'All Collections (Global)'
        : collections.find((c) => c.id === targetScope)?.name || 'Specified Collection';

    const chunksBefore = targetDocs.reduce((acc, d) => acc + d.chunkCount, 0);

    // Re-chunk every target document with current ingestionConfig
    const updatedTargetDocs = targetDocs.map((doc) => reindexDocument(doc, ingestionConfig));
    const updatedDocMap = new Map(updatedTargetDocs.map((d) => [d.id, d]));

    const nextDocuments = documents.map((d) => updatedDocMap.get(d.id) || d);
    setDocuments(nextDocuments);

    // Recompute total chunk counts for affected collections
    setCollections((prevCols) =>
      prevCols.map((col) => {
        const colDocs = nextDocuments.filter((d) => d.collectionId === col.id);
        const totalChunks = colDocs.reduce((acc, d) => acc + d.chunkCount, 0);
        return {
          ...col,
          documentCount: colDocs.length,
          totalChunks,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const chunksAfter = updatedTargetDocs.reduce((acc, d) => acc + d.chunkCount, 0);
    const durationMs = Date.now() - startTime + 520;

    const newJob: ReindexJob = {
      id: `job-${Date.now()}`,
      timestamp: new Date().toISOString(),
      targetScope,
      targetName,
      triggeredBy: `${currentUser.name} (${currentUser.systemRole})`,
      chunkSizeTokens: ingestionConfig.maxChunkSizeTokens,
      chunkOverlapTokens: ingestionConfig.chunkOverlapTokens,
      strategy: ingestionConfig.chunkingStrategy,
      docsCount: targetDocs.length,
      chunksBefore,
      chunksAfter,
      durationMs,
      status: 'completed',
    };

    setReindexHistory((prev) => [newJob, ...prev]);
    showToast(
      `Re-indexed ${targetDocs.length} doc(s): generated ${chunksAfter} chunks (${chunksAfter - chunksBefore >= 0 ? '+' : ''}${chunksAfter - chunksBefore}).`
    );

    return newJob;
  };

  const handleOpenDocument = (doc: DocumentItem, pageNumber?: number) => {
    setViewingDocState({
      doc,
      page: pageNumber,
    });
  };

  const handleOpenCitation = (doc: DocumentItem, pageNumber: number, chunkId: string) => {
    setViewingDocState({
      doc,
      page: pageNumber,
      chunkId,
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans antialiased transition-colors">
      {/* Left-Hand Vertical Rail Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          setSelectedCollectionId(null);
        }}
        selectedScope={selectedScope}
        onSelectScope={(s) => {
          setSelectedScope(s);
          setSelectedCollectionId(null);
          setActiveView('collections');
        }}
        selectedCollectionId={selectedCollectionId}
        onSelectCollection={(id) => {
          setSelectedCollectionId(id);
          if (id) {
            setActiveView('collections');
          }
        }}
        collections={collections}
        documents={documents}
        scopeResourceAllocation={scopeResourceAllocation}
        onOpenNewCollection={() => setIsNewCollectionOpen(true)}
        currentUser={currentUser}
        onChangeUserRole={handleSwitchUserRole}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Content Area (Updates on the right) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {activeView === 'admin' ? (
          <AdminView
            currentUser={currentUser}
            onChangeUserRole={handleSwitchUserRole}
            collections={collections}
            documents={documents}
            ingestionConfig={ingestionConfig}
            onUpdateIngestionConfig={(newConfig) => {
              setIngestionConfig(newConfig);
              showToast(`Ingestion settings saved: ${newConfig.maxChunkSizeTokens}t / ${newConfig.chunkOverlapTokens}t.`);
            }}
            onTriggerReindex={handleTriggerReindex}
            reindexHistory={reindexHistory}
            scopeResourceAllocation={scopeResourceAllocation}
            onUpdateScopeResourceAllocation={(newAlloc) => {
              setScopeResourceAllocation(newAlloc);
              showToast("Scope quotas updated successfully.");
            }}
            teamAllocations={teamAllocations}
            onUpdateTeamAllocation={handleUpdateTeamAllocation}
            onOpenTeamAllocationModal={(team) => setActiveTeamModalRecord(team)}
          />
        ) : activeView === 'search' ? (
          <SearchView
            documents={documents}
            collections={collections}
            onOpenCitation={handleOpenCitation}
          />
        ) : selectedCollection ? (
          <CollectionDetailView
            collection={selectedCollection}
            documents={documents}
            currentUser={currentUser}
            teamAllocations={teamAllocations}
            onOpenTeamAllocationModal={(team) => setActiveTeamModalRecord(team)}
            onBack={() => setSelectedCollectionId(null)}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
            onOpenDocument={handleOpenDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        ) : (
          <CollectionsView
            collections={collections}
            selectedScope={selectedScope}
            onSelectScope={setSelectedScope}
            onSelectCollection={(id) => setSelectedCollectionId(id)}
            onOpenNewCollection={() => setIsNewCollectionOpen(true)}
            onOpenAdmin={() => {
              setSelectedCollectionId(null);
              setActiveView('admin');
            }}
            currentUser={currentUser}
            teamAllocations={teamAllocations}
            onOpenTeamAllocationModal={(team) => setActiveTeamModalRecord(team)}
          />
        )}

        {/* Global Floating Toast */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white text-xs px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-neutral-700 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>

      {/* Modals */}
      {/* 1. New Collection Modal */}
      {isNewCollectionOpen && (
        <NewCollectionModal
          currentUser={currentUser}
          onClose={() => setIsNewCollectionOpen(false)}
          onCreate={handleCreateCollection}
        />
      )}

      {/* 2. Drive Picker Modal (Ingestion) */}
      {isDriveModalOpen && selectedCollection && (
        <DrivePickerModal
          collection={selectedCollection}
          existingDocTitles={documents
            .filter((d) => d.collectionId === selectedCollection.id)
            .map((d) => d.title)}
          ingestionConfig={ingestionConfig}
          onClose={() => setIsDriveModalOpen(false)}
          onImportComplete={handleDriveImportComplete}
        />
      )}

      {/* 3. Direct Upload Modal (Ingestion) */}
      {isUploadModalOpen && selectedCollection && (
        <UploadModal
          collection={selectedCollection}
          ingestionConfig={ingestionConfig}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* 4. Deep-Linking Document Viewer Modal */}
      {viewingDocState && (
        <DocumentViewerModal
          document={viewingDocState.doc}
          initialPage={viewingDocState.page}
          initialChunkId={viewingDocState.chunkId}
          onClose={() => setViewingDocState(null)}
        />
      )}

      {/* 5. Team Resource Allocation Modal */}
      {activeTeamModalRecord && (
        <TeamAllocationModal
          teamRecord={activeTeamModalRecord}
          collections={collections}
          documents={documents}
          currentUser={currentUser}
          onClose={() => setActiveTeamModalRecord(null)}
          onSaveAllocations={(updatedRecord) => {
            handleUpdateTeamAllocation(updatedRecord);
          }}
        />
      )}
    </div>
  );
}
