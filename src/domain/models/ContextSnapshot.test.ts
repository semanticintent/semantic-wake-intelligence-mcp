/**
 * 🎯 SEMANTIC INTENT: Unit tests for ContextSnapshot domain entity
 *
 * PURPOSE: Verify business rules and semantic invariants
 *
 * TEST STRATEGY:
 * - Test validation rules (semantic integrity)
 * - Test factory methods (creation semantics)
 * - Test immutability (prevent semantic violations)
 * - Test memory tier calculation (Layer 2: Present)
 * - Test LRU tracking (Layer 2: Present)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContextSnapshot } from './ContextSnapshot';
import { MemoryTier } from '../../types';

describe('ContextSnapshot Domain Entity', () => {
  describe('Validation Rules', () => {
    it('should throw error when project is empty', () => {
      expect(() => {
        new ContextSnapshot(
          'test-id',
          '', // Empty project
          'Test summary',
          'mcp',
          null,
          'tag1,tag2',
          new Date().toISOString(),
          null, // causality
          MemoryTier.ACTIVE, // memoryTier
          null, // lastAccessed
          0, // accessCount
          null // propagation
        );
      }).toThrow('Semantic violation: Project is required (domain anchor missing)');
    });

    it('should throw error when project is only whitespace', () => {
      expect(() => {
        new ContextSnapshot(
          'test-id',
          '   ', // Whitespace only
          'Test summary',
          'mcp',
          null,
          'tag1,tag2',
          new Date().toISOString(),
          null, // causality
          MemoryTier.ACTIVE,
          null,
                    0,
          null
        );
      }).toThrow('Semantic violation: Project is required (domain anchor missing)');
    });

    it('should throw error when summary is empty', () => {
      expect(() => {
        new ContextSnapshot(
          'test-id',
          'test-project',
          '', // Empty summary
          'mcp',
          null,
          'tag1,tag2',
          new Date().toISOString(),
          null, // causality
          MemoryTier.ACTIVE,
          null,
                    0,
          null
        );
      }).toThrow('Semantic violation: Summary is required (semantic essence missing)');
    });

    it('should throw error when summary is only whitespace', () => {
      expect(() => {
        new ContextSnapshot(
          'test-id',
          'test-project',
          '   ', // Whitespace only
          'mcp',
          null,
          'tag1,tag2',
          new Date().toISOString(),
          null, // causality
          MemoryTier.ACTIVE,
          null,
                    0,
          null
        );
      }).toThrow('Semantic violation: Summary is required (semantic essence missing)');
    });

    it('should create valid snapshot with required fields', () => {
      const snapshot = new ContextSnapshot(
        'test-id',
        'test-project',
        'Test summary',
        'mcp',
        null,
        'tag1,tag2',
        new Date().toISOString(),
        null, // causality
        MemoryTier.ACTIVE,
        null,
                  0,
        null
      );

      expect(snapshot.id).toBe('test-id');
      expect(snapshot.project).toBe('test-project');
      expect(snapshot.summary).toBe('Test summary');
      expect(snapshot.memoryTier).toBe(MemoryTier.ACTIVE);
      expect(snapshot.lastAccessed).toBeNull();
      expect(snapshot.accessCount).toBe(0);
    });
  });

  describe('Factory Method: create()', () => {
    it('should generate unique ID', () => {
      const snapshot1 = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      const snapshot2 = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      expect(snapshot1.id).toBeDefined();
      expect(snapshot2.id).toBeDefined();
      expect(snapshot1.id).not.toBe(snapshot2.id);
    });

    it('should auto-generate timestamp', () => {
      const beforeCreate = new Date();
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });
      const afterCreate = new Date();

      const timestamp = new Date(snapshot.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should use default source when not provided', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      expect(snapshot.source).toBe('mcp');
    });

    it('should use custom source when provided', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        source: 'custom-source',
        tags: 'tag1',
      });

      expect(snapshot.source).toBe('custom-source');
    });

    it('should serialize metadata to JSON', () => {
      const metadata = { key1: 'value1', key2: 42 };
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        metadata,
        tags: 'tag1',
      });

      expect(snapshot.metadata).toBe(JSON.stringify(metadata));
    });

    it('should handle null metadata', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      expect(snapshot.metadata).toBeNull();
    });

    it('should include tags', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1,tag2,tag3',
      });

      expect(snapshot.tags).toBe('tag1,tag2,tag3');
    });

    it('should initialize memory tier as ACTIVE for new snapshots', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      expect(snapshot.memoryTier).toBe(MemoryTier.ACTIVE);
    });

    it('should initialize lastAccessed as null', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      expect(snapshot.lastAccessed).toBeNull();
    });

    it('should initialize accessCount as 0', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      expect(snapshot.accessCount).toBe(0);
    });
  });

  describe('Factory Method: fromDatabase()', () => {
    it('should reconstitute snapshot from database data', () => {
      const dbData = {
        id: 'db-id-123',
        project: 'db-project',
        summary: 'DB summary',
        source: 'database',
        metadata: '{"db":"true"}',
        tags: 'db,tags',
        timestamp: '2025-10-06T12:00:00.000Z',
        causality: null,
        memoryTier: MemoryTier.ARCHIVED,
        lastAccessed: '2025-10-10T12:00:00.000Z',
        accessCount: 5,
        propagation: null,
      };

      const snapshot = ContextSnapshot.fromDatabase(dbData);

      expect(snapshot.id).toBe(dbData.id);
      expect(snapshot.project).toBe(dbData.project);
      expect(snapshot.summary).toBe(dbData.summary);
      expect(snapshot.source).toBe(dbData.source);
      expect(snapshot.metadata).toBe(dbData.metadata);
      expect(snapshot.tags).toBe(dbData.tags);
      expect(snapshot.timestamp).toBe(dbData.timestamp);
      expect(snapshot.causality).toBeNull();
      expect(snapshot.memoryTier).toBe(MemoryTier.ARCHIVED);
      expect(snapshot.lastAccessed).toBe('2025-10-10T12:00:00.000Z');
      expect(snapshot.accessCount).toBe(5);
    });

    it('should handle null metadata from database', () => {
      const dbData = {
        id: 'db-id-123',
        project: 'db-project',
        summary: 'DB summary',
        source: 'database',
        metadata: null,
        tags: 'db,tags',
        timestamp: '2025-10-06T12:00:00.000Z',
        causality: null,
        memoryTier: MemoryTier.RECENT,
        lastAccessed: null,
        accessCount: 0,
        propagation: null,
      };

      const snapshot = ContextSnapshot.fromDatabase(dbData);

      expect(snapshot.metadata).toBeNull();
      expect(snapshot.causality).toBeNull();
      expect(snapshot.lastAccessed).toBeNull();
    });
  });

  describe('Memory Tier Calculation (Layer 2)', () => {
    it('should classify as ACTIVE for timestamps < 1 hour old', () => {
      const timestamp = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes ago
      const tier = ContextSnapshot.calculateMemoryTier(timestamp);
      expect(tier).toBe(MemoryTier.ACTIVE);
    });

    it('should classify as RECENT for timestamps 1-24 hours old', () => {
      const timestamp = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(); // 5 hours ago
      const tier = ContextSnapshot.calculateMemoryTier(timestamp);
      expect(tier).toBe(MemoryTier.RECENT);
    });

    it('should classify as ARCHIVED for timestamps 1-30 days old', () => {
      const timestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
      const tier = ContextSnapshot.calculateMemoryTier(timestamp);
      expect(tier).toBe(MemoryTier.ARCHIVED);
    });

    it('should classify as EXPIRED for timestamps > 30 days old', () => {
      const timestamp = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago
      const tier = ContextSnapshot.calculateMemoryTier(timestamp);
      expect(tier).toBe(MemoryTier.EXPIRED);
    });

    it('should handle boundary at 1 hour (RECENT)', () => {
      const timestamp = new Date(Date.now() - 61 * 60 * 1000).toISOString(); // 61 minutes ago
      const tier = ContextSnapshot.calculateMemoryTier(timestamp);
      expect(tier).toBe(MemoryTier.RECENT);
    });

    it('should handle boundary at 24 hours (ARCHIVED)', () => {
      const timestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
      const tier = ContextSnapshot.calculateMemoryTier(timestamp);
      expect(tier).toBe(MemoryTier.ARCHIVED);
    });

    it('should handle boundary at 30 days (EXPIRED)', () => {
      const timestamp = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(); // 31 days ago
      const tier = ContextSnapshot.calculateMemoryTier(timestamp);
      expect(tier).toBe(MemoryTier.EXPIRED);
    });
  });

  describe('LRU Tracking: markAccessed() (Layer 2)', () => {
    it('should update lastAccessed timestamp', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      const beforeAccess = Date.now();
      const accessed = snapshot.markAccessed();
      const afterAccess = Date.now();

      expect(accessed.lastAccessed).not.toBeNull();
      const accessedTime = new Date(accessed.lastAccessed!).getTime();
      expect(accessedTime).toBeGreaterThanOrEqual(beforeAccess);
      expect(accessedTime).toBeLessThanOrEqual(afterAccess);
    });

    it('should increment accessCount', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      expect(snapshot.accessCount).toBe(0);

      const accessed1 = snapshot.markAccessed();
      expect(accessed1.accessCount).toBe(1);

      const accessed2 = accessed1.markAccessed();
      expect(accessed2.accessCount).toBe(2);

      const accessed3 = accessed2.markAccessed();
      expect(accessed3.accessCount).toBe(3);
    });

    it('should preserve all other fields', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1,tag2',
      });

      const accessed = snapshot.markAccessed();

      expect(accessed.id).toBe(snapshot.id);
      expect(accessed.project).toBe(snapshot.project);
      expect(accessed.summary).toBe(snapshot.summary);
      expect(accessed.source).toBe(snapshot.source);
      expect(accessed.metadata).toBe(snapshot.metadata);
      expect(accessed.tags).toBe(snapshot.tags);
      expect(accessed.timestamp).toBe(snapshot.timestamp);
      expect(accessed.causality).toBe(snapshot.causality);
      expect(accessed.memoryTier).toBe(snapshot.memoryTier);
    });

    it('should return new instance (immutability)', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      const accessed = snapshot.markAccessed();

      // Different instances
      expect(accessed).not.toBe(snapshot);

      // Original unchanged
      expect(snapshot.accessCount).toBe(0);
      expect(snapshot.lastAccessed).toBeNull();

      // New instance updated
      expect(accessed.accessCount).toBe(1);
      expect(accessed.lastAccessed).not.toBeNull();
    });
  });

  describe('Immutability', () => {
    it('should have readonly properties (enforced by TypeScript)', () => {
      const snapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1',
      });

      // TypeScript enforces readonly at compile time
      // Properties are immutable through type system
      expect(snapshot.project).toBe('test-project');
      expect(snapshot.summary).toBe('Test summary');
      expect(snapshot.id).toBeDefined();
    });
  });
});
