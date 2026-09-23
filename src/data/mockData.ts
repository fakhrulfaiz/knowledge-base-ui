import { Collection, DocumentItem, DriveFile, DriveFolder, UserProfile, ScopeResourceAllocation, TeamAllocationRecord } from '../types';
import { chunkTextIntoPages } from '../utils/chunker';

export const CURRENT_USER: UserProfile = {
  id: 'usr-9021',
  name: 'Elena Rostova',
  email: 'elena.rostova@enterprise.internal',
  role: 'Staff Infrastructure Architect & Team Lead',
  avatarText: 'ER',
  systemRole: 'owner',
  teamId: 'team-platform',
  teamName: 'Platform Infrastructure',
  isTeamLeader: true,
};

export const PRESET_USERS: UserProfile[] = [
  {
    id: 'usr-9021',
    name: 'Elena Rostova',
    email: 'elena.rostova@enterprise.internal',
    role: 'Staff Infrastructure Architect & Team Lead',
    avatarText: 'ER',
    systemRole: 'owner',
    teamId: 'team-platform',
    teamName: 'Platform Infrastructure',
    isTeamLeader: true,
  },
  {
    id: 'usr-8102',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@enterprise.internal',
    role: 'VP Infrastructure & Workspace Admin',
    avatarText: 'SJ',
    systemRole: 'admin',
    teamId: 'team-platform',
    teamName: 'Platform Infrastructure',
    isTeamLeader: false,
  },
  {
    id: 'usr-7419',
    name: 'Marcus Vance',
    email: 'marcus.vance@enterprise.internal',
    role: 'Platform Engineering Lead',
    avatarText: 'MV',
    systemRole: 'team_lead',
    teamId: 'team-platform',
    teamName: 'Platform Infrastructure',
    isTeamLeader: true,
  },
  {
    id: 'usr-6391',
    name: 'Dr. Soraya Chen',
    email: 'soraya.chen@enterprise.internal',
    role: 'Principal AI Scientist & Research Lead',
    avatarText: 'SC',
    systemRole: 'team_lead',
    teamId: 'team-ai',
    teamName: 'Core AI Infrastructure',
    isTeamLeader: true,
  },
  {
    id: 'usr-5012',
    name: 'Liam Zhang',
    email: 'liam.zhang@enterprise.internal',
    role: 'Senior SRE Engineer',
    avatarText: 'LZ',
    systemRole: 'member',
    teamId: 'team-platform',
    teamName: 'Platform Infrastructure',
    isTeamLeader: false,
  },
  {
    id: 'usr-4100',
    name: 'Security Compliance Auditor',
    email: 'auditor@enterprise.internal',
    role: 'External Compliance Auditor',
    avatarText: 'AU',
    systemRole: 'viewer',
    teamId: 'team-sec',
    teamName: 'Security & Governance',
    isTeamLeader: false,
  },
];

export const DEFAULT_RESOURCE_ALLOCATION: ScopeResourceAllocation = {
  totalEnterpriseCapGb: 500,
  personalPerUserCapGb: 5,
  personalPoolQuotaGb: 50,
  teamPoolQuotaGb: 250,
  orgPoolQuotaGb: 150,
};

export const INITIAL_TEAM_ALLOCATIONS: TeamAllocationRecord[] = [
  {
    teamId: 'team-platform',
    teamName: 'Platform Infrastructure',
    teamLeader: {
      name: 'Marcus Vance',
      email: 'marcus.vance@enterprise.internal',
    },
    allocatedGb: 80, // Allocated by Admin
    collectionAllocations: [
      {
        collectionId: 'col-team-1',
        collectionName: 'Core Platform Kubernetes & Service Mesh',
        allocatedGb: 45, // Allocated by Team Lead
      },
      {
        collectionId: 'col-team-3',
        collectionName: 'Platform Incident Retrospectives & Post-Mortems',
        allocatedGb: 25,
      },
    ],
  },
  {
    teamId: 'team-ai',
    teamName: 'Core AI Infrastructure',
    teamLeader: {
      name: 'Dr. Soraya Chen',
      email: 'soraya.chen@enterprise.internal',
    },
    allocatedGb: 90, // Allocated by Admin
    collectionAllocations: [
      {
        collectionId: 'col-team-2',
        collectionName: 'Search & Retrieval RAG Pipeline Specs',
        allocatedGb: 55,
      },
      {
        collectionId: 'col-team-4',
        collectionName: 'Vector Embedding Benchmarks & Model Weights',
        allocatedGb: 25,
      },
    ],
  },
  {
    teamId: 'team-sec',
    teamName: 'Security & Governance',
    teamLeader: {
      name: 'Security Architecture Council',
      email: 'sec-council@enterprise.internal',
    },
    allocatedGb: 50, // Allocated by Admin
    collectionAllocations: [
      {
        collectionId: 'col-team-sec-1',
        collectionName: 'Zero Trust Threat Models & Cryptographic Key Audits',
        allocatedGb: 35,
      },
    ],
  },
];

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-mine-1',
    name: 'Personal Research & Architecture RFCs',
    description: 'Working drafts, benchmarking experiments, and draft architectural decision records.',
    scope: 'mine',
    allocatedGb: 3,
    createdBy: {
      name: 'Elena Rostova',
      email: 'elena.rostova@enterprise.internal',
    },
    createdAt: '2026-08-12T14:30:00Z',
    updatedAt: '2026-09-22T09:15:00Z',
    documentCount: 2,
    totalChunks: 14,
    tags: ['Architecture', 'RFC', 'Drafts'],
    colorTheme: 'blue',
  },
  {
    id: 'col-mine-2',
    name: 'Vector Retrieval Optimization Sandbox',
    description: 'Experimental chunking strategies, hybrid BM25 + embedding latency profiling.',
    scope: 'mine',
    allocatedGb: 2,
    createdBy: {
      name: 'Elena Rostova',
      email: 'elena.rostova@enterprise.internal',
    },
    createdAt: '2026-09-01T11:00:00Z',
    updatedAt: '2026-09-21T18:40:00Z',
    documentCount: 1,
    totalChunks: 7,
    tags: ['Vector Search', 'Benchmarking'],
    colorTheme: 'indigo',
  },
  {
    id: 'col-org-1',
    name: 'Enterprise Zero Trust & Identity Standards',
    description: 'Official corporate specifications for mTLS, token delegation, and identity federation.',
    scope: 'org',
    allocatedGb: 75,
    createdBy: {
      name: 'Security Architecture Council',
      email: 'sec-council@enterprise.internal',
    },
    createdAt: '2026-05-10T08:00:00Z',
    updatedAt: '2026-09-18T16:20:00Z',
    documentCount: 3,
    totalChunks: 22,
    tags: ['Security', 'Zero Trust', 'Identity', 'Governance'],
    colorTheme: 'emerald',
  },
  {
    id: 'col-org-2',
    name: 'Global SOC 2 & ISO 27001 Compliance Baseline',
    description: 'Mandatory technical controls, cryptographic audit logging, and automated compliance policies.',
    scope: 'org',
    allocatedGb: 50,
    createdBy: {
      name: 'Chief Risk Officer Office',
      email: 'risk-audit@enterprise.internal',
    },
    createdAt: '2026-04-14T10:00:00Z',
    updatedAt: '2026-09-15T12:00:00Z',
    documentCount: 2,
    totalChunks: 16,
    tags: ['Compliance', 'SOC 2', 'ISO 27001', 'Audits'],
    colorTheme: 'slate',
  },
  {
    id: 'col-team-1',
    name: 'Core Platform Kubernetes & Service Mesh',
    description: 'Ingress topology, Envoy Gateway rate limits, eBPF telemetry, and multi-region failover runbooks.',
    scope: 'team',
    teamName: 'Platform Infrastructure',
    allocatedGb: 45,
    createdBy: {
      name: 'Marcus Vance',
      email: 'marcus.vance@enterprise.internal',
    },
    createdAt: '2026-06-20T09:30:00Z',
    updatedAt: '2026-09-20T14:45:00Z',
    documentCount: 3,
    totalChunks: 24,
    tags: ['Kubernetes', 'Service Mesh', 'Envoy Gateway', 'SLA 99.99%'],
    colorTheme: 'cyan',
  },
  {
    id: 'col-team-2',
    name: 'Search & Retrieval RAG Pipeline Specs',
    description: 'Chunking token bounds, dense embedding ingestion, top-K retrieval depth, and citation deep-linking rules.',
    scope: 'team',
    teamName: 'Core AI Infrastructure',
    allocatedGb: 55,
    createdBy: {
      name: 'Dr. Soraya Chen',
      email: 'soraya.chen@enterprise.internal',
    },
    createdAt: '2026-07-02T13:00:00Z',
    updatedAt: '2026-09-23T04:10:00Z',
    documentCount: 3,
    totalChunks: 26,
    tags: ['Search', 'Retrieval', 'Embeddings', 'Vector Indexing'],
    colorTheme: 'violet',
  },
];

// Raw documents to initialize
const rawDocsData: Array<{
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
  summary: string;
  entities: string[];
  crossReferences: string[];
  semanticTopics: string[];
  scope: 'mine' | 'team' | 'org';
  rawPages: { pageNumber: number; header?: string; content: string }[];
}> = [
  {
    id: 'doc-zt-01',
    collectionId: 'col-org-1',
    title: 'Enterprise Zero Trust & Service-to-Service mTLS Specification v3.2',
    filename: 'SEC-SPEC-2026-ZeroTrust-mTLS.pdf',
    fileType: 'pdf',
    source: 'drive',
    drivePath: '/Security & Governance/SEC-SPEC-2026-ZeroTrust-mTLS.pdf',
    uploadedAt: '2026-09-18T16:20:00Z',
    uploadedBy: 'Security Architecture Council',
    sizeBytes: 2450000,
    summary: 'Defines mandatory bidirectional TLS 1.3 encryption, SPIFFE/SPIRE workload identities, and continuous token verification across all enterprise microservices.',
    entities: ['Zero Trust', 'mTLS', 'TLS 1.3', 'Role-Based Access Control', 'Secret Manager'],
    crossReferences: ['doc-soc2-01', 'doc-mesh-01'],
    semanticTopics: ['Authentication', 'Zero Trust', 'Transport Encryption', 'Identity'],
    scope: 'org',
    rawPages: [
      {
        pageNumber: 1,
        header: '1. Executive Summary & Zero Trust Tenets',
        content: `### 1. Executive Summary & Zero Trust Tenets

This specification mandates architectural compliance for all synchronous and asynchronous service-to-service communication across company networks. Perimeter firewalls alone are explicitly deemed insufficient under the revised 2026 Zero Trust Security Framework.

Every ingress connection must present a cryptographically verified X.509 client certificate issued by the internal enterprise Root CA through SPIRE agents. Implicit trust based on network topology or private subnet IP range is strictly forbidden.

### 1.2 Cryptographic Cipher Suites & Protocol Enforcement
All transport layers must enforce TLS 1.3 exclusively. Legacy ciphers including RSA key exchange and CBC-mode ciphers are disabled in the base Envoy container images. Permitted ciphers are restricted to:
- TLS_AES_256_GCM_SHA384
- TLS_CHACHA20_POLY1305_SHA256

Workload identity validation occurs on each handshake, verifying SAN URIs against registered service identities before session establishment.`
      },
      {
        pageNumber: 2,
        header: '2. Token Delegation & OAuth 2.1 Mutual Attestation',
        content: `### 2. Token Delegation & OAuth 2.1 Mutual Attestation

Downstream services receiving user-initiated requests must preserve security context via short-lived, cryptographically bound tokens under the OAuth 2.1 and OpenID Connect specifications.

Workload services must never forward raw end-user bearer tokens directly across inter-tier boundaries. Instead, microservices must exchange the original user assertion for an ephemeral scoped delegation token issued by the Identity Federation Gateway.

### 2.3 Secret Management & Key Rotation Latency
All private keys and signing credentials must be managed exclusively through the enterprise Secret Manager with automated 7-day key rotation. Manual provisioning of persistent credentials onto host filesystems constitutes an automatic audit failure under SOC 2 Type II controls.

In the event of key compromise, revocation lists are propagated to edge ingress points within 45 seconds via Redis cluster pub/sub channels.`
      },
      {
        pageNumber: 3,
        header: '3. Enforcement Boundaries & Audit Telemetry',
        content: `### 3. Enforcement Boundaries & Audit Telemetry

The platform boundary enforcement is implemented at the Envoy Gateway level. Each inbound packet is inspected by eBPF filter programs running in the Linux kernel space prior to application socket dispatch.

Role-Based Access Control policies are evaluated against Open Policy Agent (OPA) bundles compiled into WebAssembly bytecode for sub-millisecond evaluation latency.

### 3.2 Audit Log Immutability
All authentication handshakes and authorization decisions generate structured JSON audit records forwarded to the centralized security data lake. Records are digitally signed using AES-256-GCM and stored under write-once-read-many (WORM) storage retention for 7 years.`
      }
    ]
  },
  {
    id: 'doc-soc2-01',
    collectionId: 'col-org-2',
    title: 'SOC 2 Type II Technical Control Implementation Guide',
    filename: 'AUDIT-SOC2-TypeII-TechnicalGuide.pdf',
    fileType: 'pdf',
    source: 'upload',
    uploadedAt: '2026-09-15T12:00:00Z',
    uploadedBy: 'Chief Risk Officer Office',
    sizeBytes: 1890000,
    summary: 'Technical evidence requirements, continuous automated audit scripts, access review cadence, and incident response SLA compliance.',
    entities: ['SOC 2 Type II', 'ISO 27001', 'Role-Based Access Control', 'AES-256-GCM', 'SLA 99.99%'],
    crossReferences: ['doc-zt-01'],
    semanticTopics: ['Compliance', 'Auditing', 'Risk Management', 'Security Controls'],
    scope: 'org',
    rawPages: [
      {
        pageNumber: 1,
        header: '1. Trust Services Criteria & Evidence Collection',
        content: `### 1. Trust Services Criteria & Evidence Collection

This document specifies the technical implementation requirements for meeting the AICPA Trust Services Criteria, specifically Security, Availability, and Confidentiality.

All production systems must emit tamper-evident audit trails. Automated compliance monitors verify daily that access permissions match current human resource employment records.

### 1.1 Access Control & Privilege De-escalation
Access to production infrastructure is restricted to ephemeral just-in-time credentials with a maximum time-to-live of 4 hours. Role-Based Access Control hierarchies must follow the principle of least privilege.

Elevated administrative operations require dual-operator approval and produce high-priority alerts broadcast to the SecOps incident channel.`
      },
      {
        pageNumber: 2,
        header: '2. Encryption at Rest and in Transit Standards',
        content: `### 2. Encryption at Rest and in Transit Standards

Per control CC6.1 and CC6.6, data containing sensitive enterprise intellectual property or customer records must be encrypted both in transit and at rest using AES-256-GCM or equivalent NIST-approved algorithms.

Customer database tables must use envelope encryption with customer-managed keys (CMEK) rotated annually. Backup archives must be stored across geographically separated availability zones with SLA 99.99% durability.

### 2.2 Continuous Automated Compliance Verification
Automated compliance scripts run every 6 hours via scheduled cron jobs, querying cluster states and database configuration parameters to verify compliance with ISO 27001 annexes.`
      }
    ]
  },
  {
    id: 'doc-mesh-01',
    collectionId: 'col-team-1',
    title: 'Kubernetes Cluster Federation & Envoy Service Mesh Architecture',
    filename: 'INFRA-RFC-Kubernetes-Mesh-2026.docx',
    fileType: 'docx',
    source: 'drive',
    drivePath: '/Infrastructure Runbooks/INFRA-RFC-Kubernetes-Mesh-2026.docx',
    uploadedAt: '2026-09-20T14:45:00Z',
    uploadedBy: 'Marcus Vance',
    sizeBytes: 3100000,
    summary: 'Multi-cluster Kubernetes topology, Envoy Gateway routing algorithms, connection pooling, and circuit breaker configurations.',
    entities: ['Kubernetes', 'Envoy Gateway', 'eBPF', 'Prometheus', 'Grafana', 'SLA 99.99%'],
    crossReferences: ['doc-zt-01', 'doc-rag-01'],
    semanticTopics: ['Kubernetes', 'Service Mesh', 'Networking', 'Infrastructure'],
    scope: 'team',
    rawPages: [
      {
        pageNumber: 1,
        header: '1. Cluster Topology & Node Architecture',
        content: `### 1. Cluster Topology & Node Architecture

Our core production platform runs across three geographically distributed Kubernetes clusters in active-active configuration. Worker nodes are provisioned with 64-core AMD EPYC processors and NVMe local scratch storage to support high-throughput I/O.

Networking is driven by Cilium using eBPF for direct kernel routing, bypassing legacy iptables packet processing bottlenecks.

### 1.2 Ingress Gateway & Connection Pooling
The edge ingress utilizes Envoy Gateway with advanced connection pooling. Inbound gRPC and HTTPS connections are pooled with keep-alive timeouts set to 300 seconds.

Circuit breakers trigger when downstream error rates exceed 3% over a 10-second rolling window, diverting non-critical traffic to degraded mode caches.`
      },
      {
        pageNumber: 2,
        header: '2. Telemetry, Prometheus & SLA Guarantees',
        content: `### 2. Telemetry, Prometheus & SLA Guarantees

Observability is maintained through OpenTelemetry collectors streaming metric traces to Prometheus and Grafana dashboards. The service level agreement commits to SLA 99.99% uptime for Tier-1 customer-facing API endpoints.

P99 latency must not exceed 65ms across all intra-region calls. Health probes execute every 5 seconds; unviable pods are drained within 15 seconds.`
      }
    ]
  },
  {
    id: 'doc-rag-01',
    collectionId: 'col-team-2',
    title: 'Vector Search & Document Chunk Retrieval Pipeline v4',
    filename: 'AI-SPEC-RAG-Retrieval-Pipeline.md',
    fileType: 'md',
    source: 'upload',
    uploadedAt: '2026-09-23T04:10:00Z',
    uploadedBy: 'Dr. Soraya Chen',
    sizeBytes: 1420000,
    summary: 'Specifications for token-sized document chunking, HNSW vector indexing in pgvector, hybrid BM25 retrieval, and exact page deep-linking.',
    entities: ['Vector Indexing', 'HNSW', 'pgvector', 'PostgreSQL', 'Redis'],
    crossReferences: ['doc-mesh-01', 'doc-bench-01'],
    semanticTopics: ['Search', 'Vector Indexing', 'Retrieval', 'Embeddings'],
    scope: 'team',
    rawPages: [
      {
        pageNumber: 1,
        header: '1. Document Ingestion & Chunking Boundaries',
        content: `### 1. Document Ingestion & Chunking Boundaries

The retrieval engine ingests documents by first parsing logical page layouts, maintaining exact start and end byte offsets. Documents are partitioned into token-sized chunks ranging from 150 to 220 tokens with a 25-token sliding window overlap.

Preserving character offsets is vital for user interface deep-linking. When a user clicks a citation in the search results, the client application must navigate directly to the exact page and highlight the matching sentence span inline.

### 1.3 Tokenizer Configuration
The chunking subsystem applies standard BPE tokenization. Boundary detection prioritizes section headings (H1/H2/H3), paragraph breaks, and semantic punctuation to prevent breaking mid-sentence across technical specifications.`
      },
      {
        pageNumber: 2,
        header: '2. Vector Indexing with HNSW in PostgreSQL (pgvector)',
        content: `### 2. Vector Indexing with HNSW in PostgreSQL (pgvector)

Vector embeddings are generated using high-dimensional dense representations (768 or 1536 dimensions) and stored in PostgreSQL using the pgvector extension.

We construct Hierarchical Navigable Small World (HNSW) indexes with parameters m=16 and ef_construction=128. This delivers sub-15ms nearest-neighbor queries while maintaining over 97% recall across enterprise knowledge bases exceeding 5 million chunks.

### 2.4 Hybrid Retrieval Strategy (BM25 + Dense Vectors)
Dense vector similarity alone often misses exact acronyms or model numbers (such as "mTLS 1.3" or "SOC 2 Type II"). Therefore, our search engine utilizes reciprocal rank fusion (RRF) combining BM25 keyword match with cosine vector similarity.`
      },
      {
        pageNumber: 3,
        header: '3. Retrieval Depth & Citation Verification',
        content: `### 3. Retrieval Depth & Citation Verification

Users can adjust the chunk retrieval depth (Top-K control) based on their analytical requirements. Standard operational queries operate at Top-K=5, whereas comprehensive compliance reviews set Top-K=15 or Top-K=20.

Every retrieved chunk returned by the API must include citation metadata: document title, page number, chunk index, scope tier, and semantic match confidence score.

The user interface must render these citations with high legibility, enabling researchers to instantly verify source provenance without hunting through lengthy manuals.`
      }
    ]
  },
  {
    id: 'doc-bench-01',
    collectionId: 'col-mine-1',
    title: 'PostgreSQL vs pgvector Latency & Memory Profiling Report',
    filename: 'BENCH-PostgreSQL-pgvector-Memory.report',
    fileType: 'report',
    source: 'upload',
    uploadedAt: '2026-09-22T09:15:00Z',
    uploadedBy: 'Elena Rostova',
    sizeBytes: 980000,
    summary: 'Empirical benchmarks comparing HNSW index memory footprint versus IVF-Flat under concurrent query workloads in PostgreSQL.',
    entities: ['PostgreSQL', 'pgvector', 'HNSW', 'Redis'],
    crossReferences: ['doc-rag-01'],
    semanticTopics: ['Database', 'Vector Indexing', 'Benchmarking', 'Performance'],
    scope: 'mine',
    rawPages: [
      {
        pageNumber: 1,
        header: '1. Benchmark Methodology & Hardware Specs',
        content: `### 1. Benchmark Methodology & Hardware Specs

This report summarizes performance benchmarks executed on dedicated bare-metal instances running PostgreSQL 17 with the pgvector 0.7.0 extension. Test vectors consisted of 1,000,000 synthetic 768-dimensional embeddings.

We measured index build time, RAM saturation, and P95/P99 latency under concurrent simulated client threads ranging from 8 to 64 connections.

### 1.2 Memory Footprint Findings
HNSW indexes required approximately 1.4 GB of RAM per 100,000 vectors when configured with m=16. In contrast, IVF-Flat indexes consumed 70% less memory but exhibited a 4x latency degradation under high concurrency when index lists were searched.`
      },
      {
        pageNumber: 2,
        header: '2. Cache Warming & Redis Integration',
        content: `### 2. Cache Warming & Redis Integration

Query latency stabilizes dramatically when the top 10% most frequent chunk embeddings are cached in an in-memory Redis cluster. Average retrieval time dropped from 22ms to 3.8ms for repetitive analytical queries.

We recommend adopting a multi-tiered caching tier for enterprise collections with high user query concurrency.`
      }
    ]
  },
  {
    id: 'doc-rpo-01',
    collectionId: 'col-mine-1',
    title: 'Disaster Recovery RPO and RTO SLAs Architecture Note',
    filename: 'ARCH-DisasterRecovery-RPO-RTO.pdf',
    fileType: 'pdf',
    source: 'upload',
    uploadedAt: '2026-09-21T15:30:00Z',
    uploadedBy: 'Elena Rostova',
    sizeBytes: 1120000,
    summary: 'Target Recovery Point Objectives (RPO < 60s) and Recovery Time Objectives (RTO < 15m) for mission-critical relational datastores and vector indexes.',
    entities: ['RPO/RTO', 'PostgreSQL', 'Kafka', 'SLA 99.99%'],
    crossReferences: ['doc-zt-01', 'doc-mesh-01'],
    semanticTopics: ['Disaster Recovery', 'High Availability', 'Architecture'],
    scope: 'mine',
    rawPages: [
      {
        pageNumber: 1,
        header: '1. Target Recovery Objectives',
        content: `### 1. Target Recovery Objectives

For our Tier-1 customer platform, business continuity requirements dictate strict limits:
- Recovery Point Objective (RPO): Less than 60 seconds of committed transaction data loss.
- Recovery Time Objective (RTO): Automated failover completed within 15 minutes.

Continuous asynchronous streaming replication to secondary cloud regions is maintained via Kafka transaction logs with checksum validation.

### 1.2 Automated Failover Automation
Health orchestrators trigger automated DNS traffic rerouting if primary cluster heartbeats fail for 3 consecutive 10-second checks. Database replica promotion is validated by consensus before write leases are issued.`
      }
    ]
  },
  {
    id: 'doc-stream-01',
    collectionId: 'col-team-1',
    title: 'High-Throughput Kafka Event Mesh & Schema Registry Standards',
    filename: 'DATA-Kafka-EventMesh-Standards.md',
    fileType: 'md',
    source: 'drive',
    drivePath: '/Infrastructure Runbooks/DATA-Kafka-EventMesh-Standards.md',
    uploadedAt: '2026-09-17T11:00:00Z',
    uploadedBy: 'Marcus Vance',
    sizeBytes: 1650000,
    summary: 'Kafka partition sizing, consumer group balancing, Avro schema compatibility rules, and dead letter queue routing.',
    entities: ['Kafka', 'Kubernetes', 'gRPC', 'Protobuf'],
    crossReferences: ['doc-mesh-01'],
    semanticTopics: ['Data Streaming', 'Kafka', 'Architecture'],
    scope: 'team',
    rawPages: [
      {
        pageNumber: 1,
        header: '1. Partition Strategy & Consumer Groups',
        content: `### 1. Partition Strategy & Consumer Groups

Our event messaging backbone handles over 400,000 events per second during peak processing hours. Topic partitions are provisioned at 32 partitions minimum to ensure even distribution across consumer groups.

Message payload contracts are strictly governed by Schema Registry rules. Breaking schema modifications are rejected automatically at the CI/CD pipeline gate.

### 1.4 Dead Letter Queue (DLQ) & Error Handling
Unprocessable messages are directed to isolated Dead Letter Queues with exponential backoff retry policies. Telemetry alerts notify the responsible engineering team within 2 minutes of consecutive parsing failures.`
      }
    ]
  }
];

// Process raw docs through the chunker utility to produce realistic DocumentItem objects
export const INITIAL_DOCUMENTS: DocumentItem[] = rawDocsData.map((raw) => {
  const pages = chunkTextIntoPages(raw.id, raw.collectionId, raw.scope, raw.rawPages);
  const totalChunks = pages.reduce((acc, p) => acc + p.chunks.length, 0);

  return {
    id: raw.id,
    collectionId: raw.collectionId,
    title: raw.title,
    filename: raw.filename,
    fileType: raw.fileType,
    source: raw.source,
    drivePath: raw.drivePath,
    uploadedAt: raw.uploadedAt,
    uploadedBy: raw.uploadedBy,
    sizeBytes: raw.sizeBytes,
    pageCount: pages.length,
    chunkCount: totalChunks,
    summary: raw.summary,
    entities: raw.entities,
    crossReferences: raw.crossReferences,
    semanticTopics: raw.semanticTopics,
    pages,
  };
});

// Corporate Drive repository structure for the "Import from Drive" file picker modal
export const DRIVE_FOLDERS: DriveFolder[] = [
  { id: 'f-root', name: 'Company Drive', path: '/', parentId: null },
  { id: 'f-eng', name: 'Engineering & Architecture', path: '/Engineering & Architecture', parentId: 'f-root' },
  { id: 'f-sec', name: 'Security & Governance', path: '/Security & Governance', parentId: 'f-root' },
  { id: 'f-infra', name: 'Infrastructure Runbooks', path: '/Infrastructure Runbooks', parentId: 'f-root' },
  { id: 'f-compliance', name: 'Audits & Regulatory', path: '/Audits & Regulatory', parentId: 'f-root' },
];

export const DRIVE_FILES: DriveFile[] = [
  {
    id: 'drv-file-01',
    folderId: 'f-sec',
    title: 'Cloudflare Zero Trust & Cloud WAF Integration Guidelines 2026',
    filename: 'SEC-WAF-ZeroTrust-Guidelines.pdf',
    fileType: 'pdf',
    sizeBytes: 3420000,
    lastModified: '2026-09-19T14:10:00Z',
    author: 'Elena Rostova',
    previewSummary: 'Outlines edge SSL termination, bot management, rate-limiting policies, and origin mTLS certificates.',
    rawContent: {
      title: 'Cloudflare Zero Trust & Cloud WAF Integration Guidelines 2026',
      summary: 'Edge protection rules, IP reputation filtering, and origin certificate authentication.',
      entities: ['Zero Trust', 'mTLS', 'TLS 1.3', 'Envoy Gateway'],
      semanticTopics: ['Security', 'Zero Trust', 'Edge Computing'],
      pages: [
        {
          pageNumber: 1,
          header: '1. Edge Security & Cloudflare WAF Configuration',
          content: `### 1. Edge Security & Cloudflare WAF Configuration
All corporate web assets must route inbound traffic through our Cloudflare Enterprise edge before reaching internal Envoy Gateway endpoints.

DDoS mitigation thresholds are configured at 50,000 requests per second per IP block with automated managed challenge prompts.

### 1.2 Origin mTLS Authentication
Connections between Cloudflare edge servers and our ingress pods enforce bidirectional mTLS using authenticated Origin Certificates. Direct internet access to origin IP addresses is blocked by security group rules.`
        },
        {
          pageNumber: 2,
          header: '2. Bot Management & Rate Limiting Rules',
          content: `### 2. Bot Management & Rate Limiting Rules
Automated crawlers and bot traffic are classified using machine learning behavioral analysis. Verified enterprise partner bots receive tailored rate limit quotas of 2,000 requests per minute.

Any unexpected credential stuffing attempt triggers immediate IP throttling and audit events forwarded to our SIEM dashboard.`
        }
      ]
    }
  },
  {
    id: 'drv-file-02',
    folderId: 'f-eng',
    title: 'API Gateway Rate Limiting & Quota Management Specification',
    filename: 'ARCH-API-RateLimiting-Quotas.docx',
    fileType: 'docx',
    sizeBytes: 1980000,
    lastModified: '2026-09-12T10:45:00Z',
    author: 'Marcus Vance',
    previewSummary: 'Leaky bucket algorithms, Redis token bucket distributed counters, and tier-based developer quotas.',
    rawContent: {
      title: 'API Gateway Rate Limiting & Quota Management Specification',
      summary: 'Distributed rate limiting, sliding window counters, and tiered client quotas in Envoy.',
      entities: ['Envoy Gateway', 'Redis', 'Role-Based Access Control', 'SLA 99.99%'],
      semanticTopics: ['API Gateway', 'Rate Limiting', 'Networking', 'Performance'],
      pages: [
        {
          pageNumber: 1,
          header: '1. Rate Limiting Algorithm & Architecture',
          content: `### 1. Rate Limiting Algorithm & Architecture
We employ the Sliding Window Counter algorithm across all public API routes to mitigate burst traffic while guaranteeing fair resource allocation.

Rate limits are evaluated centrally using a clustered Redis tier with local in-memory fallback caches in Envoy sidecars to maintain sub-2ms response latency under heavy load.

### 1.3 Response Headers & Client Guidance
When clients exceed allotted request limits, the gateway returns HTTP 429 Too Many Requests alongside the standard RFC 6585 headers:
- X-RateLimit-Limit: 1000
- X-RateLimit-Remaining: 0
- Retry-After: 30`
        }
      ]
    }
  },
  {
    id: 'drv-file-03',
    folderId: 'f-infra',
    title: 'Disaster Recovery Automated Failover & Cold Standby Protocol',
    filename: 'INFRA-DR-Automated-Failover-Protocol.pdf',
    fileType: 'pdf',
    sizeBytes: 2850000,
    lastModified: '2026-09-08T18:20:00Z',
    author: 'Platform Ops Guild',
    previewSummary: 'Runbook for initiating multi-region failover, validating database synchronization, and executing emergency DNS changes.',
    rawContent: {
      title: 'Disaster Recovery Automated Failover & Cold Standby Protocol',
      summary: 'Protocol for cross-region data recovery, consensus failover, and verification checklists.',
      entities: ['RPO/RTO', 'PostgreSQL', 'Kubernetes', 'SLA 99.99%'],
      semanticTopics: ['Disaster Recovery', 'Infrastructure', 'Reliability'],
      pages: [
        {
          pageNumber: 1,
          header: '1. Disaster Declaration Criteria & Emergency Checklist',
          content: `### 1. Disaster Declaration Criteria & Emergency Checklist
A primary region disaster is declared when two or more core infrastructure availability zones experience complete loss of connectivity for greater than 10 minutes.

Incident commanders execute the automated failover sequence via secure CLI, initiating promotion of secondary PostgreSQL read replicas to primary write status.

### 1.2 Data Consistency Verification
Before accepting external customer traffic on secondary clusters, replication lag must be proven under the RPO threshold of 60 seconds. Storage integrity audits run automatically via checksum comparison.`
        }
      ]
    }
  },
  {
    id: 'drv-file-04',
    folderId: 'f-compliance',
    title: 'GDPR & CCPA Data Retention & Deletion Automation Architecture',
    filename: 'COMPLIANCE-GDPR-Data-Retention-2026.md',
    fileType: 'md',
    sizeBytes: 1540000,
    lastModified: '2026-09-04T16:00:00Z',
    author: 'Dr. Soraya Chen',
    previewSummary: 'Right-to-be-forgotten pipeline, automated PII scrubbing, cryptographically shredded backup keys.',
    rawContent: {
      title: 'GDPR & CCPA Data Retention & Deletion Automation Architecture',
      summary: 'Automated data subject access requests and cryptographic deletion pipelines.',
      entities: ['GDPR', 'HIPAA', 'PostgreSQL', 'Secret Manager', 'AES-256-GCM'],
      semanticTopics: ['Compliance', 'Privacy', 'Data Governance'],
      pages: [
        {
          pageNumber: 1,
          header: '1. Right to Be Forgotten Technical Implementation',
          content: `### 1. Right to Be Forgotten Technical Implementation
Under GDPR Article 17, consumer deletion requests must cascade across all persistent databases, analytical data warehouses, and vector chunk embeddings within 30 calendar days.

We implement cryptographic deletion: each user record is encrypted with a unique per-user key in Secret Manager. Deletion of the user's master key renders all historical database rows and chunk snippets permanently unrecoverable.`
        }
      ]
    }
  }
];

export const SAMPLE_SEARCH_QUERIES = [
  'Zero Trust mTLS architecture and cipher suites',
  'PostgreSQL vs pgvector HNSW memory benchmarks',
  'Retrieval depth chunk count and citation deep-linking',
  'Disaster recovery RPO and RTO SLAs',
  'SOC 2 Type II continuous audit controls and AES-256-GCM',
  'Kubernetes Envoy Gateway connection pooling and circuit breakers',
];
