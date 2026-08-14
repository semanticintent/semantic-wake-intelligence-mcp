import type { AgentTask as IAgentTask, AgentTaskStatus, CreateTaskInput } from '../../types';

/**
 * Domain entity representing a delegated agent task.
 * Immutable after creation — lifecycle transitions return new instances.
 */
export class AgentTask implements IAgentTask {
  constructor(
    public readonly id: string,
    public readonly project: string,
    public readonly objective: string,
    public readonly requestedBy: string,
    public readonly assignedTo: string | null,
    public readonly status: AgentTaskStatus,
    public readonly sourceContextId: string | null,
    public readonly resultContextIds: string[],
    public readonly failureReason: string | null,
    public readonly claimedAt: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.project || this.project.trim().length === 0) {
      throw new Error('AgentTask: project is required');
    }
    if (!this.objective || this.objective.trim().length === 0) {
      throw new Error('AgentTask: objective is required');
    }
    if (!this.requestedBy || this.requestedBy.trim().length === 0) {
      throw new Error('AgentTask: requestedBy is required');
    }
  }

  static create(data: CreateTaskInput): AgentTask {
    const now = new Date().toISOString();
    return new AgentTask(
      crypto.randomUUID(),
      data.project,
      data.objective,
      data.requestedBy,
      data.assignedTo ?? null,
      'queued',
      data.sourceContextId ?? null,
      [],
      null,
      null,
      now,
      now
    );
  }

  static fromDatabase(row: Record<string, unknown>): AgentTask {
    return new AgentTask(
      row.id as string,
      row.project as string,
      row.objective as string,
      row.requested_by as string,
      (row.assigned_to as string | null) ?? null,
      row.status as AgentTaskStatus,
      (row.source_context_id as string | null) ?? null,
      JSON.parse((row.result_context_ids as string) || '[]'),
      (row.failure_reason as string | null) ?? null,
      (row.claimed_at as string | null) ?? null,
      row.created_at as string,
      row.updated_at as string
    );
  }
}
