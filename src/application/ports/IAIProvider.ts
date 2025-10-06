/**
 * 🎯 SEMANTIC INTENT: AI Provider Port (Interface)
 *
 * PURPOSE: Define semantic contract for AI enhancement services
 *
 * HEXAGONAL ARCHITECTURE:
 * - This is a PORT (interface) for AI capabilities
 * - Domain services depend on this abstraction
 * - Infrastructure adapters (Cloudflare AI, OpenAI, etc.) implement this
 *
 * SEMANTIC ANCHORING:
 * - Contract expresses semantic transformations needed
 * - No mention of specific AI models or providers
 * - Focus on MEANING preservation, not technical implementation
 *
 * INTENT PRESERVATION:
 * - Summary: Compress content while preserving semantic essence
 * - Tags: Extract semantic categorization markers
 */

/**
 * AI Provider contract for semantic enhancement operations.
 *
 * SEMANTIC TRANSFORMATIONS:
 * - generateSummary: Verbose → Semantic essence
 * - generateTags: Content → Categorization markers
 */
export interface IAIProvider {
  /**
   * 🎯 SEMANTIC INTENT: Compress content to semantic essence
   *
   * PURPOSE: Transform verbose content into 2-3 sentence summary
   * that preserves core semantic meaning.
   *
   * SEMANTIC ANCHORING:
   * - Input: Raw content (any length)
   * - Output: Semantic essence (2-3 sentences)
   * - Preserves: Core meaning, intent, context
   *
   * @param content - Raw content to summarize
   * @returns Semantic summary (2-3 sentences)
   */
  generateSummary(content: string): Promise<string>;

  /**
   * 🎯 SEMANTIC INTENT: Extract categorization markers
   *
   * PURPOSE: Generate 3-5 semantic tags for discovery and search.
   *
   * SEMANTIC ANCHORING:
   * - Input: Content to analyze
   * - Output: Comma-separated semantic tags
   * - Purpose: Enable semantic matching in search
   *
   * @param content - Content to analyze for themes
   * @returns Comma-separated tags (3-5 semantic markers)
   */
  generateTags(content: string): Promise<string>;
}
