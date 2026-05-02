import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetaLearningService } from './MetaLearningService';
import type { IContextRepository } from '../../application/ports/IContextRepository';
import type { ContextSnapshot, PredictionOutcome, ProjectWeights } from '../../types';
import { MemoryTier } from '../../types';

// ─── Mock repository ──────────────────────────────────────────────────────────

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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<ContextSnapshot> = {}): ContextSnapshot {
  return {
    id: 'ctx-1',
    project: 'test-project',
    summary: 'Test summary',
    source: 'mcp',
    metadata: null,
    tags: 'tag1',
    timestamp: new Date(Date.now() - 2 * 3_600_000).toISOString(), // 2h ago
    causality: null,
    memoryTier: MemoryTier.RECENT,
    lastAccessed: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    accessCount: 5,
    propagation: {
      predictionScore: 0.65,
      lastPredicted: new Date().toISOString(),
      predictedNextAccess: null,
      propagationReason: ['recently_accessed'],
    },
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<PredictionOutcome> = {}): PredictionOutcome {
  return {
    id: 'outcome-1',
    contextId: 'ctx-1',
    project: 'test-project',
    predictedScore: 0.65,
    temporalComponent: 0.5,
    causalComponent: 0.3,
    frequencyComponent: 0.2,
    actuallyAccessed: true,
    recordedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MetaLearningService (Layer 4: Meta-Learning)', () => {
  let service: MetaLearningService;
  let mockRepo: MockContextRepository;

  beforeEach(() => {
    mockRepo = new MockContextRepository();
    mockRepo.recordPredictionOutcome.mockResolvedValue(undefined);
    mockRepo.findOutcomesByProject.mockResolvedValue([]);
    mockRepo.getProjectWeights.mockResolvedValue(null);
    mockRepo.saveProjectWeights.mockResolvedValue(undefined);
    service = new MetaLearningService(mockRepo);
  });

  // ─── recordOutcome() ───────────────────────────────────────────────────────

  describe('recordOutcome()', () => {
    it('should record outcome with computed component scores', async () => {
      const context = makeContext({ accessCount: 10 });

      await service.recordOutcome(context);

      expect(mockRepo.recordPredictionOutcome).toHaveBeenCalledOnce();
      const outcome = mockRepo.recordPredictionOutcome.mock.calls[0][0] as PredictionOutcome;
      expect(outcome.contextId).toBe('ctx-1');
      expect(outcome.project).toBe('test-project');
      expect(outcome.predictedScore).toBe(0.65);
      expect(outcome.actuallyAccessed).toBe(true);
      expect(outcome.temporalComponent).toBeGreaterThan(0);
      expect(outcome.frequencyComponent).toBeGreaterThan(0);
    });

    it('should skip recording when context has no propagation data', async () => {
      const context = makeContext({ propagation: null });

      await service.recordOutcome(context);

      expect(mockRepo.recordPredictionOutcome).not.toHaveBeenCalled();
    });

    it('should include causal component when causality exists', async () => {
      const context = makeContext({
        causality: {
          actionType: 'decision',
          rationale: 'test',
          dependencies: ['dep-1'],
          causedBy: null,
        },
      });

      await service.recordOutcome(context);

      const outcome = mockRepo.recordPredictionOutcome.mock.calls[0][0] as PredictionOutcome;
      expect(outcome.causalComponent).toBeGreaterThan(0);
    });
  });

  // ─── tuneWeights() ────────────────────────────────────────────────────────

  describe('tuneWeights()', () => {
    it('should return defaults when sample size is below minimum (20)', async () => {
      mockRepo.findOutcomesByProject.mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => makeOutcome({ id: `o-${i}` }))
      );

      const weights = await service.tuneWeights('test-project');

      expect(weights.temporalWeight).toBe(0.4);
      expect(weights.causalWeight).toBe(0.3);
      expect(weights.frequencyWeight).toBe(0.3);
      expect(weights.lastTuned).toBeNull();
      expect(mockRepo.saveProjectWeights).not.toHaveBeenCalled();
    });

    it('should tune weights when sample size meets minimum', async () => {
      // 20 outcomes all with high temporal component
      mockRepo.findOutcomesByProject.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => makeOutcome({
          id: `o-${i}`,
          temporalComponent: 0.8,
          causalComponent: 0.1,
          frequencyComponent: 0.1,
        }))
      );

      const weights = await service.tuneWeights('test-project');

      // Temporal should dominate (0.8 avg vs 0.1/0.1)
      expect(weights.temporalWeight).toBeGreaterThan(0.5);
      expect(weights.causalWeight).toBeLessThan(0.3);
      expect(weights.frequencyWeight).toBeLessThan(0.3);
    });

    it('should normalise weights so they sum to 1.0', async () => {
      mockRepo.findOutcomesByProject.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => makeOutcome({
          id: `o-${i}`,
          temporalComponent: 0.6,
          causalComponent: 0.2,
          frequencyComponent: 0.2,
        }))
      );

      const weights = await service.tuneWeights('test-project');
      const sum = weights.temporalWeight + weights.causalWeight + weights.frequencyWeight;

      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should cap temporal weight at 0.6 maximum', async () => {
      // All temporal, zero causal/frequency
      mockRepo.findOutcomesByProject.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => makeOutcome({
          id: `o-${i}`,
          temporalComponent: 1.0,
          causalComponent: 0.0,
          frequencyComponent: 0.0,
        }))
      );

      const weights = await service.tuneWeights('test-project');

      expect(weights.temporalWeight).toBeLessThanOrEqual(0.6);
    });

    it('should enforce minimum weight of 0.1 per dimension', async () => {
      // Extreme skew — one dimension dominates
      mockRepo.findOutcomesByProject.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => makeOutcome({
          id: `o-${i}`,
          temporalComponent: 0.9,
          causalComponent: 0.001,
          frequencyComponent: 0.001,
        }))
      );

      const weights = await service.tuneWeights('test-project');

      expect(weights.causalWeight).toBeGreaterThanOrEqual(0.1);
      expect(weights.frequencyWeight).toBeGreaterThanOrEqual(0.1);
    });

    it('should persist tuned weights to repository', async () => {
      mockRepo.findOutcomesByProject.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => makeOutcome({ id: `o-${i}` }))
      );

      await service.tuneWeights('test-project');

      expect(mockRepo.saveProjectWeights).toHaveBeenCalledOnce();
      const saved = mockRepo.saveProjectWeights.mock.calls[0][0] as ProjectWeights;
      expect(saved.project).toBe('test-project');
      expect(saved.sampleSize).toBe(20);
      expect(saved.lastTuned).not.toBeNull();
    });
  });

  // ─── getProjectWeights() ──────────────────────────────────────────────────

  describe('getProjectWeights()', () => {
    it('should return defaults (0.4/0.3/0.3) when no learned weights exist', async () => {
      mockRepo.getProjectWeights.mockResolvedValue(null);

      const weights = await service.getProjectWeights('new-project');

      expect(weights.temporalWeight).toBe(0.4);
      expect(weights.causalWeight).toBe(0.3);
      expect(weights.frequencyWeight).toBe(0.3);
      expect(weights.sampleSize).toBe(0);
      expect(weights.lastTuned).toBeNull();
    });

    it('should return learned weights when they exist', async () => {
      const learned: ProjectWeights = {
        project: 'test-project',
        temporalWeight: 0.5,
        causalWeight: 0.3,
        frequencyWeight: 0.2,
        sampleSize: 45,
        lastTuned: '2026-05-01T06:00:00.000Z',
      };
      mockRepo.getProjectWeights.mockResolvedValue(learned);

      const weights = await service.getProjectWeights('test-project');

      expect(weights.temporalWeight).toBe(0.5);
      expect(weights.sampleSize).toBe(45);
    });
  });

  // ─── getLearningStats() ───────────────────────────────────────────────────

  describe('getLearningStats()', () => {
    it('should return zero averages when no outcomes exist', async () => {
      mockRepo.findOutcomesByProject.mockResolvedValue([]);
      mockRepo.getProjectWeights.mockResolvedValue(null);

      const stats = await service.getLearningStats('test-project');

      expect(stats.sampleSize).toBe(0);
      expect(stats.avgTemporalComponent).toBe(0);
      expect(stats.avgCausalComponent).toBe(0);
      expect(stats.avgFrequencyComponent).toBe(0);
    });

    it('should aggregate component averages across outcomes', async () => {
      mockRepo.findOutcomesByProject.mockResolvedValue([
        makeOutcome({ temporalComponent: 0.8, causalComponent: 0.4, frequencyComponent: 0.2 }),
        makeOutcome({ id: 'o-2', temporalComponent: 0.6, causalComponent: 0.2, frequencyComponent: 0.4 }),
      ]);
      mockRepo.getProjectWeights.mockResolvedValue(null);

      const stats = await service.getLearningStats('test-project');

      expect(stats.sampleSize).toBe(2);
      expect(stats.avgTemporalComponent).toBeCloseTo(0.7, 5);
      expect(stats.avgCausalComponent).toBeCloseTo(0.3, 5);
      expect(stats.avgFrequencyComponent).toBeCloseTo(0.3, 5);
    });

    it('should include current weights in stats', async () => {
      const learned: ProjectWeights = {
        project: 'test-project',
        temporalWeight: 0.5,
        causalWeight: 0.3,
        frequencyWeight: 0.2,
        sampleSize: 30,
        lastTuned: '2026-05-01T06:00:00.000Z',
      };
      mockRepo.getProjectWeights.mockResolvedValue(learned);
      mockRepo.findOutcomesByProject.mockResolvedValue([]);

      const stats = await service.getLearningStats('test-project');

      expect(stats.currentWeights.temporalWeight).toBe(0.5);
      expect(stats.lastTuned).toBe('2026-05-01T06:00:00.000Z');
    });
  });

  // ─── Component calculators ─────────────────────────────────────────────────

  describe('calculateTemporalComponent()', () => {
    it('should return exponential decay based on hours since last access', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 3_600_000).toISOString();
      const context = makeContext({ lastAccessed: oneHourAgo });

      const score = service.calculateTemporalComponent(context);

      expect(score).toBeCloseTo(Math.exp(-1 / 24), 5);
    });

    it('should return tier-based default when never accessed', () => {
      const context = makeContext({ lastAccessed: null, memoryTier: MemoryTier.ACTIVE });

      const score = service.calculateTemporalComponent(context);

      expect(score).toBe(0.3);
    });
  });

  describe('calculateCausalComponent()', () => {
    it('should return 0 when no causality', () => {
      const context = makeContext({ causality: null });

      expect(service.calculateCausalComponent(context)).toBe(0);
    });

    it('should score root with dependents highest', () => {
      const root = makeContext({
        causality: { actionType: 'decision', rationale: '', dependencies: ['dep-1'], causedBy: null },
      });
      const leaf = makeContext({
        causality: { actionType: 'decision', rationale: '', dependencies: [], causedBy: 'parent' },
      });

      expect(service.calculateCausalComponent(root)).toBeGreaterThan(
        service.calculateCausalComponent(leaf)
      );
    });
  });

  describe('calculateFrequencyComponent()', () => {
    it('should return 0 for never-accessed contexts', () => {
      const context = makeContext({ accessCount: 0 });

      expect(service.calculateFrequencyComponent(context)).toBe(0);
    });

    it('should increase logarithmically with access count', () => {
      const low = makeContext({ accessCount: 1 });
      const high = makeContext({ accessCount: 50 });

      expect(service.calculateFrequencyComponent(high)).toBeGreaterThan(
        service.calculateFrequencyComponent(low)
      );
    });
  });
});
