/**
 * 🎯 SEMANTIC INTENT: Context Repository Port (Interface)
 *
 * PURPOSE: Define semantic contract for context persistence
 *
 * HEXAGONAL ARCHITECTURE:
 * - This is a PORT (interface) in hexagonal architecture
 * - Domain layer depends on this abstraction
 * - Infrastructure provides ADAPTERS (implementations)
 *
 * SEMANTIC ANCHORING:
 * - Contract expresses WHAT operations are needed
 * - No mention of HOW (D1, Postgres, etc.)
 * - Observable semantic operations only
 *
 * DEPENDENCY INVERSION:
 * - High-level domain doesn't depend on low-level infrastructure
 * - Both depend on this abstraction
 */

import type { ContextSnapshot, PredictionOutcome, ProjectWeights } from '../../types';

/**
 * Repository contract for context snapshot persistence.
 *
 * SEMANTIC OPERATIONS:
 * - save: Persist semantic snapshot (returns immutable ID)
 * - findByProject: Retrieve by semantic domain anchor
 * - findAll: Retrieve all contexts across projects (bounded)
 * - search: Find by semantic meaning (summary + tags)
 * - findById: Retrieve single snapshot by ID (Layer 1: Causality)
 * - findRecent: Find contexts within time window (Layer 1: Dependency detection)
 * - updateMemoryTier: Update tier classification (Layer 2: Memory Manager)
 * - updateAccessTracking: Update LRU metadata (Layer 2: Memory Manager)
 * - findByMemoryTier: Find contexts by tier (Layer 2: Memory Manager)
 * - delete: Remove a single context by ID (Layer 2: Memory pruning)
 * - recordPredictionOutcome: Record access event with component scores (Layer 4)
 * - findOutcomesByProject: Retrieve outcomes for weight tuning (Layer 4)
 * - getProjectWeights: Get learned weights for a project (Layer 4)
 * - saveProjectWeights: Upsert learned weights for a project (Layer 4)
 */
export interface IContextRepository {
  /**
   * 🎯 SEMANTIC INTENT: Persist context snapshot
   *
   * @param snapshot - Domain entity to persist
   * @returns Immutable identifier for reference
   */
  save(snapshot: ContextSnapshot): Promise<string>;

  /**
   * 🎯 SEMANTIC INTENT: Load contexts by semantic domain
   *
   * @param project - Semantic domain anchor
   * @param limit - Maximum results (bounded for safety)
   * @returns Contexts ordered by temporal semantic relevance (newest first)
   */
  findByProject(project: string, limit?: number): Promise<ContextSnapshot[]>;

  /**
   * 🎯 WAKE INTELLIGENCE: Load all contexts across projects (Layer 2: Memory Manager)
   *
   * PURPOSE: Enable cross-project tier recalculation and bulk operations
   *
   * OBSERVABLE QUERY:
   * - No project filter (all projects)
   * - Order by timestamp DESC (temporal relevance)
   * - Bounded limit (safety cap)
   *
   * @param limit - Maximum results (default: 1000)
   * @returns All contexts ordered by timestamp DESC
   */
  findAll(limit?: number): Promise<ContextSnapshot[]>;

  /**
   * 🎯 SEMANTIC INTENT: Search by semantic markers
   *
   * @param query - Semantic search terms
   * @param project - Optional domain filter
   * @returns Contexts matching semantic meaning (summary + tags)
   */
  search(query: string, project?: string): Promise<ContextSnapshot[]>;

  /**
   * 🎯 WAKE INTELLIGENCE: Find snapshot by ID (Layer 1: Causality Engine)
   *
   * PURPOSE: Enable causal chain reconstruction
   *
   * @param id - Immutable snapshot identifier
   * @returns Snapshot or null if not found
   */
  findById(id: string): Promise<ContextSnapshot | null>;

  /**
   * 🎯 WAKE INTELLIGENCE: Find recent contexts (Layer 1: Dependency Detection)
   *
   * PURPOSE: Auto-detect dependencies based on temporal proximity
   *
   * HEURISTIC:
   * - Find contexts in project before reference timestamp
   * - Look back N hours
   * - Order by recency (newest first)
   *
   * @param project - Project to search within
   * @param beforeTimestamp - Reference timestamp (ISO string)
   * @param hoursBack - How far back to search
   * @returns Recent contexts ordered newest first
   */
  findRecent(project: string, beforeTimestamp: string, hoursBack: number): Promise<ContextSnapshot[]>;

  /**
   * 🎯 WAKE INTELLIGENCE: Find recent contexts across ALL projects (Layer 1: Cross-project causality)
   *
   * PURPOSE: Detect cross-project dependencies based on temporal proximity.
   * Intentionally has no project filter — returns all recent work regardless of project.
   *
   * @param beforeTimestamp - Reference timestamp (ISO string)
   * @param hoursBack - How far back to search
   * @returns Recent contexts from all projects, ordered newest first
   */
  findRecentAcrossProjects(beforeTimestamp: string, hoursBack: number): Promise<ContextSnapshot[]>;

  /**
   * 🎯 WAKE INTELLIGENCE: Update memory tier (Layer 2: Memory Manager)
   *
   * PURPOSE: Reclassify snapshot based on current age
   *
   * OBSERVABLE OPERATION:
   * - Calculate tier from timestamp
   * - Update database row
   * - No side effects
   *
   * @param id - Snapshot identifier
   * @param memoryTier - New tier classification
   * @returns void
   */
  updateMemoryTier(id: string, memoryTier: string): Promise<void>;

  /**
   * 🎯 WAKE INTELLIGENCE: Update access tracking (Layer 2: Memory Manager)
   *
   * PURPOSE: Track LRU metadata when context is accessed
   *
   * OBSERVABLE OPERATION:
   * - Update last_accessed to current timestamp
   * - Increment access_count by 1
   * - No side effects
   *
   * @param id - Snapshot identifier
   * @returns void
   */
  updateAccessTracking(id: string): Promise<void>;

  /**
   * 🎯 WAKE INTELLIGENCE: Find contexts by memory tier (Layer 2: Memory Manager)
   *
   * PURPOSE: Enable tier-based queries (e.g., find EXPIRED for pruning)
   *
   * OBSERVABLE QUERY:
   * - Filter by memory tier
   * - Order by timestamp (oldest first for pruning)
   * - Limit results (bounded retrieval)
   *
   * @param memoryTier - Tier to filter by
   * @param limit - Maximum results
   * @returns Contexts in specified tier, ordered oldest first
   */
  findByMemoryTier(memoryTier: string, limit?: number): Promise<ContextSnapshot[]>;

  /**
   * 🎯 WAKE INTELLIGENCE: Update propagation metadata (Layer 3: Propagation Engine)
   *
   * PURPOSE: Persist prediction results to database
   *
   * OBSERVABLE OPERATION:
   * - Update prediction_score, last_predicted, predicted_next_access, propagation_reason
   * - Atomic operation
   * - No side effects
   *
   * @param id - Snapshot identifier
   * @param predictionScore - Composite prediction score (0.0-1.0)
   * @param lastPredicted - When prediction was calculated (ISO timestamp)
   * @param predictedNextAccess - Estimated next access time (ISO timestamp)
   * @param propagationReason - Array of prediction reasons
   * @returns void
   */
  updatePropagation(
    id: string,
    predictionScore: number,
    lastPredicted: string,
    predictedNextAccess: string | null,
    propagationReason: string[]
  ): Promise<void>;

  /**
   * 🎯 WAKE INTELLIGENCE: Find contexts by prediction score (Layer 3: Propagation Engine)
   *
   * PURPOSE: Retrieve high-value contexts for pre-fetching
   *
   * OBSERVABLE QUERY:
   * - Filter by minimum prediction score
   * - Order by score DESC (highest first)
   * - Optional project filter
   * - Limit results (bounded retrieval)
   *
   * @param minScore - Minimum prediction score threshold (0.0-1.0)
   * @param project - Optional project filter
   * @param limit - Maximum results
   * @returns Contexts with prediction score >= minScore, ordered highest first
   */
  findByPredictionScore(minScore: number, project?: string, limit?: number): Promise<ContextSnapshot[]>;

  /**
   * 🎯 WAKE INTELLIGENCE: Find stale predictions (Layer 3: Propagation Engine)
   *
   * PURPOSE: Identify contexts needing re-prediction
   *
   * OBSERVABLE QUERY:
   * - Find contexts with predictions older than threshold
   * - Order by last_predicted ASC (stalest first)
   * - Limit results (bounded retrieval)
   *
   * @param hoursStale - How many hours before prediction is considered stale
   * @param limit - Maximum results
   * @returns Contexts with stale predictions, ordered stalest first
   */
  findStalePredictions(hoursStale: number, limit?: number): Promise<ContextSnapshot[]>;

  /**
   * 🎯 WAKE INTELLIGENCE: Delete a context by ID (Layer 2: Memory Manager)
   *
   * PURPOSE: Permanent removal of expired/pruned contexts
   *
   * SAFETY CONTRACT:
   * - Only called from pruneExpiredContexts (EXPIRED tier only)
   * - Bounded by caller (max 100 per prune run)
   * - Irreversible — caller must verify tier before calling
   *
   * @param id - Snapshot identifier to permanently delete
   * @returns void
   */
  delete(id: string): Promise<void>;

  /**
   * 🎯 WAKE INTELLIGENCE: Record prediction outcome (Layer 4: Meta-Learning)
   *
   * PURPOSE: Capture component scores when a context is accessed, enabling
   * weight tuning toward whichever dimension best predicts access.
   *
   * FIRE-AND-FORGET: Called alongside memoryManager.trackAccess(), non-blocking.
   *
   * @param outcome - Outcome record with component scores
   */
  recordPredictionOutcome(outcome: PredictionOutcome): Promise<void>;

  /**
   * 🎯 WAKE INTELLIGENCE: Find prediction outcomes by project (Layer 4: Meta-Learning)
   *
   * PURPOSE: Retrieve outcomes for weight tuning calculation.
   *
   * @param project - Project to retrieve outcomes for
   * @param limit - Maximum outcomes to return (default: 100)
   * @returns Outcomes ordered newest first
   */
  findOutcomesByProject(project: string, limit?: number): Promise<PredictionOutcome[]>;

  /**
   * 🎯 WAKE INTELLIGENCE: Get learned weights for a project (Layer 4: Meta-Learning)
   *
   * PURPOSE: Retrieve per-project tuned weights for use in prediction scoring.
   * Returns null if not yet tuned — caller falls back to 0.4/0.3/0.3 defaults.
   *
   * @param project - Project to retrieve weights for
   * @returns Learned weights or null if project has no tuned weights yet
   */
  getProjectWeights(project: string): Promise<ProjectWeights | null>;

  /**
   * 🎯 WAKE INTELLIGENCE: Save learned weights for a project (Layer 4: Meta-Learning)
   *
   * PURPOSE: Upsert per-project weights after each tuning run.
   *
   * @param weights - New learned weights to persist
   */
  saveProjectWeights(weights: ProjectWeights): Promise<void>;
}
