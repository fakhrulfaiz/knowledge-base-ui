import { DocumentChunk, DocumentItem, DocumentPage, IngestionConfig } from '../types';

export const DEFAULT_INGESTION_CONFIG: IngestionConfig = {
  maxChunkSizeTokens: 256,
  chunkOverlapTokens: 32,
  chunkingStrategy: 'paragraph_boundary',
  minChunkTokens: 30,
  embeddingModel: 'text-embedding-004',
  embeddingDimensions: 768,
  autoReindexOnUpload: true,
};

/**
 * Estimate token count from text using standard word-to-token ratio (~1.3 tokens per word)
 */
export function estimateTokens(text: string): number {
  if (!text || !text.trim()) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.round(words * 1.3);
}

/**
 * Breaks document pages into chunks based on configurable token limits and overlap
 */
export function chunkTextIntoPages(
  docId: string,
  collectionId: string,
  scope: 'mine' | 'team' | 'org',
  rawPages: { pageNumber: number; header?: string; content: string }[],
  config: IngestionConfig = DEFAULT_INGESTION_CONFIG
): DocumentPage[] {
  let chunkGlobalIndex = 1;
  const maxTokens = Math.max(64, config.maxChunkSizeTokens || 256);
  const overlapTokens = Math.min(Math.floor(maxTokens * 0.5), Math.max(0, config.chunkOverlapTokens ?? 32));
  const overlapWords = Math.max(0, Math.round(overlapTokens / 1.3));
  const strategy = config.chunkingStrategy || 'paragraph_boundary';

  return rawPages.map((rawPage) => {
    const text = rawPage.content;
    const chunks: DocumentChunk[] = [];
    let currentHeading = rawPage.header || 'Overview';

    if (strategy === 'sliding_window') {
      // Sliding window over all words on this page
      const words = text.split(/\s+/).filter((w) => w.length > 0);
      const windowWords = Math.max(20, Math.round(maxTokens / 1.3));
      const stepWords = Math.max(10, windowWords - overlapWords);

      let wordIndex = 0;
      while (wordIndex < words.length) {
        const slice = words.slice(wordIndex, wordIndex + windowWords);
        const snippet = slice.join(' ');
        const chunkTokens = estimateTokens(snippet);
        const chunkId = `${docId}-p${rawPage.pageNumber}-c${chunkGlobalIndex}`;

        chunks.push({
          id: chunkId,
          docId,
          collectionId,
          pageNumber: rawPage.pageNumber,
          chunkIndex: chunkGlobalIndex++,
          tokenCount: chunkTokens,
          snippet,
          startOffset: wordIndex,
          endOffset: wordIndex + slice.length,
          sectionHeading: currentHeading,
          entities: extractEntities(snippet),
          keywords: extractKeywords(snippet),
          scope,
        });

        if (wordIndex + windowWords >= words.length) break;
        wordIndex += stepWords;
      }
    } else {
      // Paragraph or Sentence Boundary Packing
      const blocks =
        strategy === 'sentence_boundary'
          ? text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text]
          : text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

      let currentChunkText = '';
      let currentStart = 0;

      blocks.forEach((block) => {
        const trimmed = block.trim();
        if (!trimmed) return;

        // Detect section headers
        if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
          currentHeading = trimmed.replace(/^#+\s*/, '').trim();
        }

        const blockTokens = estimateTokens(trimmed);
        const currentTokens = estimateTokens(currentChunkText);

        if (currentChunkText && currentTokens + blockTokens > maxTokens) {
          // Finalize previous chunk
          const endOffset = currentStart + currentChunkText.length;
          const chunkId = `${docId}-p${rawPage.pageNumber}-c${chunkGlobalIndex}`;
          const chunkTokens = Math.max(config.minChunkTokens || 20, estimateTokens(currentChunkText));

          chunks.push({
            id: chunkId,
            docId,
            collectionId,
            pageNumber: rawPage.pageNumber,
            chunkIndex: chunkGlobalIndex++,
            tokenCount: chunkTokens,
            snippet: currentChunkText.trim(),
            startOffset: currentStart,
            endOffset,
            sectionHeading: currentHeading,
            entities: extractEntities(currentChunkText),
            keywords: extractKeywords(currentChunkText),
            scope,
          });

          // Carry over overlap tokens from tail
          if (overlapWords > 0) {
            const tail = currentChunkText.split(/\s+/).slice(-overlapWords).join(' ');
            currentStart = Math.max(0, endOffset - tail.length);
            currentChunkText = tail + ' ' + trimmed;
          } else {
            currentStart = text.indexOf(trimmed);
            currentChunkText = trimmed;
          }
        } else {
          if (!currentChunkText) {
            currentStart = text.indexOf(trimmed);
            if (currentStart < 0) currentStart = 0;
            currentChunkText = trimmed;
          } else {
            currentChunkText += (strategy === 'sentence_boundary' ? ' ' : '\n\n') + trimmed;
          }
        }
      });

      if (currentChunkText.trim().length > 0) {
        const endOffset = currentStart + currentChunkText.length;
        const chunkId = `${docId}-p${rawPage.pageNumber}-c${chunkGlobalIndex}`;
        chunks.push({
          id: chunkId,
          docId,
          collectionId,
          pageNumber: rawPage.pageNumber,
          chunkIndex: chunkGlobalIndex++,
          tokenCount: Math.max(config.minChunkTokens || 20, estimateTokens(currentChunkText)),
          snippet: currentChunkText.trim(),
          startOffset: currentStart,
          endOffset,
          sectionHeading: currentHeading,
          entities: extractEntities(currentChunkText),
          keywords: extractKeywords(currentChunkText),
          scope,
        });
      }
    }

    return {
      pageNumber: rawPage.pageNumber,
      header: rawPage.header,
      content: rawPage.content,
      chunks,
    };
  });
}

/**
 * Re-indexes a document by re-running the chunker over original page content with new IngestionConfig
 */
export function reindexDocument(
  doc: DocumentItem,
  config: IngestionConfig = DEFAULT_INGESTION_CONFIG
): DocumentItem {
  const rawPages = doc.pages.map((p) => ({
    pageNumber: p.pageNumber,
    header: p.header,
    content: p.content,
  }));

  const pages = chunkTextIntoPages(
    doc.id,
    doc.collectionId,
    doc.pages[0]?.chunks[0]?.scope || 'mine',
    rawPages,
    config
  );

  const totalChunks = pages.reduce((acc, p) => acc + p.chunks.length, 0);

  return {
    ...doc,
    pages,
    chunkCount: totalChunks,
  };
}

function extractEntities(text: string): string[] {
  const commonEntities = [
    'OAuth 2.1', 'Zero Trust', 'PostgreSQL', 'mTLS', 'Vector Indexing',
    'Kubernetes', 'HNSW', 'OpenID Connect', 'SOC 2 Type II', 'ISO 27001',
    'Kafka', 'Redis', 'AES-256-GCM', 'TLS 1.3', 'Role-Based Access Control',
    'pgvector', 'FAISS', 'Envoy Gateway', 'SLA 99.99%', 'RPO/RTO',
    'GDPR', 'HIPAA', 'Secret Manager', 'eBPF', 'Prometheus', 'Grafana',
    'gRPC', 'Protobuf', 'OpenTelemetry', 'Terraform', 'Snowflake'
  ];

  const found = new Set<string>();
  for (const entity of commonEntities) {
    if (new RegExp(`\\b${entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) {
      found.add(entity);
    }
  }
  return Array.from(found);
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  const counts = new Map<string, number>();
  for (const w of words) {
    counts.set(w, (counts.get(w) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);
}

const STOP_WORDS = new Set([
  'the', 'and', 'with', 'that', 'this', 'from', 'have', 'were', 'which', 'about',
  'into', 'more', 'when', 'will', 'there', 'what', 'their', 'some', 'could', 'been',
  'other', 'each', 'they', 'through', 'during', 'before', 'after', 'above', 'below',
  'these', 'those', 'also', 'such', 'only', 'than', 'then', 'should', 'would', 'where'
]);
