import { describe, it, expect, vi, beforeEach } from 'vitest';
import { D1TaskRepository } from './D1TaskRepository';
import { AgentTask } from '../../domain/models/AgentTask';

// ─── Minimal D1 mock ─────────────────────────────────────────────────────────

class MockStatement {
  private _returnRows: unknown[] = [];
  private _boundParams: unknown[] = [];

  setReturnRows(rows: unknown[]) {
    this._returnRows = rows;
  }

  bind(...params: unknown[]) {
    this._boundParams = params;
    return this;
  }

  async run() {
    return { success: true, meta: { rows_written: 1 } };
  }

  async all() {
    return { results: this._returnRows, success: true };
  }
}

class MockD1Database {
  private statement = new MockStatement();

  prepare = vi.fn(() => this.statement);

  _setNextQueryRows(rows: unknown[]) {
    this.statement.setReturnRows(rows);
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('D1TaskRepository', () => {
  let db: MockD1Database;
  let repo: D1TaskRepository;

  beforeEach(() => {
    db = new MockD1Database();
    repo = new D1TaskRepository(db as unknown as D1Database);
  });

  describe('save()', () => {
    it('persists a task and returns its ID', async () => {
      const task = AgentTask.create({
        project: 'nt-alpha',
        objective: 'Diagnose duplicate entry',
        requestedBy: 'claude-mac',
      });

      const id = await repo.save(task);

      expect(id).toBe(task.id);
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO agent_tasks'));
    });
  });

  describe('claimNext()', () => {
    it('returns null when no tasks are available', async () => {
      db._setNextQueryRows([]);

      const result = await repo.claimNext('codex-azure');

      expect(result).toBeNull();
    });

    it('returns the claimed task when one is available', async () => {
      const now = new Date().toISOString();
      db._setNextQueryRows([{
        id: 'TASK-001',
        project: 'nt-alpha',
        objective: 'Check logs',
        requested_by: 'claude-mac',
        assigned_to: 'codex-azure',
        status: 'claimed',
        source_context_id: null,
        result_context_ids: '[]',
        failure_reason: null,
        claimed_at: now,
        created_at: now,
        updated_at: now,
      }]);

      const result = await repo.claimNext('codex-azure');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('TASK-001');
      expect(result!.status).toBe('claimed');
      expect(result!.assignedTo).toBe('codex-azure');
    });

    it('uses a single UPDATE statement with RETURNING for atomic claiming', async () => {
      db._setNextQueryRows([]);
      await repo.claimNext('codex-azure');

      const sql: string = db.prepare.mock.calls[0][0];
      expect(sql).toContain('UPDATE agent_tasks');
      expect(sql).toContain('RETURNING');
      expect(sql).toContain("status = 'queued'");
    });
  });

  describe('find()', () => {
    it('returns empty array when no tasks match', async () => {
      db._setNextQueryRows([]);
      const result = await repo.find({ project: 'nt-alpha' });
      expect(result).toEqual([]);
    });

    it('queries with project filter when provided', async () => {
      db._setNextQueryRows([]);
      await repo.find({ project: 'nt-alpha', status: 'queued' });

      const sql: string = db.prepare.mock.calls[0][0];
      expect(sql).toContain('project = ?');
      expect(sql).toContain('status = ?');
    });

    it('applies default limit of 20', async () => {
      db._setNextQueryRows([]);
      await repo.find({});

      const sql: string = db.prepare.mock.calls[0][0];
      expect(sql).toContain('LIMIT ?');
    });
  });

  describe('complete()', () => {
    it('updates status to completed with result context IDs', async () => {
      await repo.complete('TASK-001', ['CTX-936', 'CTX-937']);

      const sql: string = db.prepare.mock.calls[0][0];
      expect(sql).toContain("status = 'completed'");
      expect(sql).toContain('result_context_ids');
    });
  });

  describe('fail()', () => {
    it('updates status to failed with reason', async () => {
      await repo.fail('TASK-001', 'NinjaTrader connection timed out');

      const sql: string = db.prepare.mock.calls[0][0];
      expect(sql).toContain("status = 'failed'");
      expect(sql).toContain('failure_reason');
    });
  });
});
