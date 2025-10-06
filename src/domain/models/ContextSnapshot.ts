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
 */

import type { ContextSnapshot as IContextSnapshot, SaveContextInput } from '../../types';

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
    public readonly timestamp: string
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
   * 🎯 SEMANTIC INTENT: Factory method for creating new snapshots
   *
   * PURPOSE: Create valid context snapshot with business defaults
   *
   * SEMANTIC ANCHORING:
   * - Generates immutable ID
   * - Applies default source ('mcp')
   * - Auto-generates timestamp
   * - Serializes metadata to JSON
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
  }): ContextSnapshot {
    return new ContextSnapshot(
      crypto.randomUUID(), // Immutable unique identifier
      data.project,
      data.summary,
      data.source || 'mcp', // Default provenance
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.tags,
      new Date().toISOString() // Temporal semantic anchor
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
      data.timestamp
    );
  }
}
