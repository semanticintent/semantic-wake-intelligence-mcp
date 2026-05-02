/**
 * 🎯 WAKE INTELLIGENCE: Unit tests for MemoryManagerService (Layer 2: Present)
 *
 * TEST STRATEGY:
 * - Mock IContextRepository
 * - Verify tier recalculation logic (with + without project filter)
 * - Verify pruning actually deletes expired contexts
 * - Verify access tracking delegation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryManagerService } from './MemoryManagerService';
import { ContextSnapshot } from '../models/ContextSnapshot';
import { MemoryTier } from '../../types';
import type { IContextRepository } from '../../application/ports/IContextRepository';

function makeSnapshot(overrides: Partial<ContextSnapshot> = {}): ContextSnapshot {
  return ContextSnapshot.fromDatabase({
    id: 'snap-1',
    project: 'test-project',
    summary: 'Test',
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

function makeExpiredSnapshot(id: string): ContextSnapshot {
  const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  return ContextSnapshot.fromDatabase({
    id,
    project: 'test-project',
    summary: 'Expired',
    source: 'mcp',
    metadata: null,
    tags: 'old',
    timestamp: thirtyOneDaysAgo,
    causality: null,
    memoryTier: MemoryTier.EXPIRED,
    lastAccessed: null,
    accessCount: 0,
    propagation: null,
  });
}

describe('MemoryManagerService', () => {
  let service: MemoryManagerService;
  let mockRepo: IContextRepository;

  beforeEach(() => {
    mockRepo = {
      save: vi.fn(),
      findByProject: vi.fn().mockResolvedValue([]),
      findAll: vi.fn().mockResolvedValue([]),
      search: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      findRecent: vi.fn().mockResolvedValue([]),
      findRecentAcrossProjects: vi.fn().mockResolvedValue([]),
      updateMemoryTier: vi.fn().mockResolvedValue(undefined),
      updateAccessTracking: vi.fn().mockResolvedValue(undefined),
      findByMemoryTier: vi.fn().mockResolvedValue([]),
      updatePropagation: vi.fn().mockResolvedValue(undefined),
      findByPredictionScore: vi.fn().mockResolvedValue([]),
      findStalePredictions: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      recordPredictionOutcome: vi.fn().mockResolvedValue(undefined),
      findOutcomesByProject: vi.fn().mockResolvedValue([]),
      getProjectWeights: vi.fn().mockResolvedValue(null),
      saveProjectWeights: vi.fn().mockResolvedValue(undefined),
    };
    service = new MemoryManagerService(mockRepo);
  });

  describe('recalculateAllTiers()', () => {
    it('should use findByProject when project is specified', async () => {
      vi.mocked(mockRepo.findByProject).mockResolvedValue([]);

      await service.recalculateAllTiers('my-project');

      expect(mockRepo.findByProject).toHaveBeenCalledWith('my-project', 1000);
      expect(mockRepo.findAll).not.toHaveBeenCalled();
    });

    it('should use findAll when no project is specified', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([]);

      await service.recalculateAllTiers();

      expect(mockRepo.findAll).toHaveBeenCalledWith(1000);
      expect(mockRepo.findByProject).not.toHaveBeenCalled();
    });

    it('should update tier when recalculated tier differs from stored tier', async () => {
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago → RECENT
      const snapshot = makeSnapshot({ memoryTier: MemoryTier.ACTIVE, timestamp: oldTimestamp });
      vi.mocked(mockRepo.findAll).mockResolvedValue([snapshot]);

      const updated = await service.recalculateAllTiers();

      expect(mockRepo.updateMemoryTier).toHaveBeenCalledWith(snapshot.id, MemoryTier.RECENT);
      expect(updated).toBe(1);
    });

    it('should not update tier when already correct', async () => {
      const snapshot = makeSnapshot({ memoryTier: MemoryTier.ACTIVE }); // fresh → ACTIVE
      vi.mocked(mockRepo.findAll).mockResolvedValue([snapshot]);

      const updated = await service.recalculateAllTiers();

      expect(mockRepo.updateMemoryTier).not.toHaveBeenCalled();
      expect(updated).toBe(0);
    });

    it('should return count of updated contexts', async () => {
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const snapshots = [
        makeSnapshot({ id: 'a', memoryTier: MemoryTier.ACTIVE, timestamp: oldTimestamp }),
        makeSnapshot({ id: 'b', memoryTier: MemoryTier.ACTIVE, timestamp: oldTimestamp }),
        makeSnapshot({ id: 'c', memoryTier: MemoryTier.ACTIVE }), // fresh timestamp → ACTIVE, already correct → no update
      ];
      vi.mocked(mockRepo.findAll).mockResolvedValue(snapshots);

      const updated = await service.recalculateAllTiers();

      expect(updated).toBe(2);
    });
  });

  describe('pruneExpiredContexts()', () => {
    it('should find expired contexts and delete each one', async () => {
      const expired = [makeExpiredSnapshot('exp-1'), makeExpiredSnapshot('exp-2')];
      vi.mocked(mockRepo.findByMemoryTier).mockResolvedValue(expired);

      const count = await service.pruneExpiredContexts();

      expect(mockRepo.findByMemoryTier).toHaveBeenCalledWith(MemoryTier.EXPIRED, 100);
      expect(mockRepo.delete).toHaveBeenCalledWith('exp-1');
      expect(mockRepo.delete).toHaveBeenCalledWith('exp-2');
      expect(count).toBe(2);
    });

    it('should respect custom limit', async () => {
      vi.mocked(mockRepo.findByMemoryTier).mockResolvedValue([]);

      await service.pruneExpiredContexts(50);

      expect(mockRepo.findByMemoryTier).toHaveBeenCalledWith(MemoryTier.EXPIRED, 50);
    });

    it('should return 0 when nothing to prune', async () => {
      vi.mocked(mockRepo.findByMemoryTier).mockResolvedValue([]);

      const count = await service.pruneExpiredContexts();

      expect(mockRepo.delete).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });

    it('should delete oldest-first (repository ordering responsibility)', async () => {
      const expired = [makeExpiredSnapshot('oldest'), makeExpiredSnapshot('newer')];
      vi.mocked(mockRepo.findByMemoryTier).mockResolvedValue(expired);

      await service.pruneExpiredContexts();

      const deleteCalls = vi.mocked(mockRepo.delete).mock.calls.map(([id]) => id);
      expect(deleteCalls).toEqual(['oldest', 'newer']);
    });
  });

  describe('trackAccess()', () => {
    it('should delegate to repository.updateAccessTracking', async () => {
      await service.trackAccess('snap-abc');

      expect(mockRepo.updateAccessTracking).toHaveBeenCalledWith('snap-abc');
    });
  });
});
