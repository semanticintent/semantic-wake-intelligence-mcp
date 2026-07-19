/**
 * 🎯 LAYER 5 TESTS: Temporal Personality Modes
 *
 * Verifies that each mode produces distinct retrieval and ranking behaviour.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextService } from './ContextService';
import type { IContextRepository } from '../../application/ports/IContextRepository';
import type { IAIProvider } from '../../application/ports/IAIProvider';
import type { ContextSnapshot, PropagationMetadata } from '../../types';
import { MemoryTier } from '../../types';

// Minimal snapshot factory
function makeSnapshot(overrides: Partial<ContextSnapshot> = {}): ContextSnapshot {
  return {
    id: crypto.randomUUID(),
    project: 'test-project',
    summary: 'summary text',
    source: 'mcp',
    metadata: null,
    tags: 'tag1,tag2',
    timestamp: new Date().toISOString(),
    causality: null,
    memoryTier: MemoryTier.RECENT,
    lastAccessed: null,
    accessCount: 0,
    propagation: null,
    ...overrides,
  };
}

class MockRepository implements IContextRepository {
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
  getProjectWeights = vi.fn().mockResolvedValue(null);
  saveProjectWeights = vi.fn();
}

class MockAIProvider implements IAIProvider {
  generateSummary = vi.fn().mockResolvedValue('summary');
  generateTags = vi.fn().mockResolvedValue('tag');
  generateEmbedding = vi.fn().mockResolvedValue([]);
}

describe('Layer 5: Temporal Personality Modes', () => {
  let service: ContextService;
  let repo: MockRepository;

  beforeEach(() => {
    repo = new MockRepository();
    service = new ContextService(repo, new MockAIProvider());
    repo.recordPredictionOutcome.mockResolvedValue(undefined);
    repo.updateAccessTracking.mockResolvedValue(undefined);
  });

  describe('loadContext — historian (default)', () => {
    it('returns results from findByProject in timestamp order', async () => {
      const snaps = [makeSnapshot({ summary: 'newest' }), makeSnapshot({ summary: 'older' })];
      repo.findByProject.mockResolvedValue(snaps);

      const result = await service.loadContext({ project: 'p', personality_mode: 'historian' });

      expect(repo.findByProject).toHaveBeenCalledWith('p', 1);
      expect(result[0].summary).toBe('newest');
    });

    it('defaults to historian when no mode provided', async () => {
      repo.findByProject.mockResolvedValue([makeSnapshot()]);
      await service.loadContext({ project: 'p' });
      expect(repo.findByProject).toHaveBeenCalled();
      expect(repo.findByPredictionScore).not.toHaveBeenCalled();
    });
  });

  describe('loadContext — prophet', () => {
    it('calls findByPredictionScore instead of findByProject', async () => {
      const highScore = makeSnapshot({
        summary: 'high priority',
        propagation: { predictionScore: 0.9, lastPredicted: null, predictedNextAccess: null, propagationReason: ['causal_chain'] }
      });
      repo.findByPredictionScore.mockResolvedValue([highScore]);

      const result = await service.loadContext({ project: 'p', personality_mode: 'prophet' });

      expect(repo.findByPredictionScore).toHaveBeenCalledWith(0.0, 'p', 1);
      expect(repo.findByProject).not.toHaveBeenCalled();
      expect(result[0].summary).toBe('high priority');
    });

    it('falls back to findByProject when no predictions exist', async () => {
      repo.findByPredictionScore.mockResolvedValue([]);
      repo.findByProject.mockResolvedValue([makeSnapshot({ summary: 'fallback' })]);

      const result = await service.loadContext({ project: 'p', personality_mode: 'prophet' });

      expect(repo.findByProject).toHaveBeenCalled();
      expect(result[0].summary).toBe('fallback');
    });
  });

  describe('loadContext — archaeologist', () => {
    it('surfaces never-accessed contexts first', async () => {
      const neverAccessed = makeSnapshot({ id: 'a', summary: 'never touched', lastAccessed: null });
      const recentlyAccessed = makeSnapshot({ id: 'b', summary: 'used recently', lastAccessed: new Date().toISOString() });
      const oldAccessed = makeSnapshot({ id: 'c', summary: 'used long ago', lastAccessed: '2025-01-01T00:00:00.000Z' });

      repo.findByProject.mockResolvedValue([recentlyAccessed, oldAccessed, neverAccessed]);

      const result = await service.loadContext({ project: 'p', limit: 2, personality_mode: 'archaeologist' });

      // null lastAccessed should sort first, then oldest accessed
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('c');
    });

    it('fetches a wide pool (50) to surface dormant threads', async () => {
      repo.findByProject.mockResolvedValue([makeSnapshot()]);

      await service.loadContext({ project: 'p', limit: 1, personality_mode: 'archaeologist' });

      expect(repo.findByProject).toHaveBeenCalledWith('p', 50);
    });
  });

  describe('loadContext — minimalist', () => {
    it('returns results from findByProject (same retrieval as historian)', async () => {
      const snap = makeSnapshot({ summary: 'clean output' });
      repo.findByProject.mockResolvedValue([snap]);

      const result = await service.loadContext({ project: 'p', personality_mode: 'minimalist' });

      expect(repo.findByProject).toHaveBeenCalledWith('p', 1);
      expect(result[0].summary).toBe('clean output');
    });
  });

  describe('searchContext — mode re-ranking', () => {
    it('prophet mode sorts search results by predictionScore DESC', async () => {
      const low = makeSnapshot({ summary: 'low score', propagation: { predictionScore: 0.2, lastPredicted: null, predictedNextAccess: null, propagationReason: [] } });
      const high = makeSnapshot({ summary: 'high score', propagation: { predictionScore: 0.8, lastPredicted: null, predictedNextAccess: null, propagationReason: [] } });
      repo.search.mockResolvedValue([low, high]);

      const result = await service.searchContext({ query: 'query', personality_mode: 'prophet' });

      expect(result[0].summary).toBe('high score');
      expect(result[1].summary).toBe('low score');
    });

    it('archaeologist mode sorts search results by lastAccessed ASC (null first)', async () => {
      const recent = makeSnapshot({ summary: 'recent', lastAccessed: new Date().toISOString() });
      const never = makeSnapshot({ summary: 'dormant', lastAccessed: null });
      repo.search.mockResolvedValue([recent, never]);

      const result = await service.searchContext({ query: 'query', personality_mode: 'archaeologist' });

      expect(result[0].summary).toBe('dormant');
    });

    it('historian mode preserves original search result order', async () => {
      const a = makeSnapshot({ summary: 'first result' });
      const b = makeSnapshot({ summary: 'second result' });
      repo.search.mockResolvedValue([a, b]);

      const result = await service.searchContext({ query: 'query', personality_mode: 'historian' });

      expect(result[0].summary).toBe('first result');
    });
  });
});
