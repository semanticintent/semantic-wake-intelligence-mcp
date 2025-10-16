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

      // Expect 11 parameters (7 original + 4 causality)
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
        null  // caused_by
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
});
