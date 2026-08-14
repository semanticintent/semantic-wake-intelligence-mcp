import type { ITaskRepository } from '../../application/ports/ITaskRepository';
import { AgentTask } from '../../domain/models/AgentTask';
import type { AgentTaskStatus } from '../../types';

/**
 * D1 adapter for agent task persistence.
 *
 * Atomic claiming uses a single UPDATE…WHERE subquery with RETURNING so no
 * two workers can claim the same task even under concurrent polling.
 */
export class D1TaskRepository implements ITaskRepository {
  constructor(private readonly db: D1Database) {}

  async save(task: AgentTask): Promise<string> {
    await this.db.prepare(`
      INSERT INTO agent_tasks
        (id, project, objective, requested_by, assigned_to, status,
         source_context_id, result_context_ids, failure_reason,
         claimed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      task.id,
      task.project,
      task.objective,
      task.requestedBy,
      task.assignedTo,
      task.status,
      task.sourceContextId,
      JSON.stringify(task.resultContextIds),
      task.failureReason,
      task.claimedAt,
      task.createdAt,
      task.updatedAt
    ).run();

    return task.id;
  }

  async claimNext(agentId: string): Promise<AgentTask | null> {
    const now = new Date().toISOString();
    // Single statement: find + update + return atomically.
    // If two workers race, D1's serialized write log ensures only one wins;
    // the loser's subquery finds no row after the winner updates it.
    const result = await this.db.prepare(`
      UPDATE agent_tasks
      SET status = 'claimed', assigned_to = ?, claimed_at = ?, updated_at = ?
      WHERE id = (
        SELECT id FROM agent_tasks
        WHERE status = 'queued'
          AND (assigned_to IS NULL OR assigned_to = ?)
        ORDER BY created_at ASC
        LIMIT 1
      )
      RETURNING *
    `).bind(agentId, now, now, agentId).all();

    if (!result.results || result.results.length === 0) return null;
    return AgentTask.fromDatabase(result.results[0] as Record<string, unknown>);
  }

  async findById(id: string): Promise<AgentTask | null> {
    const result = await this.db.prepare(
      'SELECT * FROM agent_tasks WHERE id = ?'
    ).bind(id).all();

    if (!result.results || result.results.length === 0) return null;
    return AgentTask.fromDatabase(result.results[0] as Record<string, unknown>);
  }

  async find(opts: {
    project?: string;
    status?: AgentTaskStatus;
    assignedTo?: string;
    limit?: number;
  }): Promise<AgentTask[]> {
    const conditions: string[] = [];
    const bindings: unknown[] = [];

    if (opts.project) {
      conditions.push('project = ?');
      bindings.push(opts.project);
    }
    if (opts.status) {
      conditions.push('status = ?');
      bindings.push(opts.status);
    }
    if (opts.assignedTo) {
      conditions.push('assigned_to = ?');
      bindings.push(opts.assignedTo);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(opts.limit ?? 20, 100);
    bindings.push(limit);

    const result = await this.db.prepare(
      `SELECT * FROM agent_tasks ${where} ORDER BY created_at DESC LIMIT ?`
    ).bind(...bindings).all();

    return (result.results ?? []).map(row =>
      AgentTask.fromDatabase(row as Record<string, unknown>)
    );
  }

  async complete(taskId: string, resultContextIds: string[]): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare(`
      UPDATE agent_tasks
      SET status = 'completed', result_context_ids = ?, updated_at = ?
      WHERE id = ?
    `).bind(JSON.stringify(resultContextIds), now, taskId).run();
  }

  async fail(taskId: string, reason: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare(`
      UPDATE agent_tasks
      SET status = 'failed', failure_reason = ?, updated_at = ?
      WHERE id = ?
    `).bind(reason, now, taskId).run();
  }
}
