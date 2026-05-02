/**
 * 🎯 WAKE INTELLIGENCE: Unit tests for PropagationService (Layer 3: Future)
 *
 * TEST STRATEGY:
 * - Mock IContextRepository and CausalityService
 * - Test composite prediction scoring (temporal + causal + frequency)
 * - Test causal strength heuristics (root vs leaf vs no causality)
 * - Test next access estimation (never / once / multiple)
 * - Test prediction reason generation (observable signals)
 * - Test batch update operations (project-scoped + cross-project)
 * - Test staleness detection and lazy refresh
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PropagationService } from './PropagationService';
import { CausalityService } from './CausalityService';
import { ContextSnapshot } from '../models/ContextSnapshot';
import { MemoryTier } from '../../types';
import type { IContextRepository } from '../../application/ports/IContextRepository';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<ContextSnapshot> = {}): ContextSnapshot {
  return ContextSnapshot.fromDatabase({
    id: 'ctx-1',
    project: 'test-project',
    summary: 'Test context',
    source: 'mcp',
    metadata: null,
    tags: 'test',
    timestamp: new Date().toISOString(),
    causality: null,
    memoryTier: MemoryTier.ACTIVE,
    lastAccessed: null,
    accessCount: 0,
    propagation: null,
    ...overrides,
  });
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

class MockContextRepository implements IContextRepository {
  save = vi.fn();
  findByProject = vi.fn().mockResolvedValue([]);
  findAll = vi.fn().mockResolvedValue([]);
  search = vi.fn().mockResolvedValue([]);
  findById = vi.fn().mockResolvedValue(null);
  findRecent = vi.fn().mockResolvedValue([]);
  updateMemoryTier = vi.fn().mockResolvedValue(undefined);
  updateAccessTracking = vi.fn().mockResolvedValue(undefined);
  findByMemoryTier = vi.fn().mockResolvedValue([]);
  updatePropagation = vi.fn().mockResolvedValue(undefined);
  findByPredictionScore = vi.fn().mockResolvedValue([]);
  findStalePredictions = vi.fn().mockResolvedValue([]);
  delete = vi.fn().mockResolvedValue(undefined);
  recordPredictionOutcome = vi.fn();
  findOutcomesByProject = vi.fn();
  getProjectWeights = vi.fn();
  saveProjectWeights = vi.fn();
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PropagationService (Layer 3: Future)', () => {
  let service: PropagationService;
  let mockRepo: MockContextRepository;
  let causalityService: CausalityService;

  beforeEach(() => {
    mockRepo = new MockContextRepository();
    causalityService = new CausalityService(mockRepo as unknown as IContextRepository);
    service = new PropagationService(mockRepo as unknown as IContextRepository, causalityService);
  });

  // ── predictContext() ───────────────────────────────────────────────────────

  describe('predictContext()', () => {
    it('should return PropagationMetadata with all required fields', async () => {
      const context = makeContext();

      const result = await service.predictContext(context);

      expect(result).toHaveProperty('predictionScore');
      expect(result).toHaveProperty('lastPredicted');
      expect(result).toHaveProperty('predictedNextAccess');
      expect(result).toHaveProperty('propagationReason');
      expect(typeof result.predictionScore).toBe('number');
      expect(Array.isArray(result.propagationReason)).toBe(true);
    });

    it('should set lastPredicted to approximately now', async () => {
      const before = new Date().toISOString();
      const result = await service.predictContext(makeContext());
      const after = new Date().toISOString();

      expect(result.lastPredicted! >= before).toBe(true);
      expect(result.lastPredicted! <= after).toBe(true);
    });

    it('should clamp prediction score to [0.0, 1.0]', async () => {
      const highFreq = makeContext({
        lastAccessed: hoursAgo(0.1),
        accessCount: 1000,
        causality: { actionType: 'decision', rationale: 'test', dependencies: ['a', 'b', 'c'], causedBy: null },
      });

      const result = await service.predictContext(highFreq);

      expect(result.predictionScore).toBeGreaterThanOrEqual(0.0);
      expect(result.predictionScore).toBeLessThanOrEqual(1.0);
    });

    describe('temporal scoring', () => {
      it('should give ACTIVE tier context a baseline score when never accessed', async () => {
        const context = makeContext({ memoryTier: MemoryTier.ACTIVE, lastAccessed: null, accessCount: 0 });

        const result = await service.predictContext(context);

        // Temporal component = 0.3 (ACTIVE tier default), causal = 0, freq = 0
        // Composite = 0.4 * 0.3 + 0.3 * 0 + 0.3 * 0 = 0.12
        expect(result.predictionScore).toBeCloseTo(0.12, 2);
      });

      it('should give EXPIRED tier context a zero temporal score when never accessed', async () => {
        const context = makeContext({ memoryTier: MemoryTier.EXPIRED, lastAccessed: null, accessCount: 0 });

        const result = await service.predictContext(context);

        // Temporal = 0 (EXPIRED), causal = 0, freq = 0 → score = 0
        expect(result.predictionScore).toBeCloseTo(0.0, 2);
      });

      it('should give recently accessed context a high temporal score', async () => {
        const neverAccessed = makeContext({ lastAccessed: null, accessCount: 0, memoryTier: MemoryTier.ACTIVE });
        const recentlyAccessed = makeContext({ lastAccessed: hoursAgo(0.5), accessCount: 1 });

        const recentResult = await service.predictContext(recentlyAccessed);
        const neverResult = await service.predictContext(neverAccessed);

        expect(recentResult.predictionScore).toBeGreaterThan(neverResult.predictionScore);
      });

      it('should give older access a lower score than recent access', async () => {
        const recentCtx = makeContext({ lastAccessed: hoursAgo(1), accessCount: 1 });
        const oldCtx = makeContext({ lastAccessed: hoursAgo(48), accessCount: 1 });

        const recent = await service.predictContext(recentCtx);
        const old = await service.predictContext(oldCtx);

        expect(recent.predictionScore).toBeGreaterThan(old.predictionScore);
      });
    });

    describe('frequency scoring', () => {
      it('should give high-access context a higher score than low-access', async () => {
        const lowFreq = makeContext({ accessCount: 1, lastAccessed: null, memoryTier: MemoryTier.ACTIVE });
        const highFreq = makeContext({ accessCount: 50, lastAccessed: null, memoryTier: MemoryTier.ACTIVE });

        const low = await service.predictContext(lowFreq);
        const high = await service.predictContext(highFreq);

        expect(high.predictionScore).toBeGreaterThan(low.predictionScore);
      });

      it('should give zero-access context zero frequency contribution', async () => {
        const context = makeContext({ accessCount: 0, lastAccessed: null, memoryTier: MemoryTier.EXPIRED });

        const result = await service.predictContext(context);

        // EXPIRED tier + 0 access + no causality → score = 0
        expect(result.predictionScore).toBeCloseTo(0.0, 2);
      });
    });

    describe('causal strength scoring', () => {
      it('should give context with no causality a zero causal score', async () => {
        const noCausality = makeContext({ causality: null, lastAccessed: null, accessCount: 0, memoryTier: MemoryTier.EXPIRED });

        const result = await service.predictContext(noCausality);

        expect(result.predictionScore).toBeCloseTo(0.0, 2);
      });

      it('should give causal chain root (no causedBy, has deps) a higher score than leaf', async () => {
        const root = makeContext({
          causality: { actionType: 'decision', rationale: 'root', dependencies: ['dep-1', 'dep-2'], causedBy: null },
          lastAccessed: null, accessCount: 0, memoryTier: MemoryTier.EXPIRED,
        });
        const leaf = makeContext({
          causality: { actionType: 'file_edit', rationale: 'leaf', dependencies: [], causedBy: 'parent-id' },
          lastAccessed: null, accessCount: 0, memoryTier: MemoryTier.EXPIRED,
        });

        const rootResult = await service.predictContext(root);
        const leafResult = await service.predictContext(leaf);

        expect(rootResult.predictionScore).toBeGreaterThan(leafResult.predictionScore);
      });

      it('should cap causal score at 1.0 regardless of dependency count', async () => {
        const manyDeps = makeContext({
          causality: {
            actionType: 'decision',
            rationale: 'root with many deps',
            dependencies: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
            causedBy: null,
          },
        });

        const result = await service.predictContext(manyDeps);

        expect(result.predictionScore).toBeLessThanOrEqual(1.0);
      });
    });
  });

  // ── estimateNextAccess() (tested via predictContext) ─────────────────────

  describe('next access estimation', () => {
    it('should return null predictedNextAccess when context was never accessed', async () => {
      const context = makeContext({ lastAccessed: null, accessCount: 0 });

      const result = await service.predictContext(context);

      expect(result.predictedNextAccess).toBeNull();
    });

    it('should estimate next day for single-access context', async () => {
      const lastAccessed = hoursAgo(2);
      const context = makeContext({ lastAccessed, accessCount: 1 });

      const result = await service.predictContext(context);

      expect(result.predictedNextAccess).not.toBeNull();
      const predicted = new Date(result.predictedNextAccess!).getTime();
      const lastAccessTime = new Date(lastAccessed).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      // Should be approximately lastAccessed + 1 day
      expect(Math.abs(predicted - (lastAccessTime + oneDayMs))).toBeLessThan(5000);
    });

    it('should cap predicted next access at 7 days from now', async () => {
      // Context last accessed 6 days ago with average interval of 30 days
      const context = makeContext({
        lastAccessed: daysAgo(6),
        timestamp: daysAgo(36),
        accessCount: 2,
      });

      const result = await service.predictContext(context);

      if (result.predictedNextAccess) {
        const predicted = new Date(result.predictedNextAccess).getTime();
        const maxFuture = Date.now() + 7 * 24 * 60 * 60 * 1000;
        expect(predicted).toBeLessThanOrEqual(maxFuture + 5000); // 5s tolerance
      }
    });
  });

  // ── generatePropagationReasons() (tested via predictContext) ─────────────

  describe('prediction reasons', () => {
    it('should include baseline_prediction when no signals present', async () => {
      // ARCHIVED tier + no access + no causality → no reason fires → falls back to baseline
      const context = makeContext({ memoryTier: MemoryTier.ARCHIVED, lastAccessed: null, accessCount: 0, causality: null });

      const result = await service.predictContext(context);

      expect(result.propagationReason).toContain('baseline_prediction');
    });

    it('should include recently_accessed for context accessed under 1 hour ago', async () => {
      const context = makeContext({ lastAccessed: hoursAgo(0.3), accessCount: 1 });

      const result = await service.predictContext(context);

      expect(result.propagationReason).toContain('recently_accessed');
    });

    it('should include accessed_today for context accessed 2-23 hours ago', async () => {
      const context = makeContext({ lastAccessed: hoursAgo(5), accessCount: 1 });

      const result = await service.predictContext(context);

      expect(result.propagationReason).toContain('accessed_today');
    });

    it('should include high_access_frequency for access count >= 10', async () => {
      const context = makeContext({ lastAccessed: hoursAgo(1), accessCount: 10 });

      const result = await service.predictContext(context);

      expect(result.propagationReason).toContain('high_access_frequency');
    });

    it('should include moderate_access_frequency for access count 3-9', async () => {
      const context = makeContext({ lastAccessed: hoursAgo(1), accessCount: 5 });

      const result = await service.predictContext(context);

      expect(result.propagationReason).toContain('moderate_access_frequency');
    });

    it('should include causal_chain_root for context with high causal strength', async () => {
      const context = makeContext({
        causality: { actionType: 'decision', rationale: 'root', dependencies: ['a', 'b', 'c'], causedBy: null },
        lastAccessed: null, accessCount: 0, memoryTier: MemoryTier.EXPIRED,
      });

      const result = await service.predictContext(context);

      expect(result.propagationReason).toContain('causal_chain_root');
    });

    it('should include active_memory_tier for ACTIVE contexts', async () => {
      const context = makeContext({ memoryTier: MemoryTier.ACTIVE, lastAccessed: null, accessCount: 0 });

      const result = await service.predictContext(context);

      expect(result.propagationReason).toContain('active_memory_tier');
    });

    it('should not include baseline_prediction when other signals are present', async () => {
      const context = makeContext({ lastAccessed: hoursAgo(0.5), accessCount: 5 });

      const result = await service.predictContext(context);

      expect(result.propagationReason).not.toContain('baseline_prediction');
    });
  });

  // ── updateProjectPredictions() ────────────────────────────────────────────

  describe('updateProjectPredictions()', () => {
    it('should only update contexts matching the specified project', async () => {
      const stale = [
        makeContext({ id: 'a', project: 'project-alpha' }),
        makeContext({ id: 'b', project: 'project-beta' }),
        makeContext({ id: 'c', project: 'project-alpha' }),
      ];
      vi.mocked(mockRepo.findStalePredictions).mockResolvedValue(stale);

      const count = await service.updateProjectPredictions('project-alpha');

      expect(count).toBe(2);
      const updatedIds = vi.mocked(mockRepo.updatePropagation).mock.calls.map(([id]) => id);
      expect(updatedIds).toContain('a');
      expect(updatedIds).toContain('c');
      expect(updatedIds).not.toContain('b');
    });

    it('should call findStalePredictions with default 24-hour threshold', async () => {
      vi.mocked(mockRepo.findStalePredictions).mockResolvedValue([]);

      await service.updateProjectPredictions('my-project');

      expect(mockRepo.findStalePredictions).toHaveBeenCalledWith(24, 100);
    });

    it('should call findStalePredictions with custom threshold', async () => {
      vi.mocked(mockRepo.findStalePredictions).mockResolvedValue([]);

      await service.updateProjectPredictions('my-project', 12);

      expect(mockRepo.findStalePredictions).toHaveBeenCalledWith(12, 100);
    });

    it('should return 0 when no stale contexts exist', async () => {
      vi.mocked(mockRepo.findStalePredictions).mockResolvedValue([]);

      const count = await service.updateProjectPredictions('empty-project');

      expect(count).toBe(0);
      expect(mockRepo.updatePropagation).not.toHaveBeenCalled();
    });

    it('should persist prediction to repository for each updated context', async () => {
      const ctx = makeContext({ id: 'ctx-x', project: 'my-project' });
      vi.mocked(mockRepo.findStalePredictions).mockResolvedValue([ctx]);

      await service.updateProjectPredictions('my-project');

      expect(mockRepo.updatePropagation).toHaveBeenCalledOnce();
      const [id, score, predicted, , reasons] = vi.mocked(mockRepo.updatePropagation).mock.calls[0];
      expect(id).toBe('ctx-x');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
      expect(typeof predicted).toBe('string');
      expect(Array.isArray(reasons)).toBe(true);
    });
  });

  // ── refreshAllStalePredictions() ──────────────────────────────────────────

  describe('refreshAllStalePredictions()', () => {
    it('should process all stale contexts regardless of project', async () => {
      const stale = [
        makeContext({ id: 'x', project: 'project-a' }),
        makeContext({ id: 'y', project: 'project-b' }),
        makeContext({ id: 'z', project: 'project-c' }),
      ];
      vi.mocked(mockRepo.findStalePredictions).mockResolvedValue(stale);

      const count = await service.refreshAllStalePredictions();

      expect(count).toBe(3);
      const updatedIds = vi.mocked(mockRepo.updatePropagation).mock.calls.map(([id]) => id);
      expect(updatedIds).toEqual(['x', 'y', 'z']);
    });

    it('should use default threshold of 24 hours and limit of 500', async () => {
      vi.mocked(mockRepo.findStalePredictions).mockResolvedValue([]);

      await service.refreshAllStalePredictions();

      expect(mockRepo.findStalePredictions).toHaveBeenCalledWith(24, 500);
    });

    it('should respect custom staleThreshold and limit', async () => {
      vi.mocked(mockRepo.findStalePredictions).mockResolvedValue([]);

      await service.refreshAllStalePredictions(6, 200);

      expect(mockRepo.findStalePredictions).toHaveBeenCalledWith(6, 200);
    });

    it('should return 0 when nothing is stale', async () => {
      vi.mocked(mockRepo.findStalePredictions).mockResolvedValue([]);

      const count = await service.refreshAllStalePredictions();

      expect(count).toBe(0);
      expect(mockRepo.updatePropagation).not.toHaveBeenCalled();
    });
  });

  // ── refreshPredictionIfStale() ────────────────────────────────────────────

  describe('refreshPredictionIfStale()', () => {
    it('should return context unchanged when prediction is fresh', async () => {
      const freshPrediction = {
        predictionScore: 0.8,
        lastPredicted: hoursAgo(1),
        predictedNextAccess: null,
        propagationReason: ['recently_accessed'],
      };
      const context = makeContext({ propagation: freshPrediction });

      const result = await service.refreshPredictionIfStale(context, 24);

      expect(mockRepo.updatePropagation).not.toHaveBeenCalled();
      expect(result).toBe(context);
    });

    it('should refresh when prediction is older than threshold', async () => {
      const stalePrediction = {
        predictionScore: 0.5,
        lastPredicted: hoursAgo(25),
        predictedNextAccess: null,
        propagationReason: ['baseline_prediction'],
      };
      const context = makeContext({ propagation: stalePrediction });

      await service.refreshPredictionIfStale(context, 24);

      expect(mockRepo.updatePropagation).toHaveBeenCalledOnce();
    });

    it('should refresh when prediction has no lastPredicted (never predicted)', async () => {
      const context = makeContext({ propagation: null });

      await service.refreshPredictionIfStale(context, 24);

      expect(mockRepo.updatePropagation).toHaveBeenCalledOnce();
    });

    it('should return updated context with new prediction after refresh', async () => {
      const context = makeContext({ propagation: null });

      const result = await service.refreshPredictionIfStale(context);

      expect(result.propagation).not.toBeNull();
      expect(result.propagation!.lastPredicted).not.toBeNull();
    });
  });

  // ── getHighValueContexts() ────────────────────────────────────────────────

  describe('getHighValueContexts()', () => {
    it('should delegate to repository.findByPredictionScore with defaults', async () => {
      vi.mocked(mockRepo.findByPredictionScore).mockResolvedValue([]);

      await service.getHighValueContexts('my-project');

      expect(mockRepo.findByPredictionScore).toHaveBeenCalledWith(0.6, 'my-project', 10);
    });

    it('should pass custom minScore and limit to repository', async () => {
      vi.mocked(mockRepo.findByPredictionScore).mockResolvedValue([]);

      await service.getHighValueContexts('my-project', 0.8, 5);

      expect(mockRepo.findByPredictionScore).toHaveBeenCalledWith(0.8, 'my-project', 5);
    });

    it('should return contexts from repository', async () => {
      const highValue = [makeContext({ id: 'hv-1' }), makeContext({ id: 'hv-2' })];
      vi.mocked(mockRepo.findByPredictionScore).mockResolvedValue(highValue);

      const result = await service.getHighValueContexts('my-project');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('hv-1');
    });
  });
});
