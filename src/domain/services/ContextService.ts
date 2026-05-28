/**
 * 🎯 SEMANTIC INTENT: Context Management Domain Service
 *
 * PURPOSE: Orchestrate context operations with semantic preservation
 *
 * DOMAIN SERVICE RESPONSIBILITY:
 * - Coordinates AI enhancement + persistence
 * - Enforces business rules
 * - Maintains semantic integrity through transformations
 * - Pure business logic (no infrastructure dependencies)
 * - Integrates Wake Intelligence 3-layer brain architecture
 *
 * SEMANTIC ANCHORING:
 * - WHAT: Core business operations (save, load, search)
 * - WHY: Preserve conversation semantic meaning
 * - HOW: Coordinate domain entities + infrastructure ports
 *
 * WAKE INTELLIGENCE INTEGRATION:
 * - Layer 1 (Causality Engine): Track WHY contexts are saved
 *   - Auto-detect dependencies from temporal proximity
 *   - Build causal chains for decision reconstruction
 * - Layer 2 (Memory Manager): Track HOW relevant contexts are NOW
 *   - Classify by temporal relevance (ACTIVE, RECENT, ARCHIVED, EXPIRED)
 *   - LRU tracking for access patterns
 *   - Automatic pruning of expired contexts
 * - Layer 3 (Propagation Engine): Predict WHAT will be needed next
 *   - Composite scoring (temporal + causal + frequency)
 *   - Proactive pre-fetching optimization
 *   - Pattern-based prediction
 *
 * DEPENDENCY INVERSION:
 * - Depends on abstractions (IContextRepository, IAIProvider)
 * - Not tied to specific implementations (D1, Cloudflare AI, etc.)
 */

import type { IContextRepository } from '../../application/ports/IContextRepository';
import type { IAIProvider } from '../../application/ports/IAIProvider';
import type { IVectorRepository } from '../../application/ports/IVectorRepository';
import type { SaveContextInput, LoadContextInput, SearchContextInput, CausalGraph, CausalGraphNode, CausalGraphEdge, MemoryHealthReport, IngestRuneManifestInput, IngestRuneManifestResult } from '../../types';
import { ContextSnapshot } from '../models/ContextSnapshot';
import { CausalityService } from './CausalityService';
import { MemoryManagerService } from './MemoryManagerService';
import { PropagationService } from './PropagationService';
import { MetaLearningService } from './MetaLearningService';

/**
 * Domain service for context management operations.
 *
 * ORCHESTRATION:
 * - AI Enhancement → Causality Tracking → Domain Validation → Persistence
 * - Maintains semantic intent through each step
 * - Integrates Layer 2 (Memory Manager) for temporal relevance
 * - Integrates Layer 3 (Propagation Engine) for future prediction
 */
export class ContextService {
  private readonly causalityService: CausalityService;
  private readonly memoryManager: MemoryManagerService;
  private readonly propagationEngine: PropagationService;
  private readonly metaLearning: MetaLearningService;

  constructor(
    private readonly repository: IContextRepository,
    private readonly aiProvider: IAIProvider,
    private readonly vectorRepository?: IVectorRepository
  ) {
    this.causalityService = new CausalityService(repository);
    this.memoryManager = new MemoryManagerService(repository);
    this.propagationEngine = new PropagationService(repository, this.causalityService);
    this.metaLearning = new MetaLearningService(repository);
  }

  /**
   * 🎯 SEMANTIC INTENT: Preserve conversation context with AI enhancement
   *
   * BUSINESS FLOW:
   * 1. AI Enhancement: Raw content → Semantic summary + tags
   * 2. Causality Tracking: Record WHY + auto-detect dependencies (Layer 1)
   * 3. Domain Validation: Create snapshot entity (enforces rules)
   * 4. Persistence: Save to repository
   *
   * SEMANTIC PRESERVATION:
   * - Input: Verbose conversation content
   * - Transform: AI compression (meaning preserved)
   * - Output: Stored semantic snapshot with causal metadata
   *
   * WAKE INTELLIGENCE:
   * - Layer 1: Tracks action type, rationale, dependencies
   * - Auto-detects related contexts from last 1 hour
   *
   * @param input - Context to save with semantic content
   * @returns Saved snapshot with AI-enhanced metadata and causality
   */
  async saveContext(input: SaveContextInput): Promise<ContextSnapshot> {
    // Step 1: AI Enhancement - Extract semantic meaning
    const summary = await this.aiProvider.generateSummary(input.content);
    const tags = await this.aiProvider.generateTags(summary);

    // Step 2: Causality Tracking (Layer 1: Past)
    // If causality provided by caller, use it; otherwise create default
    const causality = input.causality || await this.causalityService.recordAction(
      'conversation',
      `Saved context for project: ${input.project}`,
      null,
      input.project,
      input.crossProject ?? false
    );

    // Step 3: Domain Entity Creation - Validate business rules
    // Merge authorType into metadata if provided (stored as metadata.authorType)
    const snapshotMetadata = input.authorType
      ? { ...(input.metadata ?? {}), authorType: input.authorType }
      : input.metadata;

    const snapshot = ContextSnapshot.create({
      project: input.project,
      summary,
      source: input.source,
      metadata: snapshotMetadata,
      tags,
      causality
    });

    // Step 4: Persistence - Delegate to infrastructure
    await this.repository.save(snapshot);

    // Layer 5: Embed summary for semantic search (fire-and-forget)
    this.embedAndUpsert(snapshot).catch(err => {
      console.error(`Failed to embed context ${snapshot.id}:`, err);
    });

    return snapshot;
  }

  /**
   * 🎯 SEMANTIC INTENT: Retrieve contexts by semantic domain
   *
   * BUSINESS RULES:
   * - Limit bounded to prevent resource exhaustion (max 10)
   * - Results ordered by temporal semantic relevance (newest first)
   *
   * LAYER 2 INTEGRATION:
   * - Automatically tracks access when contexts are retrieved
   * - Updates last_accessed timestamp and access_count
   *
   * @param input - Project filter and result limit
   * @returns Contexts ordered by timestamp DESC
   */
  async loadContext(input: LoadContextInput): Promise<ContextSnapshot[]> {
    const boundedLimit = Math.min(input.limit || 1, 10);
    const mode = input.personality_mode ?? 'historian';

    let results: ContextSnapshot[];

    if (mode === 'prophet') {
      // Prophet: rank by Layer 4 prediction score — highest predicted contexts first.
      // Falls back to recency order when no predictions exist yet.
      const byScore = await this.repository.findByPredictionScore(0.0, input.project, boundedLimit);
      results = byScore.length > 0
        ? byScore.map(r => ContextSnapshot.fromDatabase(r))
        : (await this.repository.findByProject(input.project, boundedLimit)).map(r => ContextSnapshot.fromDatabase(r));
    } else if (mode === 'archaeologist') {
      // Archaeologist: surface most-dormant contexts — sort by lastAccessed ASC,
      // null (never accessed) first. Fetches a wider pool to find the forgotten ones.
      const pool = await this.repository.findByProject(input.project, 50);
      results = pool
        .sort((a, b) => {
          if (!a.lastAccessed && !b.lastAccessed) return 0;
          if (!a.lastAccessed) return -1;
          if (!b.lastAccessed) return 1;
          return new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime();
        })
        .slice(0, boundedLimit)
        .map(r => ContextSnapshot.fromDatabase(r));
    } else {
      // Historian / Minimalist / Auditor: standard newest-first (auditor groups in presentation layer)
      results = (await this.repository.findByProject(input.project, boundedLimit)).map(r => ContextSnapshot.fromDatabase(r));
    }

    // Layer 2: Track access; Layer 4: Record outcome (both fire-and-forget)
    results.forEach(r => {
      this.memoryManager.trackAccess(r.id).catch(err => {
        console.error(`Failed to track access for ${r.id}:`, err);
      });
      this.metaLearning.recordOutcome(r).catch(err => {
        console.error(`Failed to record outcome for ${r.id}:`, err);
      });
    });

    return results;
  }

  /**
   * 🎯 SEMANTIC INTENT: Find contexts by semantic matching
   *
   * SEMANTIC SEARCH:
   * - Matches against summary (semantic essence)
   * - Matches against tags (categorization markers)
   * - Optional project scoping (domain filter)
   *
   * LAYER 2 INTEGRATION:
   * - Automatically tracks access for search results
   * - Updates last_accessed timestamp and access_count
   *
   * @param input - Search query and optional project filter
   * @returns Contexts matching semantic meaning
   */
  async searchContext(input: SearchContextInput): Promise<ContextSnapshot[]> {
    let results = await this.semanticSearch(input.query, input.project);
    const mode = input.personality_mode ?? 'historian';

    // Re-rank search results based on mode
    if (mode === 'prophet') {
      results = [...results].sort((a, b) =>
        (b.propagation?.predictionScore ?? 0) - (a.propagation?.predictionScore ?? 0)
      );
    } else if (mode === 'archaeologist') {
      results = [...results].sort((a, b) => {
        if (!a.lastAccessed && !b.lastAccessed) return 0;
        if (!a.lastAccessed) return -1;
        if (!b.lastAccessed) return 1;
        return new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime();
      });
    }

    // Layer 2: Track access; Layer 4: Record outcome (both fire-and-forget)
    results.forEach(r => {
      this.memoryManager.trackAccess(r.id).catch(err => {
        console.error(`Failed to track access for ${r.id}:`, err);
      });
      this.metaLearning.recordOutcome(r).catch(err => {
        console.error(`Failed to record outcome for ${r.id}:`, err);
      });
    });

    return results;
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Reconstruct reasoning for a decision (Layer 1)
   *
   * PURPOSE: Answer "Why did I do this?"
   *
   * LAYER 2 INTEGRATION:
   * - Tracks access when reasoning is reconstructed
   *
   * @param snapshotId - ID of snapshot to explain
   * @returns Human-readable reasoning with causal context
   */
  async reconstructReasoning(snapshotId: string): Promise<string> {
    // Layer 2: Track access (fire-and-forget)
    this.memoryManager.trackAccess(snapshotId).catch(err => {
      console.error(`Failed to track access for ${snapshotId}:`, err);
    });

    return await this.causalityService.reconstructReasoning(snapshotId);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Build causal chain from root to target (Layer 1)
   *
   * PURPOSE: Trace decision history backwards
   *
   * @param snapshotId - Target snapshot to trace back from
   * @returns Causal chain with root at index 0
   */
  async buildCausalChain(snapshotId: string) {
    return await this.causalityService.buildCausalChain(snapshotId);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Get causality statistics for project (Layer 1)
   *
   * PURPOSE: Analytics on causal tracking usage
   *
   * @param project - Project to analyze
   * @returns Statistics on action types, chain lengths, etc.
   */
  async getCausalityStats(project: string) {
    return await this.causalityService.getCausalityStats(project);
  }

  async getDownstreamDependents(snapshotId: string) {
    return await this.causalityService.getDownstreamDependents(snapshotId);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Get memory statistics for project (Layer 2)
   *
   * PURPOSE: Analytics on memory tier distribution
   *
   * @param project - Project to analyze
   * @returns Statistics on memory tier distribution
   */
  async getMemoryStats(project: string) {
    return await this.memoryManager.getMemoryStats(project);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Recalculate memory tiers (Layer 2)
   *
   * PURPOSE: Update stale tier classifications based on current time
   *
   * @param project - Optional project filter
   * @returns Number of contexts updated
   */
  async recalculateMemoryTiers(project?: string) {
    return await this.memoryManager.recalculateAllTiers(project);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Prune expired contexts (Layer 2)
   *
   * PURPOSE: Automatic cleanup of old, unused contexts
   *
   * @param limit - Maximum contexts to prune
   * @returns Number of contexts deleted
   */
  async pruneExpiredContexts(limit?: number) {
    return await this.memoryManager.pruneExpiredContexts(limit);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Update predictions for project (Layer 3)
   *
   * PURPOSE: Refresh predictions for all contexts in a project
   *
   * LAYER 3 INTEGRATION:
   * - Recalculates prediction scores
   * - Updates propagation metadata
   * - Enables pre-fetching optimization
   *
   * @param project - Project to update predictions for
   * @param staleThreshold - Hours before prediction is stale (default: 24)
   * @returns Number of contexts updated
   */
  async updatePredictions(project: string, staleThreshold?: number) {
    const weights = await this.metaLearning.getProjectWeights(project);
    return await this.propagationEngine.updateProjectPredictions(project, staleThreshold, undefined, weights);
  }

  async getLearningStats(project: string) {
    return await this.metaLearning.getLearningStats(project);
  }

  async reindexProject(project: string): Promise<number> {
    if (!this.vectorRepository) return 0;
    const contexts = await this.repository.findByProject(project, 1000);
    let indexed = 0;
    for (const context of contexts) {
      const vector = await this.aiProvider.generateEmbedding(context.summary);
      if (vector.length > 0) {
        await this.vectorRepository.upsert(context.id, vector, project);
        indexed++;
      }
    }
    return indexed;
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Get high-value contexts for pre-fetching (Layer 3)
   *
   * PURPOSE: Retrieve contexts most likely to be accessed soon
   *
   * USE CASE:
   * - Pre-fetch these contexts for faster retrieval
   * - Cache them in memory
   * - Prioritize in query results
   *
   * @param project - Project to search within
   * @param minScore - Minimum prediction score (default: 0.6)
   * @param limit - Maximum contexts (default: 10)
   * @returns High-value contexts ordered by prediction score
   */
  async getHighValueContexts(project: string, minScore?: number, limit?: number) {
    return await this.propagationEngine.getHighValueContexts(project, minScore, limit);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Refresh all stale predictions across all projects (Layer 3)
   *
   * PURPOSE: Called by scheduled cron — no project filter, operates globally
   *
   * @param staleThreshold - Hours before prediction is stale (default: 24)
   * @returns Number of contexts updated
   */
  async refreshStalePredictions(staleThreshold?: number): Promise<number> {
    return await this.propagationEngine.refreshAllStalePredictions(staleThreshold);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Get propagation statistics for project (Layer 3)
   *
   * PURPOSE: Analytics on prediction quality and patterns
   *
   * @param project - Project to analyze
   * @returns Statistics on prediction scores, reasons, accuracy
   */
  /**
   * 🎯 WAKE INTELLIGENCE v3.5.0: Get causal graph for a project (Visualization)
   *
   * Returns all contexts as nodes and their causal relationships as edges.
   * Suitable for D3/Mermaid graph rendering.
   */
  async getCausalGraph(project: string, limit = 200): Promise<CausalGraph> {
    const contexts = await this.repository.findByProject(project, limit);
    const contextIds = new Set(contexts.map(c => c.id));

    const nodes: CausalGraphNode[] = contexts.map(c => {
      let authorType: string | undefined;
      if (c.metadata) {
        try {
          const meta = JSON.parse(c.metadata) as Record<string, unknown>;
          if (typeof meta.authorType === 'string') authorType = meta.authorType;
        } catch { /* ignore */ }
      }
      return {
        id: c.id,
        project: c.project,
        summary: c.summary,
        actionType: c.causality?.actionType ?? 'conversation',
        memoryTier: c.memoryTier,
        timestamp: c.timestamp,
        authorType,
      };
    });

    const edges: CausalGraphEdge[] = [];
    for (const c of contexts) {
      if (c.causality?.causedBy && contextIds.has(c.causality.causedBy)) {
        edges.push({ from: c.causality.causedBy, to: c.id, type: 'caused_by' });
      }
      for (const depId of c.causality?.dependencies ?? []) {
        if (contextIds.has(depId) && depId !== c.causality?.causedBy) {
          edges.push({ from: depId, to: c.id, type: 'dependency' });
        }
      }
    }

    return { nodes, edges, nodeCount: nodes.length, edgeCount: edges.length };
  }

  /**
   * 🎯 WAKE INTELLIGENCE v3.5.0: Get consolidated memory health report
   *
   * Aggregates all 5 layers into a single diagnostic snapshot.
   * Replaces 4–5 separate tool calls with one.
   */
  async getMemoryHealth(project: string): Promise<MemoryHealthReport> {
    const [memory, causality, propagation, learning] = await Promise.all([
      this.memoryManager.getMemoryStats(project),
      this.causalityService.getCausalityStats(project),
      this.getPropagationStats(project),
      this.metaLearning.getLearningStats(project),
    ]);

    return {
      project,
      generatedAt: new Date().toISOString(),
      memory,
      causality,
      propagation,
      learning: {
        sampleSize: learning.sampleSize,
        lastTuned: learning.lastTuned,
        weights: {
          temporal: learning.currentWeights.temporalWeight,
          causal: learning.currentWeights.causalWeight,
          frequency: learning.currentWeights.frequencyWeight,
        },
      },
    };
  }

  /**
   * 🎯 WAKE INTELLIGENCE v3.5.0: Ingest a Rune manifest
   *
   * Parses a rune.schema.json and saves each binding's `?` intent
   * annotation as a Wake context — linking Rune governance to Wake causal memory.
   */
  async ingestRuneManifest(input: IngestRuneManifestInput): Promise<IngestRuneManifestResult> {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(input.manifest) as Record<string, unknown>;
    } catch {
      throw new Error('Invalid manifest: could not parse JSON');
    }

    const bindings = parsed.bindings as Record<string, Record<string, unknown>> | undefined;
    if (!bindings) return { ingested: 0, skipped: 0, bindings: [] };

    let ingested = 0;
    let skipped = 0;
    const ingestedNames: string[] = [];

    for (const [name, binding] of Object.entries(bindings)) {
      const intent = binding.intent as string | undefined;
      if (!intent) { skipped++; continue; }

      const runeType = (binding.rune as string) ?? '?';
      const content = `[rune:${runeType}] ${name}: ${intent}`;

      const bindingMeta: Record<string, unknown> = { runeType, bindingName: name };
      if (binding.type) bindingMeta.valueType = binding.type;
      if (binding.min !== undefined) bindingMeta.min = binding.min;
      if (binding.max !== undefined) bindingMeta.max = binding.max;
      if (binding.enum) bindingMeta.enum = binding.enum;

      await this.saveContext({
        project: input.project,
        content,
        source: input.source ?? 'rune-manifest',
        authorType: 'ai-compositor',
        metadata: bindingMeta,
        causality: {
          actionType: 'decision',
          rationale: intent,
          dependencies: [],
          causedBy: null,
        },
      });

      ingested++;
      ingestedNames.push(name);
    }

    return { ingested, skipped, bindings: ingestedNames };
  }

  private async semanticSearch(query: string, project?: string): Promise<ContextSnapshot[]> {
    if (this.vectorRepository) {
      const vector = await this.aiProvider.generateEmbedding(query);
      if (vector.length > 0) {
        const ids = await this.vectorRepository.query(vector, 10, project);
        if (ids.length > 0) {
          const snapshots = await Promise.all(ids.map(id => this.repository.findById(id)));
          return snapshots
            .filter((s): s is NonNullable<typeof s> => s !== null)
            .map(s => ContextSnapshot.fromDatabase(s));
        }
      }
    }
    // Fallback: keyword search
    const results = await this.repository.search(query, project);
    return results.map(r => ContextSnapshot.fromDatabase(r));
  }

  private async embedAndUpsert(snapshot: ContextSnapshot): Promise<void> {
    if (!this.vectorRepository) return;
    const vector = await this.aiProvider.generateEmbedding(snapshot.summary);
    if (vector.length === 0) return;
    await this.vectorRepository.upsert(snapshot.id, vector, snapshot.project);
  }

  async getPropagationStats(project: string) {
    // Get high-value contexts
    const highValue = await this.repository.findByPredictionScore(0.6, project, 100);

    // Calculate statistics
    const totalPredicted = highValue.filter(c => c.propagation !== null).length;
    const avgScore = totalPredicted > 0
      ? highValue.reduce((sum, c) => sum + (c.propagation?.predictionScore || 0), 0) / totalPredicted
      : 0;

    // Count reason frequencies
    const reasonCounts: Record<string, number> = {};
    highValue.forEach(c => {
      c.propagation?.propagationReason.forEach(reason => {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    });

    return {
      totalContexts: highValue.length,
      totalPredicted,
      averagePredictionScore: avgScore,
      reasonFrequency: reasonCounts,
    };
  }
}
