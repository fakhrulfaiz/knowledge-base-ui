import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Target,
  Copy,
  Check,
  Info,
  Layers,
  FileText,
  RotateCcw,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { DocumentItem } from '../types';
import { PdfPageThumbnail } from './PdfPageRaster';

interface DocumentViewerModalProps {
  document: DocumentItem;
  initialPage?: number;
  initialChunkId?: string;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  initialPage = 1,
  initialChunkId,
  onClose,
}) => {
  const [currentPageNum, setCurrentPageNum] = useState<number>(initialPage);
  const [activeChunkId, setActiveChunkId] = useState<string | undefined>(initialChunkId);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [viewMode, setViewMode] = useState<'pdf' | 'flow'>('pdf');
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentPage =
    document.pages.find((p) => p.pageNumber === currentPageNum) || document.pages[0];

  useEffect(() => {
    if (initialPage && initialPage <= document.pages.length) {
      setCurrentPageNum(initialPage);
    }
    setActiveChunkId(initialChunkId || undefined);
  }, [initialPage, initialChunkId, document]);

  const handlePageChange = (pageNum: number) => {
    setCurrentPageNum(pageNum);
    if (activeChunkId) {
      const targetPage = document.pages.find((p) => p.pageNumber === pageNum);
      if (!targetPage?.chunks.some((c) => c.id === activeChunkId)) {
        setActiveChunkId(undefined);
      }
    }
  };

  // Auto-scroll to active citation chunk if present
  useEffect(() => {
    if (!activeChunkId) return;

    const timer = setTimeout(() => {
      const element = window.document.getElementById(`chunk-${activeChunkId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [activeChunkId, currentPageNum]);

  const handleCopyCitation = () => {
    const citationText = `"${document.title}", Page ${currentPageNum}`;
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoom = (delta: number) => {
    setZoomScale((prev) => Math.min(1.6, Math.max(0.7, +(prev + delta).toFixed(1))));
  };

  const resetZoom = () => setZoomScale(1);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-6xl h-[94vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-neutral-300">
        {/* Top Control Bar */}
        <div className="h-14 px-4 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0 select-none">
          {/* Left: Thumbnail toggle & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                showThumbnails
                  ? 'bg-neutral-100 text-neutral-900 font-medium'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
              }`}
              title="Toggle Page Raster Thumbnails"
            >
              <Layers className="w-4 h-4 text-neutral-600" />
              <span className="hidden md:inline text-xs">Thumbnails</span>
            </button>

            <div className="h-4 w-px bg-neutral-200" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 font-mono text-[10px] uppercase font-semibold shrink-0">
                {document.fileType}
              </span>
              <h2 className="text-xs sm:text-sm font-semibold text-neutral-900 truncate max-w-xs sm:max-w-md">
                {document.title}
              </h2>
              {activeChunkId && (
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-semibold">
                  <Target className="w-2.5 h-2.5 text-amber-600" />
                  <span>Search Citation</span>
                  <button
                    onClick={() => setActiveChunkId(undefined)}
                    className="ml-1 text-amber-700 hover:text-amber-950 font-bold cursor-pointer"
                    title="Dismiss citation highlight"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Center: Page Stepper & Zoom Controls */}
          <div className="flex items-center gap-3">
            {/* Page Stepper */}
            <div className="flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1 rounded-md text-xs border border-neutral-200">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPageNum - 1))}
                disabled={currentPageNum <= 1}
                className="p-1 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent rounded text-neutral-700 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="text-neutral-700 text-xs px-1 font-mono tabular-nums">
                Page <strong className="font-semibold">{currentPageNum}</strong> of{' '}
                {document.pages.length}
              </span>

              <button
                onClick={() => handlePageChange(Math.min(document.pages.length, currentPageNum + 1))}
                disabled={currentPageNum >= document.pages.length}
                className="p-1 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent rounded text-neutral-700 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-neutral-100 p-0.5 rounded-md border border-neutral-200 text-xs">
              <button
                onClick={() => handleZoom(-0.1)}
                className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={resetZoom}
                className="px-1.5 py-0.5 text-[11px] font-mono text-neutral-600 hover:text-neutral-900 cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              <button
                onClick={() => handleZoom(0.1)}
                className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Mode Toggle: Formatted PDF vs Flow */}
            <div className="hidden md:flex items-center p-0.5 bg-neutral-100 rounded-md border border-neutral-200 text-xs">
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  viewMode === 'pdf'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                PDF Page
              </button>
              <button
                onClick={() => setViewMode('flow')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  viewMode === 'flow'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Clean Flow
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCitation}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
              title="Copy citation reference"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Cite'}</span>
            </button>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                showDetails
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
              title="Document details"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Thumbnail Strip (Rasterized Page Previews) */}
          {showThumbnails && (
            <aside className="w-36 sm:w-44 bg-neutral-50 border-r border-neutral-200 overflow-y-auto p-3 flex flex-col items-center gap-3 shrink-0 select-none">
              <div className="w-full text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-1 flex items-center justify-between">
                <span>Pages ({document.pages.length})</span>
                <span className="text-[9px] font-mono">Raster</span>
              </div>

              {document.pages.map((p) => {
                const isSelected = p.pageNumber === currentPageNum;
                const hasActiveChunk =
                  Boolean(activeChunkId) && p.chunks.some((c) => c.id === activeChunkId);

                return (
                  <PdfPageThumbnail
                    key={p.pageNumber}
                    page={p}
                    pageNumber={p.pageNumber}
                    isSelected={isSelected}
                    hasActiveChunk={hasActiveChunk}
                    activeChunkId={activeChunkId}
                    onClick={() => {
                      handlePageChange(p.pageNumber);
                    }}
                  />
                );
              })}
            </aside>
          )}

          {/* Center Document Reading Canvas */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-neutral-200/50"
          >
            {/* Rendered PDF Page Simulator */}
            <div
              className={`w-full max-w-3xl bg-white shadow-md border border-neutral-300 transition-transform duration-150 origin-top text-neutral-900 ${
                viewMode === 'pdf' ? 'p-8 sm:p-14 min-h-[900px] flex flex-col justify-between' : 'p-6 sm:p-10 rounded-lg'
              }`}
              style={{ transform: `scale(${zoomScale})` }}
            >
              {/* Top PDF Running Header */}
              <div>
                {viewMode === 'pdf' && (
                  <div className="border-b-2 border-neutral-900 pb-3 mb-8">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                      <span>CONFIDENTIAL // INTERNAL ARCHITECTURE SPECIFICATION</span>
                      <span className="tabular-nums">ID: {document.id.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-700">
                      <span className="font-semibold">{document.title}</span>
                      <span className="font-mono text-[11px] tabular-nums">
                        Page {currentPageNum} of {document.pages.length}
                      </span>
                    </div>
                  </div>
                )}

                {/* Page Title / Subhead */}
                {currentPage?.header && (
                  <div className="mb-6 pb-2 border-b border-neutral-100">
                    <h3 className="text-base font-bold text-neutral-900 font-sans">
                      {currentPage.header}
                    </h3>
                  </div>
                )}

                {/* Render Chunks / Paragraphs on this Page */}
                <div className="space-y-6 font-serif">
                  {currentPage?.chunks.map((chunk) => {
                    const isHighlighted = Boolean(activeChunkId) && activeChunkId === chunk.id;

                    return (
                      <div
                        key={chunk.id}
                        id={`chunk-${chunk.id}`}
                        className={`relative transition-all duration-300 rounded-md ${
                          isHighlighted
                            ? 'border-l-4 border-amber-500 bg-amber-50/80 p-4 ring-1 ring-amber-300/80 shadow-xs'
                            : 'p-2'
                        }`}
                      >
                        {/* Highlight citation badge */}
                        {isHighlighted && (
                          <div className="mb-2 flex items-center justify-between border-b border-amber-200/80 pb-1.5 text-xs font-semibold text-amber-900 font-sans">
                            <span className="flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-amber-600" />
                              <span>Referenced Citation Span</span>
                            </span>
                            <span className="text-[10px] text-amber-700 font-mono">
                              Page {chunk.pageNumber} · Section {chunk.chunkIndex + 1}
                            </span>
                          </div>
                        )}

                        {/* Section Heading */}
                        {chunk.sectionHeading && (
                          <h4 className="text-sm font-semibold text-neutral-900 mb-2 font-sans">
                            {chunk.sectionHeading}
                          </h4>
                        )}

                        {/* Text */}
                        <p className="text-sm leading-relaxed text-neutral-800 whitespace-pre-line">
                          {chunk.snippet}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom PDF Running Footer */}
              {viewMode === 'pdf' && (
                <div className="mt-16 pt-4 border-t border-neutral-200 flex items-center justify-between text-[10px] font-mono text-neutral-400 select-none">
                  <span>ENTERPRISE SPECIFICATION · {document.filename}</span>
                  <span className="tabular-nums">PAGE {currentPageNum}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Info Drawer */}
          {showDetails && (
            <aside className="w-72 bg-white border-l border-neutral-200 p-5 overflow-y-auto space-y-4 shrink-0 text-xs text-neutral-600 animate-in slide-in-from-right-4 duration-150">
              <div>
                <span className="font-semibold text-neutral-900 block mb-1">
                  Document Overview
                </span>
                <p className="leading-relaxed text-neutral-600">{document.summary}</p>
              </div>

              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">File Type:</span>
                  <span className="font-mono uppercase text-neutral-800 font-semibold">
                    {document.fileType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Pages:</span>
                  <span className="font-mono text-neutral-800">{document.pageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Uploaded by:</span>
                  <span className="text-neutral-800">{document.uploadedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Ingestion Date:</span>
                  <span className="text-neutral-800">
                    {new Date(document.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {document.entities.length > 0 && (
                <div className="pt-3 border-t border-neutral-100">
                  <span className="font-semibold text-neutral-900 block mb-1.5">
                    Topics & Entities
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {document.entities.map((e, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[11px]"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
