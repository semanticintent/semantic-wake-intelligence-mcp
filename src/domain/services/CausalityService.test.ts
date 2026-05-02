/**
 * 🎯 SEMANTIC INTENT: Unit tests for CausalityService (Layer 1)
 *
 * PURPOSE: Verify causal chain logic, dependency detection, and reasoning reconstruction
 *
 * TEST STRATEGY:
 * - Mock IContextRepository
 * - Test causal chain building
 * - Test dependency detection heuristics
 * - Test reasoning reconstruction
 * - Test chain validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CausalityService } from './CausalityService';
import { ContextSnapshot } from '../models/ContextSnapshot';
import { MemoryTier } from '../../types';
import type { IContextRepository } from '../../application/ports/IContextRepository';
import type { ActionType } from '../../types';

// Mock repository
class MockContextRepository implements IContextRepository {
  save = vi.fn();
  findById = vi.fn();
  findRecent = vi.fn()
  findRecentAcrossProjects = vi.fn().mockResolvedValue([]);
  findDependents = vi.fn().mockResolvedValue([]);
  findByProject = vi.fn();
  search = vi.fn();
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

describe('CausalityService (Layer 1: Past)', () => {
  let service: CausalityService;
  let mockRepo: MockContextRepository;

  beforeEach(() => {
    mockRepo = new MockContextRepository();
    service = new CausalityService(mockRepo as IContextRepository);
  });

  describe('recordAction()', () => {
    it('should create causality metadata with rationale', async () => {
      // Arrange
      mockRepo.findRecent = vi.fn().mockResolvedValue([]);

      // Act
      const causality = await service.recordAction(
        'decision',
        'Testing causality tracking',
        null,
        'test-project'
      );

      // Assert
      expect(causality.actionType).toBe('decision');
      expect(causality.rationale).toBe('Testing causality tracking');
      expect(causality.causedBy).toBeNull();
      expect(Array.isArray(causality.dependencies)).toBe(true);
    });

    it('should auto-detect dependencies from recent contexts', async () => {
      // Arrange
      const recentSnapshots = [
        ContextSnapshot.create({
          project: 'test-project',
          summary: 'Recent context 1',
          tags: 'test',
        }),
        ContextSnapshot.create({
          project: 'test-project',
          summary: 'Recent context 2',
          tags: 'test',
        }),
      ];

      mockRepo.findRecent = vi.fn().mockResolvedValue(recentSnapshots);

      // Act
      const causality = await service.recordAction(
        'conversation',
        'Building on previous discussion',
        null,
        'test-project'
      );

      // Assert
      expect(causality.dependencies).toHaveLength(2);
      expect(causality.dependencies[0]).toBe(recentSnapshots[0].id);
      expect(causality.dependencies[1]).toBe(recentSnapshots[1].id);
    });

    it('should include causedBy when parent provided', async () => {
      // Arrange
      mockRepo.findRecent = vi.fn().mockResolvedValue([]);
      const parentId = 'parent-snapshot-id';

      // Act
      const causality = await service.recordAction(
        'file_edit',
        'Fixing bug from previous context',
        parentId,
        'test-project'
      );

      // Assert
      expect(causality.causedBy).toBe(parentId);
    });

    it('should work without project (no dependency detection)', async () => {
      // Act
      const causality = await service.recordAction(
        'research',
        'Exploring new feature',
        null
      );

      // Assert
      expect(causality.actionType).toBe('research');
      expect(causality.dependencies).toHaveLength(0);
      expect(mockRepo.findRecent).not.toHaveBeenCalled();
    });
  });

  describe('reconstructReasoning()', () => {
    it('should explain decision with causality metadata', async () => {
      // Arrange
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Implemented user authentication',
        tags: 'auth,security',
        causality: {
          actionType: 'decision',
          rationale: 'Users need secure login',
          dependencies: [],
          causedBy: null,
        },
      });

      mockRepo.findById = vi.fn().mockResolvedValue(snapshot);

      // Act
      const reasoning = await service.reconstructReasoning(snapshot.id);

      // Assert
      expect(reasoning).toContain('Action Type');
      expect(reasoning).toContain('decision');
      expect(reasoning).toContain('Rationale');
      expect(reasoning).toContain('Users need secure login');
      expect(reasoning).toContain('Context Summary');
      expect(reasoning).toContain('Implemented user authentication');
    });

    it('should include parent context when causedBy is set', async () => {
      // Arrange
      const parentSnapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Discussed authentication requirements',
        tags: 'auth',
      });

      const childSnapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Implemented OAuth flow',
        tags: 'auth,oauth',
        causality: {
          actionType: 'file_edit',
          rationale: 'Following up on requirements discussion',
          dependencies: [],
          causedBy: parentSnapshot.id,
        },
      });

      mockRepo.findById = vi.fn()
        .mockResolvedValueOnce(childSnapshot)
        .mockResolvedValueOnce(parentSnapshot);

      // Act
      const reasoning = await service.reconstructReasoning(childSnapshot.id);

      // Assert
      expect(reasoning).toContain('Caused By');
      expect(reasoning).toContain('Discussed authentication requirements');
      expect(reasoning).toContain(parentSnapshot.id);
    });

    it('should handle snapshot without causality gracefully', async () => {
      // Arrange
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Old context without causality',
        tags: 'legacy',
      });

      mockRepo.findById = vi.fn().mockResolvedValue(snapshot);

      // Act
      const reasoning = await service.reconstructReasoning(snapshot.id);

      // Assert
      expect(reasoning).toContain('No causality metadata available');
      expect(reasoning).toContain('Old context without causality');
    });

    it('should throw error if snapshot not found', async () => {
      // Arrange
      mockRepo.findById = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.reconstructReasoning('nonexistent-id')
      ).rejects.toThrow('Snapshot not found: nonexistent-id');
    });
  });

  describe('buildCausalChain()', () => {
    it('should build chain from root to target', async () => {
      // Arrange: A → B → C
      const snapshotA = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Root context',
        tags: 'root',
        causality: {
          actionType: 'research',
          rationale: 'Starting point',
          dependencies: [],
          causedBy: null,
        },
      });

      const snapshotB = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Middle context',
        tags: 'middle',
        causality: {
          actionType: 'decision',
          rationale: 'Following up',
          dependencies: [snapshotA.id],
          causedBy: snapshotA.id,
        },
      });

      const snapshotC = ContextSnapshot.create({
        project: 'test-project',
        summary: 'End context',
        tags: 'end',
        causality: {
          actionType: 'file_edit',
          rationale: 'Implementation',
          dependencies: [snapshotB.id],
          causedBy: snapshotB.id,
        },
      });

      mockRepo.findById = vi.fn()
        .mockImplementation((id: string) => {
          if (id === snapshotC.id) return Promise.resolve(snapshotC);
          if (id === snapshotB.id) return Promise.resolve(snapshotB);
          if (id === snapshotA.id) return Promise.resolve(snapshotA);
          return Promise.resolve(null);
        });

      // Act
      const chain = await service.buildCausalChain(snapshotC.id);

      // Assert
      expect(chain).toHaveLength(3);
      expect(chain[0].snapshot.id).toBe(snapshotA.id); // Root
      expect(chain[1].snapshot.id).toBe(snapshotB.id);
      expect(chain[2].snapshot.id).toBe(snapshotC.id); // Target
      expect(chain[0].depth).toBe(0);
      expect(chain[1].depth).toBe(1);
      expect(chain[2].depth).toBe(2);
    });

    it('should handle single node (no parent)', async () => {
      // Arrange
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Standalone context',
        tags: 'solo',
        causality: {
          actionType: 'conversation',
          rationale: 'Independent action',
          dependencies: [],
          causedBy: null,
        },
      });

      mockRepo.findById = vi.fn().mockResolvedValue(snapshot);

      // Act
      const chain = await service.buildCausalChain(snapshot.id);

      // Assert
      expect(chain).toHaveLength(1);
      expect(chain[0].snapshot.id).toBe(snapshot.id);
      expect(chain[0].depth).toBe(0);
      expect(chain[0].causedBy).toBeNull();
    });

    it('should link parent-child relationships correctly', async () => {
      // Arrange: A → B
      const snapshotA = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Parent',
        tags: 'parent',
        causality: {
          actionType: 'research',
          rationale: 'Root cause',
          dependencies: [],
          causedBy: null,
        },
      });

      const snapshotB = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Child',
        tags: 'child',
        causality: {
          actionType: 'decision',
          rationale: 'Based on research',
          dependencies: [snapshotA.id],
          causedBy: snapshotA.id,
        },
      });

      mockRepo.findById = vi.fn()
        .mockImplementation((id: string) => {
          if (id === snapshotB.id) return Promise.resolve(snapshotB);
          if (id === snapshotA.id) return Promise.resolve(snapshotA);
          return Promise.resolve(null);
        });

      // Act
      const chain = await service.buildCausalChain(snapshotB.id);

      // Assert
      expect(chain[1].causedBy).toBe(chain[0]);
      expect(chain[0].children).toContain(chain[1]);
    });
  });

  describe('detectDependencies()', () => {
    it('should find recent contexts within time window', async () => {
      // Arrange
      const recentSnapshots = [
        ContextSnapshot.create({ project: 'test-project', summary: 'Recent 1', tags: 'test' }),
        ContextSnapshot.create({ project: 'test-project', summary: 'Recent 2', tags: 'test' }),
        ContextSnapshot.create({ project: 'test-project', summary: 'Recent 3', tags: 'test' }),
      ];

      mockRepo.findRecent = vi.fn().mockResolvedValue(recentSnapshots);

      // Act
      const result = await service.detectDependencies('test-project', new Date(), 1);

      // Assert
      expect(result.snapshots).toHaveLength(3);
      expect(result.reason).toContain('Found 3 context(s)');
      expect(result.reason).toContain('last 1 hour(s)');
    });

    it('should limit to 5 most recent dependencies', async () => {
      // Arrange
      const manySnapshots = Array.from({ length: 10 }, (_, i) =>
        ContextSnapshot.create({
          project: 'test-project',
          summary: `Context ${i}`,
          tags: 'test',
        })
      );

      mockRepo.findRecent = vi.fn().mockResolvedValue(manySnapshots);

      // Act
      const result = await service.detectDependencies('test-project');

      // Assert
      expect(result.snapshots).toHaveLength(5); // Limited to 5
    });

    it('should return empty when no recent contexts', async () => {
      // Arrange
      mockRepo.findRecent = vi.fn().mockResolvedValue([]);

      // Act
      const result = await service.detectDependencies('empty-project');

      // Assert
      expect(result.snapshots).toHaveLength(0);
      expect(result.reason).toContain('No recent contexts found');
    });

    it('should use custom hoursBack parameter', async () => {
      // Arrange
      mockRepo.findRecent = vi.fn().mockResolvedValue([]);

      // Act
      await service.detectDependencies('test-project', new Date(), 24);

      // Assert
      expect(mockRepo.findRecent).toHaveBeenCalledWith(
        'test-project',
        expect.any(String),
        24
      );
    });
  });

  describe('validateCausalChain()', () => {
    it('should validate correct chain with increasing timestamps', async () => {
      // Arrange
      const now = new Date('2025-10-16T12:00:00Z');
      const earlier = new Date('2025-10-16T11:00:00Z');

      const snapshotA = new ContextSnapshot(
        'id-a',
        'test-project',
        'Earlier',
        'mcp',
        null,
        'test',
        earlier.toISOString(),
        { actionType: 'research', rationale: 'Start', dependencies: [], causedBy: null },
        MemoryTier.ACTIVE,
        null,
                  0,
        null
      );

      const snapshotB = new ContextSnapshot(
        'id-b',
        'test-project',
        'Later',
        'mcp',
        null,
        'test',
        now.toISOString(),
        { actionType: 'decision', rationale: 'Follow-up', dependencies: [], causedBy: 'id-a' },
        MemoryTier.ACTIVE,
        null,
                  0,
        null
      );

      mockRepo.findById = vi.fn()
        .mockImplementation((id: string) => {
          if (id === 'id-b') return Promise.resolve(snapshotB);
          if (id === 'id-a') return Promise.resolve(snapshotA);
          return Promise.resolve(null);
        });

      // Act
      const valid = await service.validateCausalChain('id-b');

      // Assert
      expect(valid).toBe(true);
    });

    it('should detect invalid chain with decreasing timestamps', async () => {
      // Arrange
      const now = new Date('2025-10-16T12:00:00Z');
      const later = new Date('2025-10-16T13:00:00Z');

      const snapshotA = new ContextSnapshot(
        'id-a',
        'test-project',
        'Later timestamp',
        'mcp',
        null,
        'test',
        later.toISOString(),
        { actionType: 'research', rationale: 'Start', dependencies: [], causedBy: null },
        MemoryTier.ACTIVE,
        null,
                  0,
        null
      );

      const snapshotB = new ContextSnapshot(
        'id-b',
        'test-project',
        'Earlier timestamp',
        'mcp',
        null,
        'test',
        now.toISOString(),
        { actionType: 'decision', rationale: 'Follow-up', dependencies: [], causedBy: 'id-a' },
        MemoryTier.ACTIVE,
        null,
                  0,
        null
      );

      mockRepo.findById = vi.fn()
        .mockImplementation((id: string) => {
          if (id === 'id-b') return Promise.resolve(snapshotB);
          if (id === 'id-a') return Promise.resolve(snapshotA);
          return Promise.resolve(null);
        });

      // Act
      const valid = await service.validateCausalChain('id-b');

      // Assert
      expect(valid).toBe(false);
    });

    it('should return false for nonexistent snapshot', async () => {
      // Arrange
      mockRepo.findById = vi.fn().mockResolvedValue(null);

      // Act
      const valid = await service.validateCausalChain('nonexistent');

      // Assert
      expect(valid).toBe(false);
    });
  });

  describe('getDownstreamDependents()', () => {
    it('should return direct children of a snapshot', async () => {
      const root = ContextSnapshot.create({ project: 'p', summary: 'Root', tags: 't' });
      const childA = ContextSnapshot.create({ project: 'p', summary: 'Child A', tags: 't',
        causality: { actionType: 'decision', rationale: 'r', dependencies: [], causedBy: root.id } });
      const childB = ContextSnapshot.create({ project: 'q', summary: 'Child B', tags: 't',
        causality: { actionType: 'file_edit', rationale: 'r', dependencies: [], causedBy: root.id } });

      mockRepo.findDependents = vi.fn()
        .mockImplementation((id: string) => {
          if (id === root.id) return Promise.resolve([childA, childB]);
          return Promise.resolve([]);
        });

      const result = await service.getDownstreamDependents(root.id);

      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toContain(childA.id);
      expect(result.map(s => s.id)).toContain(childB.id);
    });

    it('should recursively traverse grandchildren', async () => {
      const root = ContextSnapshot.create({ project: 'p', summary: 'Root', tags: 't' });
      const child = ContextSnapshot.create({ project: 'p', summary: 'Child', tags: 't',
        causality: { actionType: 'decision', rationale: 'r', dependencies: [], causedBy: root.id } });
      const grandchild = ContextSnapshot.create({ project: 'p', summary: 'Grandchild', tags: 't',
        causality: { actionType: 'file_edit', rationale: 'r', dependencies: [], causedBy: child.id } });

      mockRepo.findDependents = vi.fn()
        .mockImplementation((id: string) => {
          if (id === root.id) return Promise.resolve([child]);
          if (id === child.id) return Promise.resolve([grandchild]);
          return Promise.resolve([]);
        });

      const result = await service.getDownstreamDependents(root.id);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(child.id);
      expect(result[1].id).toBe(grandchild.id);
    });

    it('should return empty array when snapshot has no dependents', async () => {
      const snapshot = ContextSnapshot.create({ project: 'p', summary: 'Leaf', tags: 't' });
      mockRepo.findDependents = vi.fn().mockResolvedValue([]);

      const result = await service.getDownstreamDependents(snapshot.id);

      expect(result).toHaveLength(0);
    });

    it('should not revisit already-seen nodes (cycle guard)', async () => {
      const a = ContextSnapshot.create({ project: 'p', summary: 'A', tags: 't' });
      const b = ContextSnapshot.create({ project: 'p', summary: 'B', tags: 't' });

      mockRepo.findDependents = vi.fn()
        .mockImplementation((id: string) => {
          if (id === a.id) return Promise.resolve([b]);
          if (id === b.id) return Promise.resolve([a]); // cycle: B → A
          return Promise.resolve([]);
        });

      const result = await service.getDownstreamDependents(a.id);

      // Should find B but not loop back to A (already visited as root)
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(b.id);
    });

    it('should traverse cross-project dependents', async () => {
      const root = ContextSnapshot.create({ project: 'project-a', summary: 'Root in A', tags: 't' });
      const crossChild = ContextSnapshot.create({ project: 'project-b', summary: 'Child in B', tags: 't',
        causality: { actionType: 'decision', rationale: 'cross-project', dependencies: [], causedBy: root.id } });

      mockRepo.findDependents = vi.fn()
        .mockImplementation((id: string) => {
          if (id === root.id) return Promise.resolve([crossChild]);
          return Promise.resolve([]);
        });

      const result = await service.getDownstreamDependents(root.id);

      expect(result).toHaveLength(1);
      expect(result[0].project).toBe('project-b');
    });
  });

  describe('getCausalityStats()', () => {
    it('should calculate statistics for project', async () => {
      // Arrange
      const snapshots = [
        ContextSnapshot.create({
          project: 'test-project',
          summary: 'Context 1',
          tags: 'test',
          causality: {
            actionType: 'conversation',
            rationale: 'Talk',
            dependencies: [],
            causedBy: null,
          },
        }),
        ContextSnapshot.create({
          project: 'test-project',
          summary: 'Context 2',
          tags: 'test',
          causality: {
            actionType: 'decision',
            rationale: 'Decide',
            dependencies: [],
            causedBy: null,
          },
        }),
        ContextSnapshot.create({
          project: 'test-project',
          summary: 'Context 3',
          tags: 'test',
        }), // No causality
      ];

      mockRepo.findByProject = vi.fn().mockResolvedValue(snapshots);
      mockRepo.findById = vi.fn()
        .mockImplementation((id: string) => {
          const found = snapshots.find(s => s.id === id);
          return Promise.resolve(found || null);
        });

      // Act
      const stats = await service.getCausalityStats('test-project');

      // Assert
      expect(stats.totalWithCausality).toBe(2);
      expect(stats.actionTypeCounts.conversation).toBe(1);
      expect(stats.actionTypeCounts.decision).toBe(1);
      expect(stats.rootCauses).toBe(2); // Both have no causedBy
      expect(stats.averageChainLength).toBeGreaterThan(0);
    });

    it('should handle project with no causality', async () => {
      // Arrange
      const snapshots = [
        ContextSnapshot.create({ project: 'test-project', summary: 'Old 1', tags: 'test' }),
        ContextSnapshot.create({ project: 'test-project', summary: 'Old 2', tags: 'test' }),
      ];

      mockRepo.findByProject = vi.fn().mockResolvedValue(snapshots);

      // Act
      const stats = await service.getCausalityStats('test-project');

      // Assert
      expect(stats.totalWithCausality).toBe(0);
      expect(stats.rootCauses).toBe(0);
      expect(stats.averageChainLength).toBe(0);
    });
  });
});
