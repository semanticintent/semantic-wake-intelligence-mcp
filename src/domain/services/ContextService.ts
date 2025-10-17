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
import type { SaveContextInput, LoadContextInput, SearchContextInput } from '../../types';
import { ContextSnapshot } from '../models/ContextSnapshot';
import { CausalityService } from './CausalityService';
import { MemoryManagerService } from './MemoryManagerService';
import { PropagationService } from './PropagationService';

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

  constructor(
    private readonly repository: IContextRepository,
    private readonly aiProvider: IAIProvider
  ) {
    // Initialize Layer 1: Causality Engine
    this.causalityService = new CausalityService(repository);
    // Initialize Layer 2: Memory Manager
    this.memoryManager = new MemoryManagerService(repository);
    // Initialize Layer 3: Propagation Engine
    this.propagationEngine = new PropagationService(repository, this.causalityService);
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
      'conversation', // Default action type
      `Saved context for project: ${input.project}`, // Default rationale
      null, // No explicit parent
      input.project // Enable dependency detection
    );

    // Step 3: Domain Entity Creation - Validate business rules
    const snapshot = ContextSnapshot.create({
      project: input.project,
      summary,
      source: input.source,
      metadata: input.metadata,
      tags,
      causality
    });

    // Step 4: Persistence - Delegate to infrastructure
    await this.repository.save(snapshot);

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
    // Business rule: Bounded limit for safety
    const boundedLimit = Math.min(input.limit || 1, 10);

    const results = await this.repository.findByProject(input.project, boundedLimit);

    // Layer 2: Track access for each retrieved context
    // Fire-and-forget (don't await) to avoid blocking response
    results.forEach(r => {
      this.memoryManager.trackAccess(r.id).catch(err => {
        console.error(`Failed to track access for ${r.id}:`, err);
      });
    });

    return results.map(r => ContextSnapshot.fromDatabase(r));
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
    const results = await this.repository.search(input.query, input.project);

    // Layer 2: Track access for each search result
    // Fire-and-forget (don't await) to avoid blocking response
    results.forEach(r => {
      this.memoryManager.trackAccess(r.id).catch(err => {
        console.error(`Failed to track access for ${r.id}:`, err);
      });
    });

    return results.map(r => ContextSnapshot.fromDatabase(r));
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
    return await this.propagationEngine.updateProjectPredictions(project, staleThreshold);
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
   * 🎯 WAKE INTELLIGENCE: Get propagation statistics for project (Layer 3)
   *
   * PURPOSE: Analytics on prediction quality and patterns
   *
   * @param project - Project to analyze
   * @returns Statistics on prediction scores, reasons, accuracy
   */
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
