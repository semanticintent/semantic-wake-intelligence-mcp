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
import type { IVectorRepository } from '../../application/ports/IVectorRepository';
import type { SaveContextInput, LoadContextInput, SearchContextInput } from '../../types';

// Mock implementations
class MockContextRepository implements IContextRepository {
  save = vi.fn();
  findByProject = vi.fn();
  search = vi.fn();
  findById = vi.fn();
  findRecent = vi.fn().mockResolvedValue([]);
  findRecentAcrossProjects = vi.fn().mockResolvedValue([]);
  findDependents = vi.fn().mockResolvedValue([]);
  updateMemoryTier = vi.fn();
  updateAccessTracking = vi.fn();
  findByMemoryTier = vi.fn();
  updatePropagation = vi.fn();
  findByPredictionScore = vi.fn();
  findStalePredictions = vi.fn();
  findAll = vi.fn();
  delete = vi.fn();
  recordPredictionOutcome = vi.fn();
  findOutcomesByProject = vi.fn();
  getProjectWeights = vi.fn();
  saveProjectWeights = vi.fn();
}

class MockAIProvider implements IAIProvider {
  generateSummary = vi.fn();
  generateTags = vi.fn();
  generateEmbedding = vi.fn().mockResolvedValue([]);
}

class MockVectorRepository implements IVectorRepository {
  upsert = vi.fn().mockResolvedValue(undefined);
  query = vi.fn().mockResolvedValue([]);
  delete = vi.fn().mockResolvedValue(undefined);
}

describe('ContextService Domain Service', () => {
  let contextService: ContextService;
  let mockRepository: MockContextRepository;
  let mockAIProvider: MockAIProvider;

  beforeEach(() => {
    mockRepository = new MockContextRepository();
    mockAIProvider = new MockAIProvider();

    // Default stub for findRecent (used by CausalityService for dependency detection)
    mockRepository.findRecent.mockResolvedValue([]);

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

  // ─── Layer 4: Meta-Learning wiring ─────────────────────────────────────────

  const contextWithPropagation = {
    id: 'ctx-p',
    project: 'test-project',
    summary: 'Summary',
    source: 'mcp',
    metadata: null,
    tags: 'tag1',
    timestamp: new Date(Date.now() - 3_600_000).toISOString(),
    causality: null,
    memoryTier: 'recent',
    lastAccessed: new Date(Date.now() - 3_600_000).toISOString(),
    accessCount: 3,
    propagation: {
      predictionScore: 0.7,
      lastPredicted: new Date().toISOString(),
      predictedNextAccess: null,
      propagationReason: ['recently_accessed'],
    },
  };

  describe('loadContext() — Layer 4 outcome recording', () => {
    it('should fire-and-forget recordOutcome when context has propagation data', async () => {
      mockRepository.findByProject.mockResolvedValue([contextWithPropagation]);
      mockRepository.recordPredictionOutcome.mockResolvedValue(undefined);

      await contextService.loadContext({ project: 'test-project', limit: 1 });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRepository.recordPredictionOutcome).toHaveBeenCalledOnce();
    });

    it('should not record outcome when context has no propagation', async () => {
      const noProp = { ...contextWithPropagation, propagation: null };
      mockRepository.findByProject.mockResolvedValue([noProp]);

      await contextService.loadContext({ project: 'test-project', limit: 1 });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRepository.recordPredictionOutcome).not.toHaveBeenCalled();
    });
  });

  describe('getLearningStats()', () => {
    it('should return zero averages and default weights when no data', async () => {
      mockRepository.findOutcomesByProject.mockResolvedValue([]);
      mockRepository.getProjectWeights.mockResolvedValue(null);

      const stats = await contextService.getLearningStats('new-project');

      expect(stats.sampleSize).toBe(0);
      expect(stats.currentWeights.temporalWeight).toBe(0.4);
      expect(stats.avgTemporalComponent).toBe(0);
    });
  });

  // ─── Semantic search ───────────────────────────────────────────────────────

  describe('searchContext() — semantic path', () => {
    const vector = new Array(768).fill(0.1);
    const mockSnap = {
      id: 'ctx-vec-1', project: 'p', summary: 'hexagonal arch', source: 'mcp',
      metadata: null, tags: 'arch', timestamp: new Date().toISOString(),
      causality: null, memoryTier: 'recent', lastAccessed: null, accessCount: 0,
      propagation: null,
    };

    it('should use vector similarity when embeddings and results are available', async () => {
      const mockVectors = new MockVectorRepository();
      mockAIProvider.generateEmbedding.mockResolvedValue(vector);
      mockVectors.query.mockResolvedValue(['ctx-vec-1']);
      mockRepository.findById.mockResolvedValue(mockSnap);
      mockRepository.findOutcomesByProject.mockResolvedValue([]);
      mockRepository.getProjectWeights.mockResolvedValue(null);
      const svc = new ContextService(mockRepository, mockAIProvider, mockVectors);

      const results = await svc.searchContext({ query: 'ports and adapters' });

      expect(mockVectors.query).toHaveBeenCalledWith(vector, 10, undefined);
      expect(mockRepository.findById).toHaveBeenCalledWith('ctx-vec-1');
      expect(mockRepository.search).not.toHaveBeenCalled();
      expect(results[0].id).toBe('ctx-vec-1');
    });

    it('should fall back to keyword search when embedding returns empty array', async () => {
      const mockVectors = new MockVectorRepository();
      mockAIProvider.generateEmbedding.mockResolvedValue([]);
      mockRepository.search.mockResolvedValue([mockSnap]);
      mockRepository.findOutcomesByProject.mockResolvedValue([]);
      mockRepository.getProjectWeights.mockResolvedValue(null);
      const svc = new ContextService(mockRepository, mockAIProvider, mockVectors);

      const results = await svc.searchContext({ query: 'hexagonal' });

      expect(mockRepository.search).toHaveBeenCalledWith('hexagonal', undefined);
      expect(results).toHaveLength(1);
    });

    it('should fall back to keyword search when Vectorize returns no matches', async () => {
      const mockVectors = new MockVectorRepository();
      mockAIProvider.generateEmbedding.mockResolvedValue(vector);
      mockVectors.query.mockResolvedValue([]);
      mockRepository.search.mockResolvedValue([mockSnap]);
      mockRepository.findOutcomesByProject.mockResolvedValue([]);
      mockRepository.getProjectWeights.mockResolvedValue(null);
      const svc = new ContextService(mockRepository, mockAIProvider, mockVectors);

      const results = await svc.searchContext({ query: 'hexagonal' });

      expect(mockRepository.search).toHaveBeenCalled();
      expect(results).toHaveLength(1);
    });

    it('should use keyword search when no vector repo provided', async () => {
      mockRepository.search.mockResolvedValue([mockSnap]);
      mockRepository.findOutcomesByProject.mockResolvedValue([]);
      mockRepository.getProjectWeights.mockResolvedValue(null);

      await contextService.searchContext({ query: 'hexagonal' });

      expect(mockAIProvider.generateEmbedding).not.toHaveBeenCalled();
      expect(mockRepository.search).toHaveBeenCalled();
    });

    it('should pass project filter to vector query', async () => {
      const mockVectors = new MockVectorRepository();
      mockAIProvider.generateEmbedding.mockResolvedValue(vector);
      mockVectors.query.mockResolvedValue([]);
      mockRepository.search.mockResolvedValue([]);
      mockRepository.findOutcomesByProject.mockResolvedValue([]);
      mockRepository.getProjectWeights.mockResolvedValue(null);
      const svc = new ContextService(mockRepository, mockAIProvider, mockVectors);

      await svc.searchContext({ query: 'arch', project: 'my-project' });

      expect(mockVectors.query).toHaveBeenCalledWith(vector, 10, 'my-project');
    });
  });

  // ─── Save-time embedding (Semantic Search infrastructure) ──────────────────

  describe('saveContext() — embedding', () => {
    let mockVectors: MockVectorRepository;

    beforeEach(() => {
      mockVectors = new MockVectorRepository();
      mockAIProvider.generateSummary.mockResolvedValue('AI summary');
      mockAIProvider.generateTags.mockResolvedValue('tag1,tag2');
      mockRepository.save.mockResolvedValue('ctx-1');
      mockRepository.findRecent.mockResolvedValue([]);
    });

    it('should upsert embedding to vector repo after save when vector is returned', async () => {
      const vector = new Array(768).fill(0.1);
      mockAIProvider.generateEmbedding.mockResolvedValue(vector);
      const serviceWithVectors = new ContextService(mockRepository, mockAIProvider, mockVectors);

      await serviceWithVectors.saveContext({ project: 'p', content: 'c', source: 'mcp' });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAIProvider.generateEmbedding).toHaveBeenCalledWith('AI summary');
      expect(mockVectors.upsert).toHaveBeenCalledOnce();
    });

    it('should skip upsert when embedding returns empty array', async () => {
      mockAIProvider.generateEmbedding.mockResolvedValue([]);
      const serviceWithVectors = new ContextService(mockRepository, mockAIProvider, mockVectors);

      await serviceWithVectors.saveContext({ project: 'p', content: 'c', source: 'mcp' });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockVectors.upsert).not.toHaveBeenCalled();
    });

    it('should skip embedding entirely when no vector repo provided', async () => {
      await contextService.saveContext({ project: 'p', content: 'c', source: 'mcp' });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAIProvider.generateEmbedding).not.toHaveBeenCalled();
    });
  });
});
