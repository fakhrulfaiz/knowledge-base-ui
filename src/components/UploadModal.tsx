import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  Sliders,
  Sparkles,
  FileCode
} from 'lucide-react';
import { Collection, DocumentItem, IngestionConfig } from '../types';
import { chunkTextIntoPages } from '../utils/chunker';

interface UploadModalProps {
  collection: Collection;
  ingestionConfig?: IngestionConfig;
  onClose: () => void;
  onUploadComplete: (newDoc: DocumentItem) => boolean | void;
}

const SAMPLE_PRESETS = [
  {
    title: 'eBPF Kernel Telemetry & Network Flow Observability RFC',
    filename: 'INFRA-eBPF-Network-Flow-Observability.md',
    fileType: 'md' as const,
    summary: 'Proposes kernel-level eBPF probes for tracking TCP connection states, drop rates, and packet latency with zero userspace overhead.',
    pages: [
      {
        pageNumber: 1,
        header: '1. Executive Proposal & Kernel Probing Architecture',
        content: `### 1. Executive Proposal & Kernel Probing Architecture
This Request for Comment outlines the deployment of lightweight eBPF bytecode modules directly into Linux kernel socket filters. Traditional sidecar packet inspection adds up to 1.8ms of serialization overhead per hop.

By compiling probes with clang/LLVM and attaching to kprobe/kretprobe event points, packet flow telemetry is harvested with under 15 microseconds of latency.

### 1.2 Ring Buffer Telemetry Pipeline
Metrics are pushed into memory-mapped perf ring buffers, consumed by the local host collector daemon, and pushed over gRPC streams to Prometheus collectors.`
      },
      {
        pageNumber: 2,
        header: '2. Security Isolation & In-Kernel Verifier Rules',
        content: `### 2. Security Isolation & In-Kernel Verifier Rules
All eBPF code undergoes static safety verification by the kernel verifier prior to JIT compilation. Unbounded loops and out-of-bounds memory accesses are strictly prohibited.

The memory footprint per host is capped at 64MB of non-swappable RAM, ensuring Zero Trust isolation between workloads and kernel telemetry subsystems.`
      }
    ]
  },
  {
    title: 'Enterprise Key Management Service & HSM Integration Guide',
    filename: 'SEC-KMS-HSM-Integration-v2.pdf',
    fileType: 'pdf' as const,
    summary: 'Hardware Security Module integration guidelines for AES-256 root master keys, FIPS 140-3 Level 4 physical security, and automatic key rotation.',
    pages: [
      {
        pageNumber: 1,
        header: '1. Root Key Governance & HSM Clustering',
        content: `### 1. Root Key Governance & HSM Clustering
Enterprise cryptographic operations must anchor root master keys inside dedicated Hardware Security Modules (HSMs) certified to FIPS 140-3 Level 4.

Direct export of plaintext master keying material is physically impossible; all signature generation and envelope decryption occurs within tamper-responsive cryptographic boundaries.

### 1.3 Envelope Encryption Protocol
Data encryption keys (DEKs) are generated locally using cryptographically secure PRNGs and encrypted under the master key. DEKs expire after 24 hours or 100,000 encryption operations.`
      }
    ]
  }
];

export const UploadModal: React.FC<UploadModalProps> = ({
  collection,
  ingestionConfig,
  onClose,
  onUploadComplete,
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [docTitle, setDocTitle] = useState(SAMPLE_PRESETS[0].title);
  const [filename, setFilename] = useState(SAMPLE_PRESETS[0].filename);
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'md' | 'report'>('md');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepMessage, setStepMessage] = useState('');

  const currentPreset = SAMPLE_PRESETS[selectedPresetIndex];

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = SAMPLE_PRESETS[idx];
    setDocTitle(p.title);
    setFilename(p.filename);
    setFileType(p.fileType);
  };

  const handleIngest = async () => {
    setIsProcessing(true);
    setStepMessage('Reading document pages...');
    await new Promise((r) => setTimeout(r, 350));

    setStepMessage('Extracting readable sections and passages...');
    await new Promise((r) => setTimeout(r, 400));

    setStepMessage('Adding to collection index...');
    await new Promise((r) => setTimeout(r, 350));

    const docId = `doc-${Date.now()}`;
    const pages = chunkTextIntoPages(
      docId,
      collection.id,
      collection.scope,
      currentPreset.pages,
      ingestionConfig
    );
    const totalChunks = pages.reduce((acc, p) => acc + p.chunks.length, 0);

    const newDoc: DocumentItem = {
      id: docId,
      collectionId: collection.id,
      title: docTitle,
      filename,
      fileType,
      source: 'upload',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Elena Rostova',
      sizeBytes: 1350000,
      pageCount: pages.length,
      chunkCount: totalChunks,
      summary: currentPreset.summary,
      entities: ['eBPF', 'Kubernetes', 'AES-256-GCM', 'Secret Manager', 'Prometheus'],
      crossReferences: [],
      semanticTopics: ['Infrastructure', 'Security', 'Telemetry'],
      pages,
    };

    const success = onUploadComplete(newDoc);
    setIsProcessing(false);
    if (success !== false) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="h-14 px-6 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Direct Document Upload &amp; Ingestion
              </h2>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                Target Collection: <strong className="text-neutral-700 dark:text-neutral-300">{collection.name}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Processing State Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full border-3 border-neutral-200 dark:border-neutral-700 border-t-neutral-900 dark:border-t-neutral-100 animate-spin mb-4" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Extracting &amp; Chunking Document
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1 max-w-md">
              {stepMessage}
            </p>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Preset Selectors */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1.5">
              Select Enterprise Document Template or Upload File:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPreset(idx)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPresetIndex === idx
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] uppercase opacity-75">
                      {preset.fileType}
                    </span>
                    <span className="text-[10px] opacity-60">
                      {preset.pages.length} pages
                    </span>
                  </div>
                  <div className="font-semibold text-xs line-clamp-1">
                    {preset.title}
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${selectedPresetIndex === idx ? 'text-blue-100' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {preset.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Document Metadata Inputs */}
          <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div>
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Filename
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-xs text-neutral-900 dark:text-neutral-100 font-mono focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Format
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-500"
                >
                  <option value="pdf" className="dark:bg-neutral-800">PDF Document (.pdf)</option>
                  <option value="docx" className="dark:bg-neutral-800">Word Document (.docx)</option>
                  <option value="md" className="dark:bg-neutral-800">Markdown (.md)</option>
                  <option value="report" className="dark:bg-neutral-800">Engineering Report (.report)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chunking Pipeline Specs Preview */}
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1 font-mono">
            <div className="font-semibold text-neutral-800 dark:text-neutral-200 font-sans flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Chunking Pipeline Parameters:</span>
            </div>
            <div className="flex justify-between">
              <span>Token Chunk Target:</span>
              <span className="text-neutral-900 dark:text-neutral-100 font-semibold">150–220 tokens</span>
            </div>
            <div className="flex justify-between">
              <span>Overlap Window:</span>
              <span className="text-neutral-900 dark:text-neutral-100 font-semibold">25 tokens</span>
            </div>
            <div className="flex justify-between">
              <span>Deep-Link Offset Preservation:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Enabled (Character Span Mapping)</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-neutral-200 dark:border-neutral-700">
              <span>Collection Storage Quota:</span>
              <span className="text-blue-700 dark:text-blue-400 font-semibold">{collection.allocatedGb || 10} GB ({collection.scope === 'team' ? 'Team Allocated' : collection.scope === 'mine' ? 'Personal Cap' : 'Org Pool'})</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-6 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400 dark:text-neutral-500">
            Estimated ~6 chunks will be created
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleIngest}
              disabled={isProcessing || !docTitle.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <span>Extract &amp; Ingest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
