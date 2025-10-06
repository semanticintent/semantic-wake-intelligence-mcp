/**
 * 🎯 SEMANTIC INTENT: Unit tests for CloudflareAIProvider adapter
 *
 * PURPOSE: Verify AI enhancement implementation and fallback behavior
 *
 * TEST STRATEGY:
 * - Mock Cloudflare AI binding
 * - Test successful AI responses
 * - Test graceful degradation (fallbacks)
 * - Test error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudflareAIProvider } from './CloudflareAIProvider';

// Mock Ai interface
class MockAi {
  run = vi.fn();
}

describe('CloudflareAIProvider', () => {
  let provider: CloudflareAIProvider;
  let mockAi: MockAi;

  beforeEach(() => {
    mockAi = new MockAi();
    provider = new CloudflareAIProvider(mockAi as unknown as Ai);
  });

  describe('generateSummary()', () => {
    it('should generate summary using AI model', async () => {
      // Arrange
      const content = 'Long content that needs to be summarized for semantic preservation';
      mockAi.run.mockResolvedValue({
        response: 'AI-generated summary of the content'
      });

      // Act
      const result = await provider.generateSummary(content);

      // Assert
      expect(mockAi.run).toHaveBeenCalledWith(
        '@cf/meta/llama-4-scout-17b-16e-instruct',
        {
          messages: [{
            role: 'user',
            content: `Summarize in 2-3 sentences: ${content}`
          }]
        }
      );
      expect(result).toBe('AI-generated summary of the content');
    });

    it('should use fallback truncation when AI returns empty response', async () => {
      // Arrange
      const content = 'A'.repeat(300); // Long content
      mockAi.run.mockResolvedValue({
        response: '' // Empty response
      });

      // Act
      const result = await provider.generateSummary(content);

      // Assert
      expect(result).toBe('A'.repeat(200) + '...');
    });

    it('should use fallback truncation when AI throws error', async () => {
      // Arrange
      const content = 'Content that causes AI error';
      mockAi.run.mockRejectedValue(new Error('AI service unavailable'));

      // Act
      const result = await provider.generateSummary(content);

      // Assert
      expect(result).toContain('Content that causes AI error');
      expect(result).toBe('Content that causes AI error...'); // Content shorter than 200 chars
    });

    it('should truncate at 200 characters in fallback', async () => {
      // Arrange
      const content = 'X'.repeat(500);
      mockAi.run.mockRejectedValue(new Error('AI error'));

      // Act
      const result = await provider.generateSummary(content);

      // Assert
      expect(result).toBe('X'.repeat(200) + '...');
    });

    it('should handle content shorter than 200 characters', async () => {
      // Arrange
      const content = 'Short content';
      mockAi.run.mockRejectedValue(new Error('AI error'));

      // Act
      const result = await provider.generateSummary(content);

      // Assert
      expect(result).toBe('Short content...');
    });
  });

  describe('generateTags()', () => {
    it('should generate tags using AI model', async () => {
      // Arrange
      const content = 'Summary about user authentication and security features';
      mockAi.run.mockResolvedValue({
        response: 'authentication,security,features,user-management'
      });

      // Act
      const result = await provider.generateTags(content);

      // Assert
      expect(mockAi.run).toHaveBeenCalledWith(
        '@cf/meta/llama-4-scout-17b-16e-instruct',
        {
          messages: [{
            role: 'user',
            content: `Generate 3-5 relevant tags (comma-separated): ${content}`
          }]
        }
      );
      expect(result).toBe('authentication,security,features,user-management');
    });

    it('should use fallback when AI returns empty response', async () => {
      // Arrange
      const content = 'Some content';
      mockAi.run.mockResolvedValue({
        response: '' // Empty response
      });

      // Act
      const result = await provider.generateTags(content);

      // Assert
      expect(result).toBe('auto-generated');
    });

    it('should use fallback when AI throws error', async () => {
      // Arrange
      const content = 'Content that causes AI error';
      mockAi.run.mockRejectedValue(new Error('AI service down'));

      // Act
      const result = await provider.generateTags(content);

      // Assert
      expect(result).toBe('auto-generated');
    });

    it('should log error when AI fails but continue with fallback', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const content = 'Test content';
      const error = new Error('AI timeout');
      mockAi.run.mockRejectedValue(error);

      // Act
      await provider.generateTags(content);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('AI tag generation failed:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Graceful Degradation', () => {
    it('should never throw errors - always return fallback', async () => {
      // Arrange
      mockAi.run.mockRejectedValue(new Error('Critical AI failure'));

      // Act & Assert - Should not throw
      const summary = await provider.generateSummary('Test');
      const tags = await provider.generateTags('Test');

      expect(summary).toBeDefined();
      expect(tags).toBe('auto-generated');
    });

    it('should handle null AI binding gracefully', async () => {
      // Arrange
      const providerWithoutAi = new CloudflareAIProvider(null as unknown as Ai);

      // Act
      const summary = await providerWithoutAi.generateSummary('Test content');
      const tags = await providerWithoutAi.generateTags('Test content');

      // Assert
      expect(summary).toBe('Test content...');
      expect(tags).toBe('auto-generated');
    });
  });
});
