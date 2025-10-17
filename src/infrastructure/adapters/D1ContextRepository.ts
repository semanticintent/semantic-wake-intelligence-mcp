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
   * 🎯 WAKE INTELLIGENCE: Deserialize database row to ContextSnapshot
   *
   * PURPOSE: Convert stored JSON strings back to typed objects
   *
   * LAYER 1: Deserialize causality metadata
   * LAYER 2: Extract memory tier and LRU tracking fields
   * LAYER 3: Deserialize propagation prediction metadata
   *
   * @param row - Database row with all columns
   * @returns ContextSnapshot with deserialized metadata
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

    const propagation = row.prediction_score !== null && row.prediction_score !== undefined
      ? {
          predictionScore: row.prediction_score,
          lastPredicted: row.last_predicted || null,
          predictedNextAccess: row.predicted_next_access || null,
          propagationReason: row.propagation_reason ? JSON.parse(row.propagation_reason) : [],
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
      // Layer 2: Memory Manager fields
      memoryTier: row.memory_tier,
      lastAccessed: row.last_accessed,
      accessCount: row.access_count,
      // Layer 3: Propagation Engine fields
      propagation,
    };
  }

  /**
   * 🎯 SEMANTIC INTENT: Persist context snapshot to D1
   *
   * TECHNICAL IMPLEMENTATION:
   * - INSERT INTO context_snapshots
   * - Returns generated ID for immutable reference
   * - Includes causality metadata (Layer 1: Past)
   * - Includes memory tier and LRU fields (Layer 2: Present)
   * - Includes propagation prediction metadata (Layer 3: Future)
   */
  async save(snapshot: ContextSnapshot): Promise<string> {
    // Serialize causality metadata for storage (Layer 1)
    const actionType = snapshot.causality?.actionType || null;
    const rationale = snapshot.causality?.rationale || null;
    const dependencies = snapshot.causality?.dependencies
      ? JSON.stringify(snapshot.causality.dependencies)
      : null;
    const causedBy = snapshot.causality?.causedBy || null;

    // Serialize propagation metadata for storage (Layer 3)
    const predictionScore = snapshot.propagation?.predictionScore ?? null;
    const lastPredicted = snapshot.propagation?.lastPredicted || null;
    const predictedNextAccess = snapshot.propagation?.predictedNextAccess || null;
    const propagationReason = snapshot.propagation?.propagationReason
      ? JSON.stringify(snapshot.propagation.propagationReason)
      : null;

    await this.db.prepare(
      `INSERT INTO context_snapshots
       (id, project, summary, source, metadata, tags, timestamp, action_type, rationale, dependencies, caused_by, memory_tier, last_accessed, access_count, prediction_score, last_predicted, predicted_next_access, propagation_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      causedBy,
      snapshot.memoryTier, // Layer 2: Memory tier
      snapshot.lastAccessed, // Layer 2: LRU tracking
      snapshot.accessCount, // Layer 2: Usage frequency
      predictionScore, // Layer 3: Prediction score
      lastPredicted, // Layer 3: Last prediction time
      predictedNextAccess, // Layer 3: Predicted access time
      propagationReason // Layer 3: Prediction reasons
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

  /**
   * 🎯 WAKE INTELLIGENCE: Update memory tier (Layer 2: Memory Manager)
   *
   * PURPOSE: Reclassify snapshot based on current age
   *
   * TECHNICAL IMPLEMENTATION:
   * - UPDATE memory_tier WHERE id = ?
   * - No cascading effects
   * - Atomic operation
   */
  async updateMemoryTier(id: string, memoryTier: string): Promise<void> {
    await this.db.prepare(
      `UPDATE context_snapshots
       SET memory_tier = ?
       WHERE id = ?`
    ).bind(memoryTier, id).run();
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Update access tracking (Layer 2: Memory Manager)
   *
   * PURPOSE: Track LRU metadata when context is accessed
   *
   * TECHNICAL IMPLEMENTATION:
   * - UPDATE last_accessed = current timestamp
   * - INCREMENT access_count by 1
   * - Atomic operation
   */
  async updateAccessTracking(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare(
      `UPDATE context_snapshots
       SET last_accessed = ?,
           access_count = access_count + 1
       WHERE id = ?`
    ).bind(now, id).run();
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Find contexts by memory tier (Layer 2: Memory Manager)
   *
   * PURPOSE: Enable tier-based queries (e.g., find EXPIRED for pruning)
   *
   * TECHNICAL IMPLEMENTATION:
   * - SELECT WHERE memory_tier = ?
   * - ORDER BY timestamp ASC (oldest first for pruning)
   * - LIMIT results (bounded retrieval)
   */
  async findByMemoryTier(memoryTier: string, limit: number = 100): Promise<ContextSnapshot[]> {
    const { results } = await this.db.prepare(
      `SELECT * FROM context_snapshots
       WHERE memory_tier = ?
       ORDER BY timestamp ASC
       LIMIT ?`
    ).bind(memoryTier, limit).all();

    if (!results) return [];
    return results.map(row => this.deserializeCausality(row));
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Update propagation metadata (Layer 3: Propagation Engine)
   *
   * PURPOSE: Persist prediction results to database
   *
   * TECHNICAL IMPLEMENTATION:
   * - UPDATE prediction_score, last_predicted, predicted_next_access, propagation_reason
   * - Atomic operation
   * - No cascading effects
   */
  async updatePropagation(
    id: string,
    predictionScore: number,
    lastPredicted: string,
    predictedNextAccess: string | null,
    propagationReason: string[]
  ): Promise<void> {
    const reasonJson = JSON.stringify(propagationReason);
    await this.db.prepare(
      `UPDATE context_snapshots
       SET prediction_score = ?,
           last_predicted = ?,
           predicted_next_access = ?,
           propagation_reason = ?
       WHERE id = ?`
    ).bind(predictionScore, lastPredicted, predictedNextAccess, reasonJson, id).run();
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Find contexts by prediction score (Layer 3: Propagation Engine)
   *
   * PURPOSE: Retrieve high-value contexts for pre-fetching
   *
   * TECHNICAL IMPLEMENTATION:
   * - SELECT WHERE prediction_score >= minScore
   * - Optional WHERE project = ?
   * - ORDER BY prediction_score DESC (highest first)
   * - LIMIT results (bounded retrieval)
   */
  async findByPredictionScore(
    minScore: number,
    project?: string,
    limit: number = 10
  ): Promise<ContextSnapshot[]> {
    let sql = `SELECT * FROM context_snapshots
               WHERE prediction_score >= ?`;
    const params: (string | number)[] = [minScore];

    if (project) {
      sql += ` AND project = ?`;
      params.push(project);
    }

    sql += ` ORDER BY prediction_score DESC LIMIT ?`;
    params.push(limit);

    const { results } = await this.db.prepare(sql).bind(...params).all();

    if (!results) return [];
    return results.map(row => this.deserializeCausality(row));
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Find stale predictions (Layer 3: Propagation Engine)
   *
   * PURPOSE: Identify contexts needing re-prediction
   *
   * TECHNICAL IMPLEMENTATION:
   * - Calculate cutoff timestamp (now - hoursStale)
   * - SELECT WHERE last_predicted < cutoff OR last_predicted IS NULL
   * - ORDER BY last_predicted ASC (stalest first)
   * - LIMIT results (bounded retrieval)
   */
  async findStalePredictions(hoursStale: number, limit: number = 100): Promise<ContextSnapshot[]> {
    const cutoffDate = new Date(Date.now() - hoursStale * 60 * 60 * 1000);
    const cutoffTimestamp = cutoffDate.toISOString();

    const { results } = await this.db.prepare(
      `SELECT * FROM context_snapshots
       WHERE last_predicted IS NULL
          OR last_predicted < ?
       ORDER BY last_predicted ASC NULLS FIRST
       LIMIT ?`
    ).bind(cutoffTimestamp, limit).all();

    if (!results) return [];
    return results.map(row => this.deserializeCausality(row));
  }
}
