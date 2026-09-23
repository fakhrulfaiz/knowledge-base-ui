import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  Network,
  Upload,
  HardDrive,
  Search,
  Trash2,
  ExternalLink,
  ChevronRight,
  Bookmark,
  Share2,
  ArrowRight,
  LayoutList,
  LayoutGrid,
  Sliders
} from 'lucide-react';
import { Collection, DocumentItem, TeamAllocationRecord, UserProfile } from '../types';
import { computeDocumentGraph } from '../utils/retrieval';
import { DocumentGridCardPreview } from './PdfPageRaster';
import { formatBytes, getCollectionUsedBytes } from '../utils/resourceUtils';

interface CollectionDetailViewProps {
  collection: Collection;
  documents: DocumentItem[];
  currentUser?: UserProfile;
  teamAllocations?: TeamAllocationRecord[];
  onOpenTeamAllocationModal?: (teamRecord: TeamAllocationRecord) => void;
  onBack: () => void;
  onOpenUploadModal: () => void;
  onOpenDriveModal: () => void;
  onOpenDocument: (doc: DocumentItem, pageNumber?: number, chunkId?: string) => void;
  onDeleteDocument: (docId: string) => void;
}

export const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({
  collection,
  documents,
  currentUser,
  teamAllocations,
  onOpenTeamAllocationModal,
  onBack,
  onOpenUploadModal,
  onOpenDriveModal,
  onOpenDocument,
  onDeleteDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'documents' | 'graph'>('documents');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Documents in this collection
  const collectionDocs = useMemo(() => {
    return documents.filter((doc) => doc.collectionId === collection.id);
  }, [documents, collection.id]);

  const usedBytes = getCollectionUsedBytes(collection.id, documents);
  const allocatedGb = collection.allocatedGb || (collection.scope === 'mine' ? 5 : 20);
  const allocatedBytes = allocatedGb * 1024 * 1024 * 1024;
  const usedPercent = Math.min(100, Math.round((usedBytes / Math.max(1, allocatedBytes)) * 100));

  const targetTeam = teamAllocations?.find(
    (t) => t.teamName.toLowerCase() === (collection.teamName || '').toLowerCase()
  );

  const filteredDocs = useMemo(() => {
    if (!docSearchQuery.trim()) return collectionDocs;
    const q = docSearchQuery.toLowerCase();
    return collectionDocs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.entities.some((e) => e.toLowerCase().includes(q))
    );
  }, [collectionDocs, docSearchQuery]);

  // Compute document relations
  const { nodes, edges } = useMemo(() => {
    return computeDocumentGraph(collectionDocs, 'combined', 0.15);
  }, [collectionDocs]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const scopeLabel =
    collection.scope === 'mine'
      ? 'My Collections'
      : collection.scope === 'org'
      ? 'Organization'
      : `Team (${collection.teamName || 'Engineering'})`;

  // Focus on the first document if none selected in relationship tab
  const activeFocusDoc =
    collectionDocs.find((d) => d.id === selectedDocId) || collectionDocs[0] || null;

  // Find connections for the focused document
  const relatedEdges = useMemo(() => {
    if (!activeFocusDoc) return [];
    return edges.filter(
      (e) => e.source === activeFocusDoc.id || e.target === activeFocusDoc.id
    );
  }, [activeFocusDoc, edges]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Top Header Bar */}
      <div className="h-14 px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Collections</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-700" />
          <span className="text-neutral-400 dark:text-neutral-500">{scopeLabel}</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-700" />
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-xs">{collection.name}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDriveModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>Import from Drive</span>
          </button>

          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Collection Header */}
      <div className="px-6 py-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {collection.name}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              {collection.description}
            </p>

            <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 mt-2">
              <span>{collectionDocs.length} documents</span>
              <span>·</span>
              <span>Created by {collection.createdBy.name}</span>
            </div>

            {/* Storage Quota Bar */}
            <div className="mt-3 flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Storage Quota:</span>
                </span>
                <span className="font-mono text-neutral-600 dark:text-neutral-400">
                  <strong className="text-neutral-900 dark:text-neutral-100">{formatBytes(usedBytes)}</strong> / {allocatedGb} GB used ({usedPercent}%)
                </span>
              </div>

              <div className="w-28 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-600">
                <div
                  className={`h-full transition-all duration-300 ${
                    usedPercent > 90 ? 'bg-rose-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.max(2, usedPercent)}%` }}
                />
              </div>

              {collection.scope === 'team' && targetTeam && onOpenTeamAllocationModal && (
                <button
                  type="button"
                  onClick={() => onOpenTeamAllocationModal(targetTeam)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-auto cursor-pointer"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Manage Team Quotas ({targetTeam.teamName})</span>
                </button>
              )}
            </div>
          </div>

          {/* Simple Tab Switcher */}
          <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shrink-0">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Documents ({collectionDocs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'graph'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Related Documents</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'documents' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar & View Mode Switcher inside collection */}
          <div className="px-6 py-2.5 bg-neutral-100/70 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter documents..."
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-500 w-64"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-neutral-400 dark:text-neutral-500">
                {filteredDocs.length} items
              </div>

              {/* List / Grid (Raster Preview) Switcher */}
              <div className="flex items-center p-0.5 bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium'
                      : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title="Table List View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium'
                      : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title="Grid View (PDF Page Previews)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Document Content: List Table or PDF Raster Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredDocs.length === 0 ? (
              <div className="h-60 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-neutral-900">
                <FileText className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No documents in this collection</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1 mb-4">
                  Add files to this collection to enable semantic search and cross-referencing.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenUploadModal}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    Upload Document
                  </button>
                  <button
                    onClick={onOpenDriveModal}
                    className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer"
                  >
                    Import from Drive
                  </button>
                </div>
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
                    <tr>
                      <th className="py-2.5 px-4">Title</th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3 text-right">Pages</th>
                      <th className="py-2.5 px-3 text-right">Size</th>
                      <th className="py-2.5 px-3">Uploaded</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                        onClick={() => onOpenDocument(doc, 1)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2.5">
                            <span className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-mono text-[10px] uppercase font-semibold mt-0.5">
                              {doc.fileType}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                {doc.title}
                              </div>
                              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5">
                                {doc.summary}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                          {doc.source === 'drive' ? 'Drive' : 'Upload'}
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-300">
                          {doc.pageCount}
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                          {formatBytes(doc.sizeBytes)}
                        </td>

                        <td className="py-3 px-3 text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                          {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onOpenDocument(doc, 1)}
                              className="px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>Read</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => onDeleteDocument(doc.id)}
                              className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid View with PDF Raster Page Previews */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocs.map((doc) => {
                  const firstPageText = doc.pages[0]?.chunks[0]?.snippet || doc.summary;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => onOpenDocument(doc, 1)}
                      className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group overflow-hidden"
                    >
                      {/* Miniature Raster Page 1 Preview */}
                      <DocumentGridCardPreview
                        title={doc.title}
                        fileType={doc.fileType}
                        pageCount={doc.pageCount}
                        firstPageSnippet={firstPageText}
                      />

                      {/* Card Content Footer */}
                      <div className="p-3.5 space-y-2 bg-white dark:bg-neutral-900 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 mb-1">
                            <span className="font-mono">{doc.fileType.toUpperCase()}</span>
                            <span>{formatBytes(doc.sizeBytes)}</span>
                          </div>
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                            {doc.title}
                          </h4>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                            {doc.summary}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                            {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
                          </span>
                          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 flex items-center gap-1">
                            <span>Open PDF</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Related Documents View: Clean, intuitive visual connection */
        <div className="flex-1 flex overflow-hidden bg-neutral-50 dark:bg-neutral-950">
          {/* Document list on left */}
          <div className="w-80 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Select Document to Inspect Connections
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {collectionDocs.map((doc) => {
                const isSelected = activeFocusDoc?.id === doc.id;
                const docConnectionsCount = edges.filter(
                  (e) => e.source === doc.id || e.target === doc.id
                ).length;

                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div className="font-semibold line-clamp-1">{doc.title}</div>
                    <div
                      className={`text-[11px] mt-1 flex items-center justify-between ${
                        isSelected ? 'text-blue-100' : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      <span>{doc.pageCount} pages</span>
                      <span>{docConnectionsCount} connections</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Connections Details */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeFocusDoc ? (
              <div>
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
                      Currently Focused Document
                    </span>
                    <button
                      onClick={() => onOpenDocument(activeFocusDoc, 1)}
                      className="flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
                    >
                      <span>Open Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {activeFocusDoc.title}
                  </h2>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {activeFocusDoc.summary}
                  </p>
                  {activeFocusDoc.entities.length > 0 && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-1.5">
                      {activeFocusDoc.entities.map((e, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px]"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Connected Documents List */}
                <div className="mt-6 space-y-3">
                  <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Connected Documents in Collection ({relatedEdges.length})
                  </h3>

                  {relatedEdges.length === 0 ? (
                    <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-center text-xs text-neutral-400 dark:text-neutral-500">
                      No strong direct correlations found for this document yet. Add more related files to establish cross-references.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {relatedEdges.map((edge, i) => {
                        const targetId =
                          edge.source === activeFocusDoc.id ? edge.target : edge.source;
                        const targetDoc = collectionDocs.find((d) => d.id === targetId);
                        if (!targetDoc) return null;

                        return (
                          <div
                            key={i}
                            className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 mb-1">
                                <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                                  {Math.round(edge.weight * 100)}% relationship match
                                </span>
                                <span className="uppercase text-[10px] font-mono">
                                  {edge.type}
                                </span>
                              </div>

                              <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1 mb-1.5">
                                {targetDoc.title}
                              </h4>

                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded border border-neutral-100 dark:border-neutral-800 mb-2">
                                {edge.reasons[0] || 'Shared architecture & technical scope'}
                              </div>
                            </div>

                            <button
                              onClick={() => onOpenDocument(targetDoc, 1)}
                              className="mt-2 flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium pt-2 border-t border-neutral-100 dark:border-neutral-800 cursor-pointer"
                            >
                              <span>Read Connected Doc</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-neutral-400 dark:text-neutral-500 text-xs py-12">
                No documents found in this collection.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
