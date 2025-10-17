/**
 * 🎯 SEMANTIC INTENT: Context Snapshot Domain Entity
 *
 * PURPOSE: Encapsulate business rules for context snapshots
 *
 * DOMAIN-DRIVEN DESIGN:
 * - This is a DOMAIN ENTITY (has identity and lifecycle)
 * - Encapsulates business invariants
 * - Self-validating (enforces semantic completeness)
 * - Independent of infrastructure concerns
 *
 * SEMANTIC ANCHORING:
 * - Represents preserved conversation context
 * - Validates semantic requirements (project + summary required)
 * - Immutable once created (ID never changes)
 *
 * BUSINESS RULES:
 * 1. Project is required (semantic domain anchor)
 * 2. Summary is required (semantic essence)
 * 3. ID is immutable (referential integrity)
 * 4. Timestamp auto-generated (temporal anchor)
 * 5. Causality optional (Layer 1: Past tracking)
 * 6. Memory tier auto-calculated (Layer 2: Present relevance)
 * 7. LRU tracking via lastAccessed and accessCount (Layer 2: Present usage)
 *
 * WAKE INTELLIGENCE:
 * - Layer 1 (Causality Engine): Tracks WHY this was saved
 * - Layer 2 (Memory Manager): Tracks HOW relevant this is NOW
 */

import type { ContextSnapshot as IContextSnapshot, CausalityMetadata, SaveContextInput, MemoryTier, PropagationMetadata } from '../../types';
import { MemoryTier as MemoryTierEnum } from '../../types';

/**
 * Domain entity for context snapshots.
 *
 * IMMUTABILITY:
 * - All properties readonly
 * - Cannot be modified after creation
 * - Prevents accidental semantic violations
 */
export class ContextSnapshot implements IContextSnapshot {
  constructor(
    public readonly id: string,
    public readonly project: string,
    public readonly summary: string,
    public readonly source: string,
    public readonly metadata: string | null,
    public readonly tags: string,
    public readonly timestamp: string,
    public readonly causality: CausalityMetadata | null,
    public readonly memoryTier: MemoryTier,
    public readonly lastAccessed: string | null,
    public readonly accessCount: number,
    public readonly propagation: PropagationMetadata | null
  ) {
    this.validate();
  }

  /**
   * 🎯 SEMANTIC INTENT: Enforce business invariants
   *
   * BUSINESS RULES:
   * - Project cannot be empty (semantic domain anchor required)
   * - Summary cannot be empty (semantic essence required)
   */
  private validate(): void {
    if (!this.project || this.project.trim().length === 0) {
      throw new Error('Semantic violation: Project is required (domain anchor missing)');
    }

    if (!this.summary || this.summary.trim().length === 0) {
      throw new Error('Semantic violation: Summary is required (semantic essence missing)');
    }
  }

  /**
   * 🎯 SEMANTIC INTENT: Calculate memory tier based on timestamp
   *
   * PURPOSE: Determine temporal relevance (Layer 2: Memory Manager)
   *
   * OBSERVABLE ANCHORING:
   * - Decision purely based on age in hours
   * - Deterministic (same timestamp → same tier)
   * - No subjective interpretation
   *
   * MEMORY TIER THRESHOLDS:
   * - ACTIVE: < 1 hour (3,600,000 ms)
   * - RECENT: 1-24 hours (3,600,000 - 86,400,000 ms)
   * - ARCHIVED: 1-30 days (86,400,000 - 2,592,000,000 ms)
   * - EXPIRED: > 30 days (> 2,592,000,000 ms)
   *
   * @param timestamp - ISO 8601 timestamp string
   * @returns Memory tier classification
   */
  static calculateMemoryTier(timestamp: string): MemoryTier {
    const now = Date.now();
    const created = new Date(timestamp).getTime();
    const ageInHours = (now - created) / (1000 * 60 * 60);

    if (ageInHours < 1) return MemoryTierEnum.ACTIVE;
    if (ageInHours < 24) return MemoryTierEnum.RECENT;
    if (ageInHours < 720) return MemoryTierEnum.ARCHIVED; // 30 days
    return MemoryTierEnum.EXPIRED;
  }

  /**
   * 🎯 SEMANTIC INTENT: Factory method for creating new snapshots
   *
   * PURPOSE: Create valid context snapshot with business defaults
   *
   * SEMANTIC ANCHORING:
   * - Generates immutable ID
   * - Applies default source ('mcp')
   * - Auto-generates timestamp
   * - Serializes metadata to JSON
   * - Accepts optional causality metadata (Layer 1)
   * - Auto-calculates memory tier (Layer 2)
   * - Initializes LRU tracking fields (Layer 2)
   *
   * @param data - Input data with semantic content
   * @returns Valid, self-validated context snapshot
   */
  static create(data: {
    project: string;
    summary: string;
    source?: string;
    metadata?: Record<string, unknown>;
    tags: string;
    causality?: CausalityMetadata;
  }): ContextSnapshot {
    const timestamp = new Date().toISOString(); // Temporal semantic anchor
    const memoryTier = ContextSnapshot.calculateMemoryTier(timestamp); // Layer 2: Auto-classify

    return new ContextSnapshot(
      crypto.randomUUID(), // Immutable unique identifier
      data.project,
      data.summary,
      data.source || 'mcp', // Default provenance
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.tags,
      timestamp,
      data.causality || null, // Layer 1: Causality tracking
      memoryTier, // Layer 2: Memory tier
      null, // Layer 2: Not yet accessed
      0, // Layer 2: Zero access count
      null // Layer 3: No prediction yet
    );
  }

  /**
   * 🎯 SEMANTIC INTENT: Reconstitute from database
   *
   * PURPOSE: Create entity from persisted data
   *
   * NOTE: Assumes data already validated (from trusted source)
   *
   * @param data - Database row
   * @returns Domain entity
   */
  static fromDatabase(data: IContextSnapshot): ContextSnapshot {
    return new ContextSnapshot(
      data.id,
      data.project,
      data.summary,
      data.source,
      data.metadata,
      data.tags,
      data.timestamp,
      data.causality,
      data.memoryTier,
      data.lastAccessed,
      data.accessCount,
      data.propagation
    );
  }

  /**
   * 🎯 SEMANTIC INTENT: Mark context as accessed (LRU tracking)
   *
   * PURPOSE: Update access metadata when context is retrieved (Layer 2)
   *
   * IMMUTABLE PATTERN:
   * - Returns NEW instance with updated fields
   * - Original instance remains unchanged
   * - Prevents accidental mutation
   *
   * LRU TRACKING:
   * - Sets lastAccessed to current timestamp
   * - Increments accessCount by 1
   * - Preserves all other fields
   *
   * @returns New ContextSnapshot instance with updated access metadata
   */
  markAccessed(): ContextSnapshot {
    return new ContextSnapshot(
      this.id,
      this.project,
      this.summary,
      this.source,
      this.metadata,
      this.tags,
      this.timestamp,
      this.causality,
      this.memoryTier,
      new Date().toISOString(), // Layer 2: Update last accessed
      this.accessCount + 1, // Layer 2: Increment access count
      this.propagation // Layer 3: Preserve propagation
    );
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Calculate prediction score (Layer 3: Propagation Engine)
   *
   * PURPOSE: Predict likelihood of future access based on patterns
   *
   * COMPOSITE SCORING:
   * - 40% Temporal (access patterns over time)
   * - 30% Causal (position in causal chains)
   * - 30% Frequency (usage frequency)
   *
   * OBSERVABLE ANCHORING:
   * - All scores derived from timestamps and counts
   * - Deterministic calculation
   * - No subjective interpretation
   *
   * @param context - Context to score
   * @param causalStrength - Optional causal chain strength (0.0-1.0)
   * @returns Composite prediction score (0.0-1.0)
   */
  static calculatePropagationScore(
    context: ContextSnapshot,
    causalStrength: number = 0.0
  ): number {
    // Temporal score: Recent access → higher score
    const temporalScore = this.calculateTemporalScore(context);

    // Causal score: Part of causal chains → higher score
    const causalScore = causalStrength; // Passed from causal chain analysis

    // Frequency score: High access count → higher score
    const frequencyScore = this.calculateFrequencyScore(context);

    // Composite score (weighted average)
    const composite = (
      0.4 * temporalScore +
      0.3 * causalScore +
      0.3 * frequencyScore
    );

    // Clamp to [0.0, 1.0]
    return Math.max(0.0, Math.min(1.0, composite));
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Calculate temporal prediction score
   *
   * PURPOSE: Score based on recency and access patterns
   *
   * HEURISTICS:
   * - Recently accessed → high score
   * - Never accessed → low score
   * - Regular pattern (every N hours) → boost score
   *
   * @param context - Context to score
   * @returns Temporal score (0.0-1.0)
   */
  private static calculateTemporalScore(context: ContextSnapshot): number {
    if (!context.lastAccessed) {
      // Never accessed → base score from memory tier
      switch (context.memoryTier) {
        case MemoryTierEnum.ACTIVE: return 0.3;
        case MemoryTierEnum.RECENT: return 0.2;
        case MemoryTierEnum.ARCHIVED: return 0.1;
        case MemoryTierEnum.EXPIRED: return 0.0;
        default: return 0.0;
      }
    }

    // Calculate time since last access
    const now = Date.now();
    const lastAccessTime = new Date(context.lastAccessed).getTime();
    const hoursSinceAccess = (now - lastAccessTime) / (1000 * 60 * 60);

    // Decay score over time (inverse exponential)
    // Recent access (< 1 hour) → score 1.0
    // 24 hours ago → score ~0.37
    // 7 days ago → score ~0.0
    const decayScore = Math.exp(-hoursSinceAccess / 24);

    return decayScore;
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Calculate frequency prediction score
   *
   * PURPOSE: Score based on usage frequency
   *
   * HEURISTICS:
   * - High access count → high score
   * - Logarithmic scaling (10 accesses ≈ 0.5, 100 accesses ≈ 0.75)
   *
   * @param context - Context to score
   * @returns Frequency score (0.0-1.0)
   */
  private static calculateFrequencyScore(context: ContextSnapshot): number {
    if (context.accessCount === 0) return 0.0;

    // Logarithmic scaling: log(accessCount + 1) / log(101)
    // 0 accesses → 0.0
    // 10 accesses → ~0.5
    // 100 accesses → 1.0
    const score = Math.log(context.accessCount + 1) / Math.log(101);

    return Math.min(1.0, score);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Update propagation metadata
   *
   * PURPOSE: Create new instance with updated prediction data
   *
   * IMMUTABLE PATTERN:
   * - Returns NEW instance
   * - Original unchanged
   * - Preserves all other fields
   *
   * @param propagation - New propagation metadata
   * @returns New ContextSnapshot with updated propagation
   */
  updatePropagation(propagation: PropagationMetadata): ContextSnapshot {
    return new ContextSnapshot(
      this.id,
      this.project,
      this.summary,
      this.source,
      this.metadata,
      this.tags,
      this.timestamp,
      this.causality,
      this.memoryTier,
      this.lastAccessed,
      this.accessCount,
      propagation // Layer 3: Update propagation
    );
  }
}
