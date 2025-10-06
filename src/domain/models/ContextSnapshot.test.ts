/**
 * 🎯 SEMANTIC INTENT: Unit tests for ContextSnapshot domain entity
 *
 * PURPOSE: Verify business rules and semantic invariants
 *
 * TEST STRATEGY:
 * - Test validation rules (semantic integrity)
 * - Test factory methods (creation semantics)
 * - Test immutability (prevent semantic violations)
 */

import { describe, it, expect } from 'vitest';
import { ContextSnapshot } from './ContextSnapshot';

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
          new Date().toISOString()
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
          new Date().toISOString()
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
          new Date().toISOString()
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
          new Date().toISOString()
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
        new Date().toISOString()
      );

      expect(snapshot.id).toBe('test-id');
      expect(snapshot.project).toBe('test-project');
      expect(snapshot.summary).toBe('Test summary');
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
      };

      const snapshot = ContextSnapshot.fromDatabase(dbData);

      expect(snapshot.id).toBe(dbData.id);
      expect(snapshot.project).toBe(dbData.project);
      expect(snapshot.summary).toBe(dbData.summary);
      expect(snapshot.source).toBe(dbData.source);
      expect(snapshot.metadata).toBe(dbData.metadata);
      expect(snapshot.tags).toBe(dbData.tags);
      expect(snapshot.timestamp).toBe(dbData.timestamp);
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
      };

      const snapshot = ContextSnapshot.fromDatabase(dbData);

      expect(snapshot.metadata).toBeNull();
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
