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
   * 🎯 SEMANTIC INTENT: Persist context snapshot to D1
   *
   * TECHNICAL IMPLEMENTATION:
   * - INSERT INTO context_snapshots
   * - Returns generated ID for immutable reference
   */
  async save(snapshot: ContextSnapshot): Promise<string> {
    await this.db.prepare(
      `INSERT INTO context_snapshots (id, project, summary, source, metadata, tags, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      snapshot.id,
      snapshot.project,
      snapshot.summary,
      snapshot.source,
      snapshot.metadata,
      snapshot.tags,
      snapshot.timestamp
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
  async findByProject(project: string, limit: number): Promise<ContextSnapshot[]> {
    const { results } = await this.db.prepare(
      `SELECT * FROM context_snapshots
       WHERE project = ?
       ORDER BY timestamp DESC
       LIMIT ?`
    ).bind(project, limit).all();

    return (results as unknown as ContextSnapshot[]) || [];
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

    return (results as unknown as ContextSnapshot[]) || [];
  }
}
