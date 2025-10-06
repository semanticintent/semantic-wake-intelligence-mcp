/**
 * 🎯 SEMANTIC INTENT: Cloudflare AI Adapter for Semantic Enhancement
 *
 * PURPOSE: Implement IAIProvider using Cloudflare Workers AI
 *
 * HEXAGONAL ARCHITECTURE:
 * - This is an ADAPTER (infrastructure implementation)
 * - Implements PORT (IAIProvider interface)
 * - Can be swapped with OpenAIProvider, AnthropicProvider, etc.
 *
 * INFRASTRUCTURE RESPONSIBILITY:
 * - WHERE: Cloudflare Workers AI binding
 * - HOW: LLaMA 4 Scout model inference
 * - PRESERVES: Semantic meaning through AI transformation
 *
 * SEMANTIC ANCHORING:
 * - Transforms verbose → semantic essence
 * - Extracts meaning, not just keywords
 * - Graceful degradation if AI unavailable
 */

import type { IAIProvider } from '../../application/ports/IAIProvider';

/**
 * Cloudflare AI implementation of semantic enhancement.
 *
 * TECHNICAL DETAILS:
 * - Model: @cf/meta/llama-4-scout-17b-16e-instruct
 * - Fallback: Truncation if AI unavailable
 * - Error handling: Logs but doesn't fail
 */
export class CloudflareAIProvider implements IAIProvider {
  constructor(private readonly ai: Ai) {}

  /**
   * 🎯 SEMANTIC INTENT: Compress content to semantic essence
   *
   * TECHNICAL IMPLEMENTATION:
   * - Uses LLaMA 4 Scout for summarization
   * - Falls back to truncation if AI fails
   * - Preserves semantic meaning over length
   */
  async generateSummary(content: string): Promise<string> {
    try {
      if (this.ai) {
        const response = await this.ai.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
          messages: [{
            role: 'user',
            content: `Summarize in 2-3 sentences: ${content}`
          }]
        });

        // Return AI summary or fallback
        return response.response || this.truncateFallback(content);
      }
    } catch (error) {
      console.error('AI summary generation failed:', error);
    }

    // Fallback: Structural truncation
    return this.truncateFallback(content);
  }

  /**
   * 🎯 SEMANTIC INTENT: Extract categorization markers
   *
   * TECHNICAL IMPLEMENTATION:
   * - Uses LLaMA 4 Scout for theme extraction
   * - Returns comma-separated tags
   * - Falls back to generic tag if AI fails
   */
  async generateTags(content: string): Promise<string> {
    try {
      if (this.ai) {
        const response = await this.ai.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
          messages: [{
            role: 'user',
            content: `Generate 3-5 relevant tags (comma-separated): ${content}`
          }]
        });

        return response.response || 'auto-generated';
      }
    } catch (error) {
      console.error('AI tag generation failed:', error);
    }

    return 'auto-generated';
  }

  /**
   * Fallback truncation when AI unavailable.
   * Preserves beginning (most important semantic content).
   */
  private truncateFallback(content: string): string {
    return content.slice(0, 200) + '...';
  }
}
