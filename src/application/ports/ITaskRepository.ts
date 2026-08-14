import type { AgentTask } from '../../domain/models/AgentTask';
import type { AgentTaskStatus } from '../../types';

/**
 * Port: persistence contract for agent tasks.
 * Implementations: D1TaskRepository (production), mock (tests).
 */
export interface ITaskRepository {
  save(task: AgentTask): Promise<string>;

  /** Atomically claim the next queued task for the given agent. Returns null if none available. */
  claimNext(agentId: string): Promise<AgentTask | null>;

  findById(id: string): Promise<AgentTask | null>;

  find(opts: {
    project?: string;
    status?: AgentTaskStatus;
    assignedTo?: string;
    limit?: number;
  }): Promise<AgentTask[]>;

  complete(taskId: string, resultContextIds: string[]): Promise<void>;

  fail(taskId: string, reason: string): Promise<void>;
}
