import {
  Collection,
  DocumentChunk,
  DocumentItem,
  EdgeDefinitionMode,
  GraphEdge,
  GraphNode,
  SearchQueryOptions,
  SearchResultChunk,
} from '../types';

export function executeChunkSearch(
  options: SearchQueryOptions,
  documents: DocumentItem[],
  collections: Collection[]
): {
  results: SearchResultChunk[];
  totalChunksEvaluated: number;
  durationMs: number;
} {
  const startTime = performance.now();
  const query = options.query.trim().toLowerCase();
  const queryTerms = query
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const collectionMap = new Map<string, Collection>(collections.map((c) => [c.id, c]));
  const documentMap = new Map<string, DocumentItem>(documents.map((d) => [d.id, d]));

  // Flatten chunks across eligible documents based on scope and collection
  const allCandidateChunks: { chunk: DocumentChunk; doc: DocumentItem; collection: Collection }[] = [];

  for (const doc of documents) {
    const col = collectionMap.get(doc.collectionId);
    if (!col) continue;

    // Filter by specific collection if requested
    if (options.collectionId && options.collectionId !== 'all' && doc.collectionId !== options.collectionId) {
      continue;
    }

    // Filter by scope
    if (options.scope === 'team' && col.scope !== 'team') {
      continue;
    }
    if (options.scope === 'org' && col.scope !== 'org') {
      continue;
    }

    for (const page of doc.pages) {
      for (const chunk of page.chunks) {
        allCandidateChunks.push({
          chunk,
          doc,
          collection: col,
        });
      }
    }
  }

  const totalChunksEvaluated = allCandidateChunks.length;

  if (queryTerms.length === 0) {
    // If no query, return top-K most recent chunks
    const results: SearchResultChunk[] = allCandidateChunks.slice(0, options.topK).map((item) => ({
      chunk: item.chunk,
      document: item.doc,
      collection: item.collection,
      score: 0.75,
      bm25Score: 0.7,
      semanticScore: 0.8,
      highlightIndices: [],
    }));

    return {
      results,
      totalChunksEvaluated,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  // Calculate scores for each chunk
  const scoredChunks: {
    item: { chunk: DocumentChunk; doc: DocumentItem; collection: Collection };
    score: number;
    bm25: number;
    semantic: number;
    matches: [number, number][];
  }[] = [];

  for (const item of allCandidateChunks) {
    const textLower = item.chunk.snippet.toLowerCase();
    const headingLower = item.chunk.sectionHeading.toLowerCase();
    const entitiesLower = item.chunk.entities.map((e) => e.toLowerCase());
    const docTitleLower = item.doc.title.toLowerCase();

    let termMatches = 0;
    let exactPhraseBonus = 0;
    const matches: [number, number][] = [];

    // Exact phrase match check
    if (query.length > 3 && textLower.includes(query)) {
      exactPhraseBonus = 0.35;
      let pos = textLower.indexOf(query);
      while (pos !== -1 && matches.length < 5) {
        matches.push([pos, pos + query.length]);
        pos = textLower.indexOf(query, pos + query.length);
      }
    }

    // Individual term frequency & coverage
    for (const term of queryTerms) {
      let termCount = 0;
      let index = textLower.indexOf(term);
      while (index !== -1) {
        termCount++;
        if (matches.length < 8) {
          matches.push([index, index + term.length]);
        }
        index = textLower.indexOf(term, index + term.length);
      }

      if (termCount > 0) {
        termMatches += 1 + Math.log(termCount);
      }

      // Bonus if matched heading or entity or doc title
      if (headingLower.includes(term)) termMatches += 1.2;
      if (entitiesLower.some((e) => e.includes(term))) termMatches += 1.5;
      if (docTitleLower.includes(term)) termMatches += 0.8;
    }

    const termCoverageRatio = queryTerms.length > 0 ? Math.min(1, termMatches / (queryTerms.length * 1.8)) : 0;
    const bm25Score = Math.min(1, (termMatches * 0.15) + (termCoverageRatio * 0.45));

    // Semantic simulated similarity based on entity & keyword overlaps
    const chunkKeywords = new Set(item.chunk.keywords.map((k) => k.toLowerCase()));
    let keywordOverlap = 0;
    for (const term of queryTerms) {
      if (chunkKeywords.has(term)) keywordOverlap += 1;
    }
    const semanticScore = Math.min(1, (keywordOverlap / Math.max(1, queryTerms.length)) * 0.6 + exactPhraseBonus);

    // Hybrid score
    const finalScore = Math.min(0.99, Number((bm25Score * 0.65 + semanticScore * 0.35 + exactPhraseBonus).toFixed(3)));

    if (finalScore >= (options.minScoreThreshold ?? 0.12)) {
      scoredChunks.push({
        item,
        score: finalScore,
        bm25: Math.min(1, Number(bm25Score.toFixed(3))),
        semantic: Math.min(1, Number(semanticScore.toFixed(3))),
        matches,
      });
    }
  }

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  // Slice to Top-K as requested by retrieval depth chunk count control
  const topKResults = scoredChunks.slice(0, options.topK).map((sc) => ({
    chunk: sc.item.chunk,
    document: sc.item.doc,
    collection: sc.item.collection,
    score: sc.score,
    bm25Score: sc.bm25,
    semanticScore: sc.semantic,
    highlightIndices: sc.matches,
  }));

  const durationMs = Math.max(4, Math.round(performance.now() - startTime));

  return {
    results: topKResults,
    totalChunksEvaluated,
    durationMs,
  };
}

export function computeDocumentGraph(
  documents: DocumentItem[],
  mode: EdgeDefinitionMode,
  threshold: number = 0.25
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    fileType: doc.fileType,
    chunkCount: doc.chunkCount,
    pageCount: doc.pageCount,
    entities: doc.entities,
    semanticTopics: doc.semanticTopics,
    collectionId: doc.collectionId,
  }));

  const edges: GraphEdge[] = [];

  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const docA = documents[i];
      const docB = documents[j];

      // 1. Shared entities
      const entitiesA = new Set(docA.entities);
      const sharedEntities = docB.entities.filter((e) => entitiesA.has(e));
      const entityWeight = sharedEntities.length / Math.max(1, Math.min(docA.entities.length, docB.entities.length));

      // 2. Semantic topic similarity (Jaccard)
      const topicsA = new Set(docA.semanticTopics);
      const sharedTopics = docB.semanticTopics.filter((t) => topicsA.has(t));
      const unionTopics = new Set([...docA.semanticTopics, ...docB.semanticTopics]);
      const semanticWeight = unionTopics.size > 0 ? sharedTopics.length / unionTopics.size : 0;

      // 3. Cross-reference
      const aReferencesB =
        docA.crossReferences.includes(docB.id) ||
        docA.crossReferences.some((ref) => docB.title.toLowerCase().includes(ref.toLowerCase()));
      const bReferencesA =
        docB.crossReferences.includes(docA.id) ||
        docB.crossReferences.some((ref) => docA.title.toLowerCase().includes(ref.toLowerCase()));
      const crossRefWeight = aReferencesB || bReferencesA ? (aReferencesB && bReferencesA ? 1.0 : 0.7) : 0;

      let calculatedWeight = 0;
      const reasons: string[] = [];

      if (mode === 'entities') {
        calculatedWeight = entityWeight;
        if (sharedEntities.length > 0) {
          reasons.push(`Shared entities: ${sharedEntities.join(', ')}`);
        }
      } else if (mode === 'semantic') {
        calculatedWeight = semanticWeight;
        if (sharedTopics.length > 0) {
          reasons.push(`Shared topic domains: ${sharedTopics.join(', ')}`);
        }
      } else if (mode === 'cross-references') {
        calculatedWeight = crossRefWeight;
        if (aReferencesB) reasons.push(`"${docA.title}" references "${docB.title}"`);
        if (bReferencesA) reasons.push(`"${docB.title}" references "${docA.title}"`);
      } else {
        // Combined mode
        calculatedWeight = entityWeight * 0.45 + semanticWeight * 0.35 + crossRefWeight * 0.2;
        if (sharedEntities.length > 0) reasons.push(`${sharedEntities.length} shared entities (${sharedEntities.slice(0, 3).join(', ')})`);
        if (sharedTopics.length > 0) reasons.push(`Topics: ${sharedTopics.join(', ')}`);
        if (aReferencesB || bReferencesA) reasons.push('Direct architectural citation');
      }

      if (calculatedWeight >= threshold && (calculatedWeight > 0.05 || reasons.length > 0)) {
        edges.push({
          source: docA.id,
          target: docB.id,
          weight: Math.min(1, Number(calculatedWeight.toFixed(2))),
          reasons,
          type:
            mode === 'combined'
              ? 'hybrid'
              : mode === 'entities'
              ? 'entities'
              : mode === 'semantic'
              ? 'semantic'
              : 'cross-reference',
        });
      }
    }
  }

  return { nodes, edges };
}
