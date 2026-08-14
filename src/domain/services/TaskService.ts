import type { ITaskRepository } from '../../application/ports/ITaskRepository';
import { AgentTask } from '../models/AgentTask';
import type { AgentTask as IAgentTask, AgentTaskStatus, CreateTaskInput, GetTasksInput } from '../../types';

/**
 * Domain service for agent task coordination.
 * Thin by design — business rules live in AgentTask (validation) and
 * D1TaskRepository (atomic claiming). This is the application seam.
 */
export class TaskService {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async createTask(input: CreateTaskInput): Promise<IAgentTask> {
    const task = AgentTask.create(input);
    await this.taskRepository.save(task);
    return task;
  }

  async claimNextTask(agentId: string): Promise<IAgentTask | null> {
    return this.taskRepository.claimNext(agentId);
  }

  async getTasks(input: GetTasksInput): Promise<IAgentTask[]> {
    return this.taskRepository.find({
      project: input.project,
      status: input.status,
      assignedTo: input.assignedTo,
      limit: input.limit,
    });
  }

  async completeTask(taskId: string, resultContextIds: string[]): Promise<void> {
    await this.taskRepository.complete(taskId, resultContextIds);
  }

  async failTask(taskId: string, reason: string): Promise<void> {
    await this.taskRepository.fail(taskId, reason);
  }
}
