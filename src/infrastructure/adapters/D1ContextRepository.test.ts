/**
 * 🎯 SEMANTIC INTENT: Unit tests for D1ContextRepository adapter
 *
 * PURPOSE: Verify database adapter implementation
 *
 * TEST STRATEGY:
 * - Mock D1Database binding
 * - Test SQL query construction
 * - Test data transformation
 * - Verify type conversions
 *
 * NOTE: These are unit tests with mocked D1.
 * Integration tests with real D1 should be in separate file.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { D1ContextRepository } from './D1ContextRepository';
import { ContextSnapshot } from '../../domain/models/ContextSnapshot';

// Mock D1Database interfaces
class MockD1PreparedStatement {
  private boundParams: unknown[] = [];

  bind(...params: unknown[]) {
    this.boundParams = params;
    return this;
  }

  async run() {
    return { success: true };
  }

  async all(): Promise<{ results: unknown[] }> {
    return { results: [] };
  }
}

class MockD1Database {
  prepare = vi.fn(() => new MockD1PreparedStatement());
}

describe('D1ContextRepository', () => {
  let repository: D1ContextRepository;
  let mockDb: MockD1Database;

  beforeEach(() => {
    mockDb = new MockD1Database();
    repository = new D1ContextRepository(mockDb as unknown as D1Database);
  });

  describe('save()', () => {
    it('should prepare INSERT statement with all snapshot fields', async () => {
      // Arrange
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        source: 'test-source',
        metadata: { key: 'value' },
        tags: 'tag1,tag2',
      });

      const mockStatement = new MockD1PreparedStatement();
      const bindSpy = vi.spyOn(mockStatement, 'bind');
      const runSpy = vi.spyOn(mockStatement, 'run');
      mockDb.prepare.mockReturnValue(mockStatement);

      // Act
      const result = await repository.save(snapshot);

      // Assert
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO context_snapshots')
      );
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('action_type, rationale, dependencies, caused_by')
      );
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('memory_tier, last_accessed, access_count')
      );
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('prediction_score, last_predicted, predicted_next_access, propagation_reason')
      );

      // Expect 18 parameters (7 original + 4 causality + 3 memory + 4 propagation)
      expect(bindSpy).toHaveBeenCalledWith(
        snapshot.id,
        snapshot.project,
        snapshot.summary,
        snapshot.source,
        snapshot.metadata,
        snapshot.tags,
        snapshot.timestamp,
        null, // action_type
        null, // rationale
        null, // dependencies
        null, // caused_by
        snapshot.memoryTier, // memory_tier (Layer 2)
        snapshot.lastAccessed, // last_accessed (Layer 2)
        snapshot.accessCount, // access_count (Layer 2)
        null, // prediction_score (Layer 3)
        null, // last_predicted (Layer 3)
        null, // predicted_next_access (Layer 3)
        null  // propagation_reason (Layer 3)
      );

      expect(runSpy).toHaveBeenCalled();
      expect(result).toBe(snapshot.id);
    });

    it('should return snapshot ID after successful save', async () => {
      // Arrange
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      // Act
      const result = await repository.save(snapshot);

      // Assert
      expect(result).toBe(snapshot.id);
    });
  });

  describe('findByProject()', () => {
    it('should prepare SELECT with project filter and limit', async () => {
      // Arrange
      const project = 'test-project';
      const limit = 5;

      const mockStatement = new MockD1PreparedStatement();
      const bindSpy = vi.spyOn(mockStatement, 'bind');
      mockDb.prepare.mockReturnValue(mockStatement);

      // Act
      await repository.findByProject(project, limit);

      // Assert
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM context_snapshots')
      );
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE project = ?')
      );
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY timestamp DESC')
      );
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?')
      );

      expect(bindSpy).toHaveBeenCalledWith(project, limit);
    });

    it('should transform database results to ContextSnapshot array', async () => {
      // Arrange
      const mockResults = [
        {
          id: 'id-1',
          project: 'test-project',
          summary: 'Summary 1',
          source: 'mcp',
          metadata: null,
          tags: 'tag1',
          timestamp: '2025-10-06T12:00:00.000Z',
        },
        {
          id: 'id-2',
          project: 'test-project',
          summary: 'Summary 2',
          source: 'mcp',
          metadata: '{"key":"value"}',
          tags: 'tag2',
          timestamp: '2025-10-06T11:00:00.000Z',
        },
      ];

      const mockStatement = new MockD1PreparedStatement();
      vi.spyOn(mockStatement, 'all').mockResolvedValue({ results: mockResults });
      mockDb.prepare.mockReturnValue(mockStatement);

      // Act
      const results = await repository.findByProject('test-project', 10);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('id-1');
      expect(results[0].project).toBe('test-project');
      expect(results[1].id).toBe('id-2');
    });

    it('should return empty array when no results found', async () => {
      // Arrange
      const mockStatement = new MockD1PreparedStatement();
      vi.spyOn(mockStatement, 'all').mockResolvedValue({ results: [] });
      mockDb.prepare.mockReturnValue(mockStatement);

      // Act
      const results = await repository.findByProject('nonexistent', 10);

      // Assert
      expect(results).toEqual([]);
    });
  });

  describe('search()', () => {
    it('should search without project filter', async () => {
      // Arrange
      const query = 'search term';

      const mockStatement = new MockD1PreparedStatement();
      const bindSpy = vi.spyOn(mockStatement, 'bind');
      mockDb.prepare.mockReturnValue(mockStatement);

      // Act
      await repository.search(query);

      // Assert
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE (summary LIKE ? OR tags LIKE ?)')
      );
      expect(bindSpy).toHaveBeenCalledWith('%search term%', '%search term%');
    });

    it('should search with project filter', async () => {
      // Arrange
      const query = 'search term';
      const project = 'specific-project';

      const mockStatement = new MockD1PreparedStatement();
      const bindSpy = vi.spyOn(mockStatement, 'bind');
      mockDb.prepare.mockReturnValue(mockStatement);

      // Act
      await repository.search(query, project);

      // Assert
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE (summary LIKE ? OR tags LIKE ?) AND project = ?')
      );
      expect(bindSpy).toHaveBeenCalledWith('%search term%', '%search term%', project);
    });

    it('should limit results to 10', async () => {
      // Arrange
      const mockStatement = new MockD1PreparedStatement();
      mockDb.prepare.mockReturnValue(mockStatement);

      // Act
      await repository.search('test');

      // Assert
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 10')
      );
    });

    it('should transform search results', async () => {
      // Arrange
      const mockResults = [
        {
          id: 'result-1',
          project: 'project-a',
          summary: 'Summary with search term',
          source: 'mcp',
          metadata: null,
          tags: 'relevant,tags',
          timestamp: '2025-10-06T12:00:00.000Z',
        },
      ];

      const mockStatement = new MockD1PreparedStatement();
      vi.spyOn(mockStatement, 'all').mockResolvedValue({ results: mockResults });
      mockDb.prepare.mockReturnValue(mockStatement);

      // Act
      const results = await repository.search('search term');

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('result-1');
      expect(results[0].summary).toBe('Summary with search term');
    });
  });

  describe('findAll()', () => {
    it('should select all rows with default limit of 1000', async () => {
      const mockStatement = new MockD1PreparedStatement();
      const bindSpy = vi.spyOn(mockStatement, 'bind');
      mockDb.prepare.mockReturnValue(mockStatement);

      await repository.findAll();

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM context_snapshots')
      );
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.not.stringContaining('WHERE project')
      );
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY timestamp DESC')
      );
      expect(bindSpy).toHaveBeenCalledWith(1000);
    });

    it('should accept custom limit', async () => {
      const mockStatement = new MockD1PreparedStatement();
      const bindSpy = vi.spyOn(mockStatement, 'bind');
      mockDb.prepare.mockReturnValue(mockStatement);

      await repository.findAll(500);

      expect(bindSpy).toHaveBeenCalledWith(500);
    });

    it('should transform results across multiple projects', async () => {
      const mockResults = [
        { id: 'p1-ctx', project: 'project-a', summary: 'Alpha', source: 'mcp', metadata: null, tags: 'a', timestamp: '2025-10-06T12:00:00.000Z' },
        { id: 'p2-ctx', project: 'project-b', summary: 'Beta', source: 'mcp', metadata: null, tags: 'b', timestamp: '2025-10-06T11:00:00.000Z' },
      ];

      const mockStatement = new MockD1PreparedStatement();
      vi.spyOn(mockStatement, 'all').mockResolvedValue({ results: mockResults });
      mockDb.prepare.mockReturnValue(mockStatement);

      const results = await repository.findAll();

      expect(results).toHaveLength(2);
      expect(results[0].project).toBe('project-a');
      expect(results[1].project).toBe('project-b');
    });

    it('should return empty array when no contexts exist', async () => {
      const mockStatement = new MockD1PreparedStatement();
      vi.spyOn(mockStatement, 'all').mockResolvedValue({ results: [] });
      mockDb.prepare.mockReturnValue(mockStatement);

      const results = await repository.findAll();

      expect(results).toEqual([]);
    });
  });

  describe('delete()', () => {
    it('should execute DELETE statement with id', async () => {
      const id = 'snapshot-to-delete';
      const mockStatement = new MockD1PreparedStatement();
      const bindSpy = vi.spyOn(mockStatement, 'bind');
      const runSpy = vi.spyOn(mockStatement, 'run');
      mockDb.prepare.mockReturnValue(mockStatement);

      await repository.delete(id);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM context_snapshots')
      );
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?')
      );
      expect(bindSpy).toHaveBeenCalledWith(id);
      expect(runSpy).toHaveBeenCalled();
    });
  });

  describe('Layer 4: Meta-Learning Methods', () => {
    describe('recordPredictionOutcome()', () => {
      it('should INSERT into prediction_outcomes with all fields', async () => {
        const outcome = {
          id: 'outcome-1',
          contextId: 'ctx-1',
          project: 'test-project',
          predictedScore: 0.75,
          temporalComponent: 0.8,
          causalComponent: 0.6,
          frequencyComponent: 0.7,
          actuallyAccessed: true,
          recordedAt: '2026-05-01T10:00:00.000Z',
        };

        const mockStatement = new MockD1PreparedStatement();
        const bindSpy = vi.spyOn(mockStatement, 'bind');
        const runSpy = vi.spyOn(mockStatement, 'run');
        mockDb.prepare.mockReturnValue(mockStatement);

        await repository.recordPredictionOutcome(outcome);

        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO prediction_outcomes')
        );
        expect(bindSpy).toHaveBeenCalledWith(
          'outcome-1', 'ctx-1', 'test-project',
          0.75, 0.8, 0.6, 0.7,
          1,
          '2026-05-01T10:00:00.000Z'
        );
        expect(runSpy).toHaveBeenCalled();
      });
    });

    describe('findOutcomesByProject()', () => {
      it('should query with project filter and default limit of 100', async () => {
        const mockStatement = new MockD1PreparedStatement();
        const bindSpy = vi.spyOn(mockStatement, 'bind');
        mockDb.prepare.mockReturnValue(mockStatement);

        await repository.findOutcomesByProject('test-project');

        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('WHERE project = ?')
        );
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY recorded_at DESC')
        );
        expect(bindSpy).toHaveBeenCalledWith('test-project', 100);
      });

      it('should accept custom limit', async () => {
        const mockStatement = new MockD1PreparedStatement();
        const bindSpy = vi.spyOn(mockStatement, 'bind');
        mockDb.prepare.mockReturnValue(mockStatement);

        await repository.findOutcomesByProject('test-project', 50);

        expect(bindSpy).toHaveBeenCalledWith('test-project', 50);
      });

      it('should transform results to PredictionOutcome array', async () => {
        const mockResults = [
          {
            id: 'outcome-1',
            context_id: 'ctx-1',
            project: 'test-project',
            predicted_score: 0.75,
            temporal_component: 0.8,
            causal_component: 0.6,
            frequency_component: 0.7,
            actually_accessed: 1,
            recorded_at: '2026-05-01T10:00:00.000Z',
          },
        ];

        const mockStatement = new MockD1PreparedStatement();
        vi.spyOn(mockStatement, 'all').mockResolvedValue({ results: mockResults });
        mockDb.prepare.mockReturnValue(mockStatement);

        const results = await repository.findOutcomesByProject('test-project');

        expect(results).toHaveLength(1);
        expect(results[0].contextId).toBe('ctx-1');
        expect(results[0].predictedScore).toBe(0.75);
        expect(results[0].actuallyAccessed).toBe(true);
      });

      it('should return empty array when no outcomes exist', async () => {
        const mockStatement = new MockD1PreparedStatement();
        vi.spyOn(mockStatement, 'all').mockResolvedValue({ results: [] });
        mockDb.prepare.mockReturnValue(mockStatement);

        const results = await repository.findOutcomesByProject('new-project');

        expect(results).toEqual([]);
      });
    });

    describe('getProjectWeights()', () => {
      it('should return null when no weights exist for project', async () => {
        const mockStatement = new MockD1PreparedStatement();
        vi.spyOn(mockStatement, 'all').mockResolvedValue({ results: [] });
        mockDb.prepare.mockReturnValue(mockStatement);

        const result = await repository.getProjectWeights('new-project');

        expect(result).toBeNull();
      });

      it('should return learned weights when they exist', async () => {
        const mockResults = [
          {
            project: 'test-project',
            temporal_weight: 0.5,
            causal_weight: 0.3,
            frequency_weight: 0.2,
            sample_size: 42,
            last_tuned: '2026-05-01T06:00:00.000Z',
          },
        ];

        const mockStatement = new MockD1PreparedStatement();
        vi.spyOn(mockStatement, 'all').mockResolvedValue({ results: mockResults });
        mockDb.prepare.mockReturnValue(mockStatement);

        const result = await repository.getProjectWeights('test-project');

        expect(result).not.toBeNull();
        expect(result!.temporalWeight).toBe(0.5);
        expect(result!.causalWeight).toBe(0.3);
        expect(result!.frequencyWeight).toBe(0.2);
        expect(result!.sampleSize).toBe(42);
        expect(result!.lastTuned).toBe('2026-05-01T06:00:00.000Z');
      });
    });

    describe('saveProjectWeights()', () => {
      it('should upsert weights with ON CONFLICT update', async () => {
        const weights = {
          project: 'test-project',
          temporalWeight: 0.5,
          causalWeight: 0.3,
          frequencyWeight: 0.2,
          sampleSize: 25,
          lastTuned: '2026-05-01T06:00:00.000Z',
        };

        const mockStatement = new MockD1PreparedStatement();
        const bindSpy = vi.spyOn(mockStatement, 'bind');
        const runSpy = vi.spyOn(mockStatement, 'run');
        mockDb.prepare.mockReturnValue(mockStatement);

        await repository.saveProjectWeights(weights);

        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO project_weights')
        );
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('ON CONFLICT(project) DO UPDATE SET')
        );
        expect(bindSpy).toHaveBeenCalledWith(
          'test-project', 0.5, 0.3, 0.2, 25, '2026-05-01T06:00:00.000Z'
        );
        expect(runSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Layer 2: Memory Manager Methods', () => {
    describe('updateMemoryTier()', () => {
      it('should execute UPDATE statement with tier and id', async () => {
        // Arrange
        const id = 'snapshot-123';
        const tier = 'archived';

        const mockStatement = new MockD1PreparedStatement();
        const bindSpy = vi.spyOn(mockStatement, 'bind');
        const runSpy = vi.spyOn(mockStatement, 'run');
        mockDb.prepare.mockReturnValue(mockStatement);

        // Act
        await repository.updateMemoryTier(id, tier);

        // Assert
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE context_snapshots')
        );
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('SET memory_tier = ?')
        );
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('WHERE id = ?')
        );
        expect(bindSpy).toHaveBeenCalledWith(tier, id);
        expect(runSpy).toHaveBeenCalled();
      });
    });

    describe('updateAccessTracking()', () => {
      it('should execute UPDATE with timestamp and increment count', async () => {
        // Arrange
        const id = 'snapshot-123';

        const mockStatement = new MockD1PreparedStatement();
        const bindSpy = vi.spyOn(mockStatement, 'bind');
        const runSpy = vi.spyOn(mockStatement, 'run');
        mockDb.prepare.mockReturnValue(mockStatement);

        // Act
        await repository.updateAccessTracking(id);

        // Assert
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE context_snapshots')
        );
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('SET last_accessed = ?')
        );
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('access_count = access_count + 1')
        );
        expect(bindSpy).toHaveBeenCalledWith(
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/), // ISO timestamp
          id
        );
        expect(runSpy).toHaveBeenCalled();
      });
    });

    describe('findByMemoryTier()', () => {
      it('should query by tier with default limit', async () => {
        // Arrange
        const tier = 'expired';

        const mockStatement = new MockD1PreparedStatement();
        const bindSpy = vi.spyOn(mockStatement, 'bind');
        mockDb.prepare.mockReturnValue(mockStatement);

        // Act
        await repository.findByMemoryTier(tier);

        // Assert
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('WHERE memory_tier = ?')
        );
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY timestamp ASC')
        );
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining('LIMIT ?')
        );
        expect(bindSpy).toHaveBeenCalledWith(tier, 100);
      });

      it('should query by tier with custom limit', async () => {
        // Arrange
        const tier = 'active';
        const limit = 50;

        const mockStatement = new MockD1PreparedStatement();
        const bindSpy = vi.spyOn(mockStatement, 'bind');
        mockDb.prepare.mockReturnValue(mockStatement);

        // Act
        await repository.findByMemoryTier(tier, limit);

        // Assert
        expect(bindSpy).toHaveBeenCalledWith(tier, limit);
      });

      it('should transform tier query results', async () => {
        // Arrange
        const mockResults = [
          {
            id: 'old-1',
            project: 'test',
            summary: 'Old context',
            source: 'mcp',
            metadata: null,
            tags: 'old',
            timestamp: '2024-01-01T12:00:00.000Z',
            action_type: null,
            rationale: null,
            dependencies: null,
            caused_by: null,
            memory_tier: 'expired',
            last_accessed: null,
            access_count: 0,
          },
        ];

        const mockStatement = new MockD1PreparedStatement();
        vi.spyOn(mockStatement, 'all').mockResolvedValue({ results: mockResults });
        mockDb.prepare.mockReturnValue(mockStatement);

        // Act
        const results = await repository.findByMemoryTier('expired');

        // Assert
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('old-1');
        expect(results[0].memoryTier).toBe('expired');
      });
    });
  });
});
