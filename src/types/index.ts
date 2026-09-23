export type ScopeType = 'mine' | 'team' | 'org' | 'all';

export type SystemRole = 'owner' | 'admin' | 'team_lead' | 'member' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarText: string;
  systemRole: SystemRole;
  teamId?: string;
  teamName?: string;
  isTeamLeader?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  scope: 'mine' | 'team' | 'org';
  teamName?: string;
  allocatedGb?: number; // collection quota in GB set by team lead or admin
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  totalChunks: number;
  tags: string[];
  colorTheme?: string;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  collectionId: string;
  pageNumber: number;
  chunkIndex: number;
  tokenCount: number;
  snippet: string;
  startOffset: number;
  endOffset: number;
  sectionHeading: string;
  entities: string[];
  scope: 'mine' | 'team' | 'org';
  keywords: string[];
}

export interface DocumentPage {
  pageNumber: number;
  header?: string;
  content: string;
  chunks: DocumentChunk[];
}

export interface DocumentItem {
  id: string;
  collectionId: string;
  title: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'md' | 'report';
  source: 'upload' | 'drive';
  drivePath?: string;
  uploadedAt: string;
  uploadedBy: string;
  sizeBytes: number;
  pageCount: number;
  chunkCount: number;
  summary: string;
  entities: string[];
  crossReferences: string[]; // docIds or titles referenced
  semanticTopics: string[];
  pages: DocumentPage[];
}

export interface DriveFolder {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
}

export interface DriveFile {
  id: string;
  folderId: string;
  title: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'md';
  sizeBytes: number;
  lastModified: string;
  author: string;
  previewSummary: string;
  rawContent: {
    title: string;
    summary: string;
    entities: string[];
    semanticTopics: string[];
    pages: { pageNumber: number; header: string; content: string }[];
  };
}

export type EdgeDefinitionMode = 'semantic' | 'entities' | 'cross-references' | 'combined';

export interface GraphNode {
  id: string;
  title: string;
  fileType: string;
  chunkCount: number;
  pageCount: number;
  entities: string[];
  semanticTopics: string[];
  collectionId: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  reasons: string[];
  type: 'semantic' | 'entities' | 'cross-reference' | 'hybrid';
}

export interface SearchResultChunk {
  chunk: DocumentChunk;
  document: DocumentItem;
  collection: Collection;
  score: number; // 0 to 1
  bm25Score: number;
  semanticScore: number;
  highlightIndices: [number, number][]; // Start & end in snippet
}

export interface SearchQueryOptions {
  query: string;
  scope: 'all' | 'team' | 'org';
  collectionId?: string;
  topK: number; // Retrieval depth (chunk count)
  minScoreThreshold?: number;
}

export interface IngestionConfig {
  maxChunkSizeTokens: number;
  chunkOverlapTokens: number;
  chunkingStrategy: 'paragraph_boundary' | 'sliding_window' | 'sentence_boundary';
  minChunkTokens: number;
  embeddingModel: string;
  embeddingDimensions: number;
  autoReindexOnUpload: boolean;
}

export interface ReindexJob {
  id: string;
  timestamp: string;
  targetScope: 'all' | string;
  targetName: string;
  triggeredBy: string;
  chunkSizeTokens: number;
  chunkOverlapTokens: number;
  strategy: string;
  docsCount: number;
  chunksBefore: number;
  chunksAfter: number;
  durationMs: number;
  status: 'completed' | 'in_progress' | 'failed';
}

export interface ScopeResourceAllocation {
  totalEnterpriseCapGb: number;
  personalPerUserCapGb: number;
  personalPoolQuotaGb: number;
  teamPoolQuotaGb: number;
  orgPoolQuotaGb: number;
}

export interface TeamAllocationRecord {
  teamId: string;
  teamName: string;
  teamLeader: {
    name: string;
    email: string;
  };
  allocatedGb: number; // Allocated by Admin
  collectionAllocations: {
    collectionId: string;
    collectionName: string;
    allocatedGb: number; // Allocated by Team Leader
  }[];
}
