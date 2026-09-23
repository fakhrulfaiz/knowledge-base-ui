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
          ? 'bg-neutral-100 ring-2 ring-neutral-900'
          : 'hover:bg-neutral-100/70'
      }`}
    >
      {/* Miniature A4 Raster Sheet */}
      <div
        className={`relative w-28 h-36 bg-white rounded-xs shadow-xs border transition-all overflow-hidden flex flex-col justify-between p-2 select-none ${
          isSelected
            ? 'border-neutral-800 shadow-sm'
            : 'border-neutral-200 group-hover:border-neutral-300'
        }`}
      >
        {/* Raster Top Header */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-100 pb-1 mb-1.5">
            <div className="w-10 h-1 bg-neutral-400 rounded-2xs" />
            <div className="text-[7px] font-mono text-neutral-300">p.{pageNumber}</div>
          </div>

          {/* Simulated page heading */}
          <div className="w-16 h-1.5 bg-neutral-700 rounded-2xs mb-2" />

          {/* Simulated content blocks & raster chunks */}
          <div className="space-y-1.5">
            {page.chunks.map((chunk) => {
              const isTarget = Boolean(activeChunkId) && chunk.id === activeChunkId;

              return (
                <div
                  key={chunk.id}
                  className={`rounded-2xs p-1 transition-all ${
                    isTarget
                      ? 'bg-amber-100 border border-amber-400 ring-1 ring-amber-300'
                      : 'bg-neutral-50/50'
                  }`}
                >
                  {isTarget && (
                    <div className="flex items-center gap-0.5 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <div className="w-8 h-1 bg-amber-600 rounded-2xs" />
                    </div>
                  )}
                  {/* Miniature text lines */}
                  <div className="space-y-0.5">
                    <div
                      className={`h-0.5 rounded-2xs w-full ${
                        isTarget ? 'bg-amber-700/60' : 'bg-neutral-300'
                      }`}
                    />
                    <div
                      className={`h-0.5 rounded-2xs w-4/5 ${
                        isTarget ? 'bg-amber-700/60' : 'bg-neutral-300'
                      }`}
                    />
                    <div
                      className={`h-0.5 rounded-2xs w-3/4 ${
                        isTarget ? 'bg-amber-700/60' : 'bg-neutral-200'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Raster Footer */}
        <div className="border-t border-neutral-100 pt-1 flex items-center justify-between">
          <div className="w-6 h-0.5 bg-neutral-200 rounded-2xs" />
          <div className="w-3 h-0.5 bg-neutral-300 rounded-2xs" />
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
          isSelected ? 'font-semibold text-neutral-900' : 'text-neutral-500'
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
    <div className="relative w-full h-36 bg-white rounded-t-lg border-b border-neutral-100 p-3 flex flex-col justify-between overflow-hidden group-hover:bg-neutral-50/50 transition-colors">
      {/* Background document layout watermark */}
      <div className="space-y-1.5 select-none">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 mb-1.5">
          <span className="text-[9px] uppercase font-mono font-bold text-neutral-400">
            {fileType} · DOCUMENT PREVIEW
          </span>
          <span className="text-[9px] font-mono text-neutral-400">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </span>
        </div>

        <div className="w-3/4 h-2 bg-neutral-700 rounded-xs mb-1" />
        <div className="w-1/2 h-1.5 bg-neutral-300 rounded-xs mb-2" />

        {/* Text snippet preview */}
        <p className="text-[10px] text-neutral-500 leading-snug line-clamp-3 font-serif italic">
          "{firstPageSnippet}"
        </p>
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between border-t border-neutral-100 pt-1 text-[9px] text-neutral-400 font-mono">
        <span>INTERNAL SPEC</span>
        <span>PAGE 1 OF {pageCount}</span>
      </div>
    </div>
  );
};
