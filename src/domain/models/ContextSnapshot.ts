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

import type { ContextSnapshot as IContextSnapshot, CausalityMetadata, SaveContextInput, MemoryTier } from '../../types';
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
    public readonly accessCount: number
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
      0 // Layer 2: Zero access count
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
      data.accessCount
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
      this.accessCount + 1 // Layer 2: Increment access count
    );
  }
}
