/**
 * 🎯 SEMANTIC INTENT: D1 Database Adapter for Context Persistence
 *
 * PURPOSE: Implement IContextRepository using Cloudflare D1
 *
 * HEXAGONAL ARCHITECTURE:
 * - This is an ADAPTER (infrastructure implementation)
 * - Implements PORT (IContextRepository interface)
 * - Can be swapped with PostgresContextRepository, MongoContextRepository, etc.
 *
 * INFRASTRUCTURE RESPONSIBILITY:
 * - WHERE: Cloudflare D1 SQLite database
 * - HOW: SQL queries for CRUD operations
 * - PRESERVES: Domain semantic contracts
 *
 * SEMANTIC ANCHORING:
 * - Maps domain entities to database rows
 * - Preserves semantic meaning through transformation
 * - Maintains observable query patterns
 */

import type { IContextRepository } from '../../application/ports/IContextRepository';
import type { ContextSnapshot } from '../../types';

/**
 * D1-specific implementation of context persistence.
 *
 * TECHNICAL DETAILS:
 * - Uses D1 prepared statements for safety
 * - Temporal ordering via timestamp DESC
 * - LIKE queries for semantic search
 */
export class D1ContextRepository implements IContextRepository {
  constructor(private readonly db: D1Database) {}

  /**
   * 🎯 WAKE INTELLIGENCE: Deserialize causality metadata from database row
   *
   * PURPOSE: Convert stored JSON strings back to CausalityMetadata object
   *
   * @param row - Database row with causality columns
   * @returns ContextSnapshot with deserialized causality
   */
  private deserializeCausality(row: any): ContextSnapshot {
    const causality = row.action_type
      ? {
          actionType: row.action_type,
          rationale: row.rationale || '',
          dependencies: row.dependencies ? JSON.parse(row.dependencies) : [],
          causedBy: row.caused_by || null,
        }
      : null;

    return {
      id: row.id,
      project: row.project,
      summary: row.summary,
      source: row.source,
      metadata: row.metadata,
      tags: row.tags,
      timestamp: row.timestamp,
      causality,
    };
  }

  /**
   * 🎯 SEMANTIC INTENT: Persist context snapshot to D1
   *
   * TECHNICAL IMPLEMENTATION:
   * - INSERT INTO context_snapshots
   * - Returns generated ID for immutable reference
   * - Includes causality metadata (Layer 1: Past)
   */
  async save(snapshot: ContextSnapshot): Promise<string> {
    // Serialize causality metadata for storage
    const actionType = snapshot.causality?.actionType || null;
    const rationale = snapshot.causality?.rationale || null;
    const dependencies = snapshot.causality?.dependencies
      ? JSON.stringify(snapshot.causality.dependencies)
      : null;
    const causedBy = snapshot.causality?.causedBy || null;

    await this.db.prepare(
      `INSERT INTO context_snapshots
       (id, project, summary, source, metadata, tags, timestamp, action_type, rationale, dependencies, caused_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      snapshot.id,
      snapshot.project,
      snapshot.summary,
      snapshot.source,
      snapshot.metadata,
      snapshot.tags,
      snapshot.timestamp,
      actionType,
      rationale,
      dependencies,
      causedBy
    ).run();

    return snapshot.id;
  }

  /**
   * 🎯 SEMANTIC INTENT: Load contexts by semantic domain anchor
   *
   * OBSERVABLE PATTERN:
   * - Filter by project (semantic domain)
   * - Order by timestamp DESC (temporal relevance)
   * - Limit results (bounded retrieval)
   */
  async findByProject(project: string, limit: number = 10): Promise<ContextSnapshot[]> {
    const { results } = await this.db.prepare(
      `SELECT * FROM context_snapshots
       WHERE project = ?
       ORDER BY timestamp DESC
       LIMIT ?`
    ).bind(project, limit).all();

    if (!results) return [];
    return results.map(row => this.deserializeCausality(row));
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Find snapshot by ID (Layer 1: Causality Engine)
   *
   * PURPOSE: Enable causal chain reconstruction
   *
   * TECHNICAL IMPLEMENTATION:
   * - SELECT by ID (primary key lookup)
   * - Returns single snapshot or null
   */
  async findById(id: string): Promise<ContextSnapshot | null> {
    const { results } = await this.db.prepare(
      `SELECT * FROM context_snapshots WHERE id = ? LIMIT 1`
    ).bind(id).all();

    if (!results || results.length === 0) {
      return null;
    }

    return this.deserializeCausality(results[0]);
  }

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
   * TECHNICAL IMPLEMENTATION:
   * - Calculate cutoff time (beforeTimestamp - hoursBack)
   * - SELECT WHERE project AND timestamp in range
   * - ORDER BY timestamp DESC
   */
  async findRecent(
    project: string,
    beforeTimestamp: string,
    hoursBack: number
  ): Promise<ContextSnapshot[]> {
    // Calculate cutoff timestamp
    const beforeDate = new Date(beforeTimestamp);
    const cutoffDate = new Date(beforeDate.getTime() - hoursBack * 60 * 60 * 1000);
    const cutoffTimestamp = cutoffDate.toISOString();

    const { results } = await this.db.prepare(
      `SELECT * FROM context_snapshots
       WHERE project = ?
       AND timestamp >= ?
       AND timestamp < ?
       ORDER BY timestamp DESC`
    ).bind(project, cutoffTimestamp, beforeTimestamp).all();

    if (!results) return [];
    return results.map(row => this.deserializeCausality(row));
  }

  /**
   * 🎯 SEMANTIC INTENT: Search by semantic markers
   *
   * SEMANTIC MATCHING:
   * - LIKE query on summary (semantic essence)
   * - LIKE query on tags (categorization markers)
   * - Optional project filter (domain scoping)
   * - Temporal ordering (newest first)
   */
  async search(query: string, project?: string): Promise<ContextSnapshot[]> {
    let sql = `SELECT * FROM context_snapshots
               WHERE (summary LIKE ? OR tags LIKE ?)`;
    const params: (string | number)[] = [`%${query}%`, `%${query}%`];

    if (project) {
      sql += ` AND project = ?`;
      params.push(project);
    }

    sql += ` ORDER BY timestamp DESC LIMIT 10`;

    const { results } = await this.db.prepare(sql).bind(...params).all();

    if (!results) return [];
    return results.map(row => this.deserializeCausality(row));
  }
}
