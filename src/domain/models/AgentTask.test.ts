import { describe, it, expect } from 'vitest';
import { AgentTask } from './AgentTask';
import type { CreateTaskInput } from '../../types';

describe('AgentTask', () => {
  describe('create()', () => {
    it('creates a queued task with required fields', () => {
      const input: CreateTaskInput = {
        project: 'nt-alpha',
        objective: 'Diagnose duplicate strategy entry',
        requestedBy: 'claude-mac',
      };
      const task = AgentTask.create(input);

      expect(task.id).toBeTruthy();
      expect(task.project).toBe('nt-alpha');
      expect(task.objective).toBe('Diagnose duplicate strategy entry');
      expect(task.requestedBy).toBe('claude-mac');
      expect(task.assignedTo).toBeNull();
      expect(task.status).toBe('queued');
      expect(task.sourceContextId).toBeNull();
      expect(task.resultContextIds).toEqual([]);
      expect(task.failureReason).toBeNull();
      expect(task.claimedAt).toBeNull();
      expect(task.createdAt).toBeTruthy();
      expect(task.updatedAt).toBe(task.createdAt);
    });

    it('sets assignedTo and sourceContextId when provided', () => {
      const task = AgentTask.create({
        project: 'nt-alpha',
        objective: 'Check logs',
        requestedBy: 'claude-mac',
        assignedTo: 'codex-azure',
        sourceContextId: 'CTX-921',
      });

      expect(task.assignedTo).toBe('codex-azure');
      expect(task.sourceContextId).toBe('CTX-921');
    });

    it('generates unique IDs for each task', () => {
      const a = AgentTask.create({ project: 'p', objective: 'o', requestedBy: 'r' });
      const b = AgentTask.create({ project: 'p', objective: 'o', requestedBy: 'r' });
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('validate()', () => {
    it('throws if project is empty', () => {
      expect(() =>
        AgentTask.create({ project: '', objective: 'o', requestedBy: 'r' })
      ).toThrow('project is required');
    });

    it('throws if objective is empty', () => {
      expect(() =>
        AgentTask.create({ project: 'p', objective: '  ', requestedBy: 'r' })
      ).toThrow('objective is required');
    });

    it('throws if requestedBy is empty', () => {
      expect(() =>
        AgentTask.create({ project: 'p', objective: 'o', requestedBy: '' })
      ).toThrow('requestedBy is required');
    });
  });

  describe('fromDatabase()', () => {
    it('reconstitutes a task from a database row', () => {
      const row = {
        id: 'TASK-001',
        project: 'nt-alpha',
        objective: 'Check logs',
        requested_by: 'claude-mac',
        assigned_to: 'codex-azure',
        status: 'claimed',
        source_context_id: 'CTX-921',
        result_context_ids: '["CTX-936"]',
        failure_reason: null,
        claimed_at: '2026-08-14T12:00:00.000Z',
        created_at: '2026-08-14T11:00:00.000Z',
        updated_at: '2026-08-14T12:00:00.000Z',
      };

      const task = AgentTask.fromDatabase(row);

      expect(task.id).toBe('TASK-001');
      expect(task.project).toBe('nt-alpha');
      expect(task.assignedTo).toBe('codex-azure');
      expect(task.status).toBe('claimed');
      expect(task.sourceContextId).toBe('CTX-921');
      expect(task.resultContextIds).toEqual(['CTX-936']);
      expect(task.claimedAt).toBe('2026-08-14T12:00:00.000Z');
    });

    it('handles null optional fields', () => {
      const row = {
        id: 'TASK-002',
        project: 'p',
        objective: 'o',
        requested_by: 'r',
        assigned_to: null,
        status: 'queued',
        source_context_id: null,
        result_context_ids: '[]',
        failure_reason: null,
        claimed_at: null,
        created_at: '2026-08-14T11:00:00.000Z',
        updated_at: '2026-08-14T11:00:00.000Z',
      };

      const task = AgentTask.fromDatabase(row);
      expect(task.assignedTo).toBeNull();
      expect(task.sourceContextId).toBeNull();
      expect(task.claimedAt).toBeNull();
      expect(task.resultContextIds).toEqual([]);
    });
  });
});
