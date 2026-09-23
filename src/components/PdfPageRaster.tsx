import React from 'react';
import { DocumentPage, DocumentChunk } from '../types';
import { FileText, Target } from 'lucide-react';

interface PdfThumbnailProps {
  page: DocumentPage;
  pageNumber: number;
  isSelected: boolean;
  hasActiveChunk?: boolean;
  activeChunkId?: string;
  onClick: () => void;
  scale?: number;
}

/**
 * Miniature rasterized PDF page thumbnail representation.
 * Simulates high-fidelity document layout with headers, paragraphs, and active citation highlight.
 */
export const PdfPageThumbnail: React.FC<PdfThumbnailProps> = ({
  page,
  pageNumber,
  isSelected,
  hasActiveChunk,
  activeChunkId,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all text-left cursor-pointer ${
        isSelected
          ? 'bg-neutral-100 dark:bg-neutral-800 ring-2 ring-neutral-900 dark:ring-blue-500'
          : 'hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70'
      }`}
    >
      {/* Miniature A4 Raster Sheet */}
      <div
        className={`relative w-28 h-36 bg-white dark:bg-neutral-850 rounded-xs shadow-xs border transition-all overflow-hidden flex flex-col justify-between p-2 select-none ${
          isSelected
            ? 'border-neutral-800 dark:border-blue-500 shadow-sm'
            : 'border-neutral-200 dark:border-neutral-700 group-hover:border-neutral-300 dark:group-hover:border-neutral-600'
        }`}
      >
        {/* Raster Top Header */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-750 pb-1 mb-1.5">
            <div className="w-10 h-1 bg-neutral-400 dark:bg-neutral-500 rounded-2xs" />
            <div className="text-[7px] font-mono text-neutral-300 dark:text-neutral-500">p.{pageNumber}</div>
          </div>

          {/* Simulated page heading */}
          <div className="w-16 h-1.5 bg-neutral-700 dark:bg-neutral-300 rounded-2xs mb-2" />

          {/* Simulated content blocks & raster chunks */}
          <div className="space-y-1.5">
            {page.chunks.map((chunk) => {
              const isTarget = Boolean(activeChunkId) && chunk.id === activeChunkId;

              return (
                <div
                  key={chunk.id}
                  className={`rounded-2xs p-1 transition-all ${
                    isTarget
                      ? 'bg-amber-100 dark:bg-amber-950/60 border border-amber-400 dark:border-amber-600 ring-1 ring-amber-300 dark:ring-amber-700'
                      : 'bg-neutral-50/50 dark:bg-neutral-800/50'
                  }`}
                >
                  {isTarget && (
                    <div className="flex items-center gap-0.5 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <div className="w-8 h-1 bg-amber-600 dark:bg-amber-400 rounded-2xs" />
                    </div>
                  )}
                  {/* Miniature text lines */}
                  <div className="space-y-0.5">
                    <div
                      className={`h-0.5 rounded-2xs w-full ${
                        isTarget ? 'bg-amber-700/60 dark:bg-amber-300/60' : 'bg-neutral-300 dark:bg-neutral-600'
                      }`}
                    />
                    <div
                      className={`h-0.5 rounded-2xs w-4/5 ${
                        isTarget ? 'bg-amber-700/60 dark:bg-amber-300/60' : 'bg-neutral-300 dark:bg-neutral-600'
                      }`}
                    />
                    <div
                      className={`h-0.5 rounded-2xs w-3/4 ${
                        isTarget ? 'bg-amber-700/60 dark:bg-amber-300/60' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Raster Footer */}
        <div className="border-t border-neutral-100 dark:border-neutral-750 pt-1 flex items-center justify-between">
          <div className="w-6 h-0.5 bg-neutral-200 dark:bg-neutral-600 rounded-2xs" />
          <div className="w-3 h-0.5 bg-neutral-300 dark:bg-neutral-500 rounded-2xs" />
        </div>

        {/* Highlight badge on thumbnail - only when active search citation */}
        {Boolean(activeChunkId) && hasActiveChunk && (
          <div className="absolute top-1 right-1 px-1 py-0.5 bg-amber-500 text-white rounded-xs text-[7px] font-bold shadow-xs flex items-center gap-0.5">
            <Target className="w-2 h-2" />
            <span>CITATION</span>
          </div>
        )}
      </div>

      {/* Page Label */}
      <span
        className={`text-[11px] font-mono tabular-nums ${
          isSelected ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        Page {pageNumber}
      </span>
    </button>
  );
};

/**
 * First-page visual raster card used in Document Grid views
 */
export const DocumentGridCardPreview: React.FC<{
  title: string;
  fileType: string;
  pageCount: number;
  firstPageSnippet: string;
}> = ({ title, fileType, pageCount, firstPageSnippet }) => {
  return (
    <div className="relative w-full h-36 bg-white dark:bg-neutral-800/80 rounded-t-lg border-b border-neutral-100 dark:border-neutral-700/60 p-3 flex flex-col justify-between overflow-hidden group-hover:bg-neutral-50/50 dark:group-hover:bg-neutral-800 transition-colors">
      {/* Background document layout watermark */}
      <div className="space-y-1.5 select-none">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700/60 pb-1.5 mb-1.5">
          <span className="text-[9px] uppercase font-mono font-bold text-neutral-400 dark:text-neutral-500">
            {fileType} · DOCUMENT PREVIEW
          </span>
          <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </span>
        </div>

        <div className="w-3/4 h-2 bg-neutral-700 dark:bg-neutral-300 rounded-xs mb-1" />
        <div className="w-1/2 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-xs mb-2" />

        {/* Text snippet preview */}
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-3 font-serif italic">
          "{firstPageSnippet}"
        </p>
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-700/60 pt-1 text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">
        <span>INTERNAL SPEC</span>
        <span>PAGE 1 OF {pageCount}</span>
      </div>
    </div>
  );
};
