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

import type { ContextSnapshot } from '../../types';

/**
 * Repository contract for context snapshot persistence.
 *
 * SEMANTIC OPERATIONS:
 * - save: Persist semantic snapshot (returns immutable ID)
 * - findByProject: Retrieve by semantic domain anchor
 * - search: Find by semantic meaning (summary + tags)
 * - findById: Retrieve single snapshot by ID (Layer 1: Causality)
 * - findRecent: Find contexts within time window (Layer 1: Dependency detection)
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
}
