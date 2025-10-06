/**
 * 🎯 SEMANTIC INTENT: Unit tests for ContextService domain service
 *
 * PURPOSE: Verify business orchestration and domain logic
 *
 * TEST STRATEGY:
 * - Use mocks for infrastructure dependencies
 * - Test business flow orchestration
 * - Verify semantic preservation through transformations
 * - Test business rule enforcement (bounded limits, etc.)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextService } from './ContextService';
import type { IContextRepository } from '../../application/ports/IContextRepository';
import type { IAIProvider } from '../../application/ports/IAIProvider';
import type { SaveContextInput, LoadContextInput, SearchContextInput } from '../../types';

// Mock implementations
class MockContextRepository implements IContextRepository {
  save = vi.fn();
  findByProject = vi.fn();
  search = vi.fn();
}

class MockAIProvider implements IAIProvider {
  generateSummary = vi.fn();
  generateTags = vi.fn();
}

describe('ContextService Domain Service', () => {
  let contextService: ContextService;
  let mockRepository: MockContextRepository;
  let mockAIProvider: MockAIProvider;

  beforeEach(() => {
    mockRepository = new MockContextRepository();
    mockAIProvider = new MockAIProvider();
    contextService = new ContextService(mockRepository, mockAIProvider);
  });

  describe('saveContext()', () => {
    it('should orchestrate AI enhancement → validation → persistence', async () => {
      // Arrange
      const input: SaveContextInput = {
        project: 'test-project',
        content: 'Long conversation content that needs summarization',
        source: 'test-source',
        metadata: { key: 'value' },
      };

      mockAIProvider.generateSummary.mockResolvedValue('AI-generated summary');
      mockAIProvider.generateTags.mockResolvedValue('tag1,tag2,tag3');
      mockRepository.save.mockResolvedValue('snapshot-id');

      // Act
      const result = await contextService.saveContext(input);

      // Assert - Verify AI enhancement was called
      expect(mockAIProvider.generateSummary).toHaveBeenCalledWith(input.content);
      expect(mockAIProvider.generateTags).toHaveBeenCalledWith('AI-generated summary');

      // Assert - Verify snapshot was created with correct data
      expect(result.project).toBe(input.project);
      expect(result.summary).toBe('AI-generated summary');
      expect(result.tags).toBe('tag1,tag2,tag3');
      expect(result.source).toBe(input.source);
      expect(result.metadata).toBe(JSON.stringify(input.metadata));

      // Assert - Verify persistence was called
      expect(mockRepository.save).toHaveBeenCalledWith(result);
    });

    it('should generate unique IDs for each snapshot', async () => {
      // Arrange
      const input: SaveContextInput = {
        project: 'test-project',
        content: 'Test content',
      };

      mockAIProvider.generateSummary.mockResolvedValue('Summary');
      mockAIProvider.generateTags.mockResolvedValue('tags');
      mockRepository.save.mockResolvedValue('id');

      // Act
      const result1 = await contextService.saveContext(input);
      const result2 = await contextService.saveContext(input);

      // Assert
      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });

    it('should use default source "mcp" when not provided', async () => {
      // Arrange
      const input: SaveContextInput = {
        project: 'test-project',
        content: 'Test content',
      };

      mockAIProvider.generateSummary.mockResolvedValue('Summary');
      mockAIProvider.generateTags.mockResolvedValue('tags');
      mockRepository.save.mockResolvedValue('id');

      // Act
      const result = await contextService.saveContext(input);

      // Assert
      expect(result.source).toBe('mcp');
    });

    it('should handle null metadata', async () => {
      // Arrange
      const input: SaveContextInput = {
        project: 'test-project',
        content: 'Test content',
      };

      mockAIProvider.generateSummary.mockResolvedValue('Summary');
      mockAIProvider.generateTags.mockResolvedValue('tags');
      mockRepository.save.mockResolvedValue('id');

      // Act
      const result = await contextService.saveContext(input);

      // Assert
      expect(result.metadata).toBeNull();
    });

    it('should propagate AI provider errors', async () => {
      // Arrange
      const input: SaveContextInput = {
        project: 'test-project',
        content: 'Test content',
      };

      mockAIProvider.generateSummary.mockRejectedValue(new Error('AI service unavailable'));

      // Act & Assert
      await expect(contextService.saveContext(input)).rejects.toThrow('AI service unavailable');
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const input: SaveContextInput = {
        project: 'test-project',
        content: 'Test content',
      };

      mockAIProvider.generateSummary.mockResolvedValue('Summary');
      mockAIProvider.generateTags.mockResolvedValue('tags');
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(contextService.saveContext(input)).rejects.toThrow('Database error');
    });
  });

  describe('loadContext()', () => {
    it('should retrieve contexts by project', async () => {
      // Arrange
      const input: LoadContextInput = {
        project: 'test-project',
        limit: 5,
      };

      const mockResults = [
        {
          id: '1',
          project: 'test-project',
          summary: 'Summary 1',
          source: 'mcp',
          metadata: null,
          tags: 'tag1',
          timestamp: '2025-10-06T12:00:00.000Z',
        },
        {
          id: '2',
          project: 'test-project',
          summary: 'Summary 2',
          source: 'mcp',
          metadata: null,
          tags: 'tag2',
          timestamp: '2025-10-06T11:00:00.000Z',
        },
      ];

      mockRepository.findByProject.mockResolvedValue(mockResults);

      // Act
      const results = await contextService.loadContext(input);

      // Assert
      expect(mockRepository.findByProject).toHaveBeenCalledWith('test-project', 5);
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('1');
      expect(results[1].id).toBe('2');
    });

    it('should enforce business rule: max limit of 10', async () => {
      // Arrange
      const input: LoadContextInput = {
        project: 'test-project',
        limit: 100, // Request more than allowed
      };

      mockRepository.findByProject.mockResolvedValue([]);

      // Act
      await contextService.loadContext(input);

      // Assert - Should cap at 10
      expect(mockRepository.findByProject).toHaveBeenCalledWith('test-project', 10);
    });

    it('should default to limit of 1 when not provided', async () => {
      // Arrange
      const input: LoadContextInput = {
        project: 'test-project',
      };

      mockRepository.findByProject.mockResolvedValue([]);

      // Act
      await contextService.loadContext(input);

      // Assert
      expect(mockRepository.findByProject).toHaveBeenCalledWith('test-project', 1);
    });

    it('should handle empty results', async () => {
      // Arrange
      const input: LoadContextInput = {
        project: 'non-existent-project',
        limit: 5,
      };

      mockRepository.findByProject.mockResolvedValue([]);

      // Act
      const results = await contextService.loadContext(input);

      // Assert
      expect(results).toHaveLength(0);
    });
  });

  describe('searchContext()', () => {
    it('should search contexts by query', async () => {
      // Arrange
      const input: SearchContextInput = {
        query: 'search term',
      };

      const mockResults = [
        {
          id: '1',
          project: 'project-1',
          summary: 'Summary containing search term',
          source: 'mcp',
          metadata: null,
          tags: 'tag1',
          timestamp: '2025-10-06T12:00:00.000Z',
        },
      ];

      mockRepository.search.mockResolvedValue(mockResults);

      // Act
      const results = await contextService.searchContext(input);

      // Assert
      expect(mockRepository.search).toHaveBeenCalledWith('search term', undefined);
      expect(results).toHaveLength(1);
      expect(results[0].summary).toBe('Summary containing search term');
    });

    it('should search contexts with project filter', async () => {
      // Arrange
      const input: SearchContextInput = {
        query: 'search term',
        project: 'specific-project',
      };

      mockRepository.search.mockResolvedValue([]);

      // Act
      await contextService.searchContext(input);

      // Assert
      expect(mockRepository.search).toHaveBeenCalledWith('search term', 'specific-project');
    });

    it('should handle no search results', async () => {
      // Arrange
      const input: SearchContextInput = {
        query: 'nonexistent',
      };

      mockRepository.search.mockResolvedValue([]);

      // Act
      const results = await contextService.searchContext(input);

      // Assert
      expect(results).toHaveLength(0);
    });
  });
});
