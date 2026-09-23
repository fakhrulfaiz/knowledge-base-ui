import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  FileText,
  Building2,
  Users,
  HardDrive,
  ArrowRight,
  Bookmark,
  ChevronRight,
  FolderKanban
} from 'lucide-react';
import { Collection, DocumentItem } from '../types';
import { executeChunkSearch } from '../utils/retrieval';
import { SAMPLE_SEARCH_QUERIES } from '../data/mockData';

interface SearchViewProps {
  documents: DocumentItem[];
  collections: Collection[];
  onOpenCitation: (doc: DocumentItem, pageNumber: number, chunkId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  documents,
  collections,
  onOpenCitation,
}) => {
  const [query, setQuery] = useState('Zero Trust mTLS architecture');
  const [scope, setScope] = useState<'all' | 'team' | 'org'>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all');
  const [resultLimit, setResultLimit] = useState<number>(5);

  // Execute search
  const { results, durationMs } = useMemo(() => {
    return executeChunkSearch(
      {
        query,
        scope,
        collectionId: selectedCollectionId,
        topK: resultLimit,
        minScoreThreshold: 0.15,
      },
      documents,
      collections
    );
  }, [query, scope, selectedCollectionId, resultLimit, documents, collections]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Top Header */}
      <div className="h-14 px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Search Knowledge Base</h1>
        </div>

        <div className="text-xs text-neutral-400 dark:text-neutral-500">
          <span>{documents.length} documents searchable</span>
          {results.length > 0 && <span> · Found {results.length} relevant passages</span>}
        </div>
      </div>

      {/* Clean, Simple Search Area */}
      <div className="px-6 py-5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0 space-y-3">
        {/* Main Search Bar */}
        <div className="relative max-w-3xl">
          <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions, policies, specifications, and runbooks..."
            className="w-full pl-10 pr-10 py-2.5 bg-neutral-100/80 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/90 focus:bg-white dark:focus:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-500 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick query suggestions */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none pt-1">
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0">Suggestions:</span>
          {SAMPLE_SEARCH_QUERIES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(sample)}
              className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs transition-colors cursor-pointer shrink-0"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Filters Row: Clean and simple */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-4">
            {/* Scope Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 dark:text-neutral-500">Scope:</span>
              <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setScope('all')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    scope === 'all'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setScope('org')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    scope === 'org'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  Organization
                </button>
                <button
                  onClick={() => setScope('team')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    scope === 'team'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  Team
                </button>
              </div>
            </div>

            {/* Collection Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 dark:text-neutral-500">Collection:</span>
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 py-1 px-2 rounded text-xs border border-neutral-200 dark:border-neutral-700 focus:outline-hidden cursor-pointer max-w-48 truncate"
              >
                <option value="all" className="dark:bg-neutral-800">All Collections</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-neutral-800">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
            Searched in {durationMs}ms
          </div>
        </div>
      </div>

      {/* Results View */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl space-y-4">
        {results.length === 0 ? (
          <div className="h-60 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-neutral-900">
            <Search className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">No matching passages found</h3>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-sm mt-1">
              Try a different keyword or set the scope to "All".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-neutral-400 dark:text-neutral-500">
              Showing top results for <strong className="text-neutral-700 dark:text-neutral-300">"{query}"</strong>
            </div>

            {results.map((item) => {
              const { chunk, document: doc, collection: col, score } = item;
              const matchPercent = Math.round(score * 100);

              return (
                <div
                  key={chunk.id}
                  className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xs transition-all space-y-2.5"
                >
                  {/* Top Bar: Title & View Button */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 mb-1">
                        <span className="font-medium text-neutral-600 dark:text-neutral-300">{col.name}</span>
                        <span>·</span>
                        <span>Page {chunk.pageNumber}</span>
                        <span>·</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">{matchPercent}% match</span>
                      </div>

                      <h3
                        onClick={() => onOpenCitation(doc, chunk.pageNumber, chunk.id)}
                        className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                        <span>{doc.title}</span>
                      </h3>
                    </div>

                    <button
                      onClick={() => onOpenCitation(doc, chunk.pageNumber, chunk.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <span>Open Page {chunk.pageNumber}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Section Title */}
                  {chunk.sectionHeading && (
                    <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                      <Bookmark className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                      <span>{chunk.sectionHeading}</span>
                    </div>
                  )}

                  {/* Snippet */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-md border border-neutral-100 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                    <HighlightedSnippet text={chunk.snippet} query={query} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Clean snippet highlighter
const HighlightedSnippet: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) {
    return <span>{text}</span>;
  }

  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (terms.length === 0) {
    return <span>{text}</span>;
  }

  const escapedTerms = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escapedTerms})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => {
        const isMatch = terms.some((t) => t.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <mark key={i} className="bg-amber-100 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 font-medium px-0.5 rounded-xs">
              {part}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};
