import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolExecutionHandler } from './ToolExecutionHandler';
import type { ContextService } from '../../domain/services/ContextService';
import type { TaskService } from '../../domain/services/TaskService';
import { AgentTask } from '../../domain/models/AgentTask';

class MockContextService {
  saveContext = vi.fn();
  loadContext = vi.fn();
  searchContext = vi.fn();
}

class MockTaskService {
  createTask = vi.fn();
  claimNextTask = vi.fn();
  getTasks = vi.fn();
  completeTask = vi.fn();
  failTask = vi.fn();
}

const makeTask = (overrides: Partial<ReturnType<typeof AgentTask.create>> = {}) =>
  Object.assign(AgentTask.create({
    project: 'nt-alpha',
    objective: 'Diagnose duplicate entry',
    requestedBy: 'claude-mac',
  }), overrides);

describe('ToolExecutionHandler — task tools', () => {
  let handler: ToolExecutionHandler;
  let mockContextService: MockContextService;
  let mockTaskService: MockTaskService;

  beforeEach(() => {
    mockContextService = new MockContextService();
    mockTaskService = new MockTaskService();
    handler = new ToolExecutionHandler(
      mockContextService as unknown as ContextService,
      mockTaskService as unknown as TaskService
    );
  });

  describe('create_task', () => {
    it('returns task ID and status on success', async () => {
      const task = makeTask();
      mockTaskService.createTask.mockResolvedValue(task);

      const result = await handler.execute('create_task', {
        project: 'nt-alpha',
        objective: 'Diagnose duplicate entry',
        requestedBy: 'claude-mac',
      });

      expect(result.content[0].text).toContain(task.id);
      expect(result.content[0].text).toContain('queued');
      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        project: 'nt-alpha',
        objective: 'Diagnose duplicate entry',
        requestedBy: 'claude-mac',
      });
    });

    it('includes sourceContextId in output when provided', async () => {
      const task = makeTask({ sourceContextId: 'CTX-921' });
      mockTaskService.createTask.mockResolvedValue(task);

      const result = await handler.execute('create_task', {
        project: 'nt-alpha',
        objective: 'Check logs',
        requestedBy: 'claude-mac',
        sourceContextId: 'CTX-921',
      });

      expect(result.content[0].text).toContain('CTX-921');
    });
  });

  describe('claim_task', () => {
    it('returns task details when a task is available', async () => {
      const task = Object.assign(makeTask(), {
        assignedTo: 'codex-azure',
        status: 'claimed' as const,
        claimedAt: new Date().toISOString(),
      });
      mockTaskService.claimNextTask.mockResolvedValue(task);

      const result = await handler.execute('claim_task', { agent: 'codex-azure' });

      expect(result.content[0].text).toContain('Task claimed');
      expect(result.content[0].text).toContain(task.id);
      expect(mockTaskService.claimNextTask).toHaveBeenCalledWith('codex-azure');
    });

    it('returns "no tasks available" when queue is empty', async () => {
      mockTaskService.claimNextTask.mockResolvedValue(null);

      const result = await handler.execute('claim_task', { agent: 'codex-azure' });

      expect(result.content[0].text).toContain('No tasks available');
    });
  });

  describe('get_tasks', () => {
    it('returns formatted task list', async () => {
      const tasks = [makeTask(), makeTask()];
      mockTaskService.getTasks.mockResolvedValue(tasks);

      const result = await handler.execute('get_tasks', { project: 'nt-alpha' });

      expect(result.content[0].text).toContain('Found 2 task(s)');
    });

    it('returns empty message when no tasks match', async () => {
      mockTaskService.getTasks.mockResolvedValue([]);

      const result = await handler.execute('get_tasks', {});

      expect(result.content[0].text).toContain('No tasks found');
    });
  });

  describe('complete_task', () => {
    it('confirms completion with linked context IDs', async () => {
      mockTaskService.completeTask.mockResolvedValue(undefined);

      const result = await handler.execute('complete_task', {
        taskId: 'TASK-418',
        resultContextIds: ['CTX-936'],
      });

      expect(result.content[0].text).toContain('TASK-418');
      expect(result.content[0].text).toContain('CTX-936');
      expect(mockTaskService.completeTask).toHaveBeenCalledWith('TASK-418', ['CTX-936']);
    });

    it('handles completion with no result contexts', async () => {
      mockTaskService.completeTask.mockResolvedValue(undefined);

      const result = await handler.execute('complete_task', { taskId: 'TASK-418' });

      expect(result.content[0].text).toContain('completed');
      expect(mockTaskService.completeTask).toHaveBeenCalledWith('TASK-418', []);
    });
  });

  describe('fail_task', () => {
    it('confirms failure with reason', async () => {
      mockTaskService.failTask.mockResolvedValue(undefined);

      const result = await handler.execute('fail_task', {
        taskId: 'TASK-418',
        reason: 'NinjaTrader connection timed out',
      });

      expect(result.content[0].text).toContain('TASK-418');
      expect(result.content[0].text).toContain('NinjaTrader connection timed out');
      expect(mockTaskService.failTask).toHaveBeenCalledWith('TASK-418', 'NinjaTrader connection timed out');
    });
  });
});
