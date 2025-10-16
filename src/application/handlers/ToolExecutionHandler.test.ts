/**
 * 🎯 SEMANTIC INTENT: Unit tests for ToolExecutionHandler
 *
 * PURPOSE: Verify MCP tool orchestration and result formatting
 *
 * TEST STRATEGY:
 * - Mock domain service (ContextService)
 * - Test tool dispatching
 * - Verify result formatting for MCP protocol
 * - Test error handling for unknown tools
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolExecutionHandler } from './ToolExecutionHandler';
import type { ContextService } from '../../domain/services/ContextService';
import { ContextSnapshot } from '../../domain/models/ContextSnapshot';
import type { SaveContextInput, LoadContextInput, SearchContextInput } from '../../types';

// Mock ContextService
class MockContextService {
  saveContext = vi.fn();
  loadContext = vi.fn();
  searchContext = vi.fn();
}

describe('ToolExecutionHandler', () => {
  let handler: ToolExecutionHandler;
  let mockService: MockContextService;

  beforeEach(() => {
    mockService = new MockContextService();
    handler = new ToolExecutionHandler(mockService as unknown as ContextService);
  });

  describe('execute()', () => {
    it('should route save_context to handleSaveContext', async () => {
      // Arrange
      const input: SaveContextInput = {
        project: 'test-project',
        content: 'Test content',
      };

      const mockSnapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'Test summary',
        tags: 'tag1,tag2',
      });

      mockService.saveContext.mockResolvedValue(mockSnapshot);

      // Act
      const result = await handler.execute('save_context', input);

      // Assert
      expect(mockService.saveContext).toHaveBeenCalledWith(input);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Context saved!');
      expect(result.content[0].text).toContain(mockSnapshot.id);
      expect(result.content[0].text).toContain('Test summary');
      expect(result.content[0].text).toContain('tag1,tag2');
    });

    it('should route load_context to handleLoadContext', async () => {
      // Arrange
      const input: LoadContextInput = {
        project: 'test-project',
        limit: 5,
      };

      const mockSnapshots = [
        ContextSnapshot.create({
          project: 'test-project',
          summary: 'Summary 1',
          tags: 'tag1',
        }),
      ];

      mockService.loadContext.mockResolvedValue(mockSnapshots);

      // Act
      const result = await handler.execute('load_context', input);

      // Assert
      expect(mockService.loadContext).toHaveBeenCalledWith(input);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Found 1 context(s)');
    });

    it('should route search_context to handleSearchContext', async () => {
      // Arrange
      const input: SearchContextInput = {
        query: 'search term',
      };

      const mockSnapshots = [
        ContextSnapshot.create({
          project: 'project-1',
          summary: 'Summary with search term',
          tags: 'tag1',
        }),
      ];

      mockService.searchContext.mockResolvedValue(mockSnapshots);

      // Act
      const result = await handler.execute('search_context', input);

      // Assert
      expect(mockService.searchContext).toHaveBeenCalledWith(input);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Found 1 context(s)');
    });

    it('should throw error for unknown tool', async () => {
      // Act & Assert
      await expect(
        handler.execute('unknown_tool', {})
      ).rejects.toThrow('Unknown tool: unknown_tool');
    });
  });

  describe('handleSaveContext()', () => {
    it('should format success message with snapshot details', async () => {
      // Arrange
      const input: SaveContextInput = {
        project: 'test-project',
        content: 'Test content',
      };

      const mockSnapshot = ContextSnapshot.create({
        project: 'test-project',
        summary: 'AI-generated summary',
        tags: 'ai,test,context',
      });

      mockService.saveContext.mockResolvedValue(mockSnapshot);

      // Act
      const result = await handler.execute('save_context', input);

      // Assert
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Context saved!');
      expect(result.content[0].text).toContain(`ID: ${mockSnapshot.id}`);
      expect(result.content[0].text).toContain('Summary: AI-generated summary');
      expect(result.content[0].text).toContain('Tags: ai,test,context');
    });
  });

  describe('handleLoadContext()', () => {
    it('should format multiple contexts as markdown list', async () => {
      // Arrange
      const input: LoadContextInput = {
        project: 'test-project',
        limit: 2,
      };

      const mockSnapshots = [
        new ContextSnapshot(
          'id-1',
          'test-project',
          'Summary 1',
          'mcp',
          null,
          'tag1',
          '2025-10-06T12:00:00.000Z',
          null // causality
        ),
        new ContextSnapshot(
          'id-2',
          'test-project',
          'Summary 2',
          'mcp',
          null,
          'tag2',
          '2025-10-06T11:00:00.000Z',
          null // causality
        ),
      ];

      mockService.loadContext.mockResolvedValue(mockSnapshots);

      // Act
      const result = await handler.execute('load_context', input);

      // Assert
      expect(result.content[0].text).toContain('Found 2 context(s)');
      expect(result.content[0].text).toContain('**test-project**');
      expect(result.content[0].text).toContain('Summary 1');
      expect(result.content[0].text).toContain('Summary 2');
      expect(result.content[0].text).toContain('Tags: tag1');
      expect(result.content[0].text).toContain('Tags: tag2');
    });

    it('should handle empty results gracefully', async () => {
      // Arrange
      const input: LoadContextInput = {
        project: 'nonexistent-project',
        limit: 5,
      };

      mockService.loadContext.mockResolvedValue([]);

      // Act
      const result = await handler.execute('load_context', input);

      // Assert
      expect(result.content[0].text).toBe('No context found for project: nonexistent-project');
    });
  });

  describe('handleSearchContext()', () => {
    it('should format search results with query', async () => {
      // Arrange
      const input: SearchContextInput = {
        query: 'important feature',
      };

      const mockSnapshots = [
        new ContextSnapshot(
          'id-1',
          'project-a',
          'Summary about important feature',
          'mcp',
          null,
          'feature,important',
          '2025-10-06T12:00:00.000Z',
          null // causality
        ),
      ];

      mockService.searchContext.mockResolvedValue(mockSnapshots);

      // Act
      const result = await handler.execute('search_context', input);

      // Assert
      expect(result.content[0].text).toContain('Found 1 context(s) for "important feature"');
      expect(result.content[0].text).toContain('**project-a**');
      expect(result.content[0].text).toContain('Summary about important feature');
      expect(result.content[0].text).toContain('Tags: feature,important');
    });

    it('should handle no search results', async () => {
      // Arrange
      const input: SearchContextInput = {
        query: 'nonexistent term',
      };

      mockService.searchContext.mockResolvedValue([]);

      // Act
      const result = await handler.execute('search_context', input);

      // Assert
      expect(result.content[0].text).toBe('No contexts found matching: "nonexistent term"');
    });

    it('should support project-scoped search', async () => {
      // Arrange
      const input: SearchContextInput = {
        query: 'feature',
        project: 'specific-project',
      };

      mockService.searchContext.mockResolvedValue([]);

      // Act
      await handler.execute('search_context', input);

      // Assert
      expect(mockService.searchContext).toHaveBeenCalledWith(input);
    });
  });
});
