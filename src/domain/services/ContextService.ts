/**
 * 🎯 SEMANTIC INTENT: Context Management Domain Service
 *
 * PURPOSE: Orchestrate context operations with semantic preservation
 *
 * DOMAIN SERVICE RESPONSIBILITY:
 * - Coordinates AI enhancement + persistence
 * - Enforces business rules
 * - Maintains semantic integrity through transformations
 * - Pure business logic (no infrastructure dependencies)
 *
 * SEMANTIC ANCHORING:
 * - WHAT: Core business operations (save, load, search)
 * - WHY: Preserve conversation semantic meaning
 * - HOW: Coordinate domain entities + infrastructure ports
 *
 * DEPENDENCY INVERSION:
 * - Depends on abstractions (IContextRepository, IAIProvider)
 * - Not tied to specific implementations (D1, Cloudflare AI, etc.)
 */

import type { IContextRepository } from '../../application/ports/IContextRepository';
import type { IAIProvider } from '../../application/ports/IAIProvider';
import type { SaveContextInput, LoadContextInput, SearchContextInput } from '../../types';
import { ContextSnapshot } from '../models/ContextSnapshot';

/**
 * Domain service for context management operations.
 *
 * ORCHESTRATION:
 * - AI Enhancement → Domain Validation → Persistence
 * - Maintains semantic intent through each step
 */
export class ContextService {
  constructor(
    private readonly repository: IContextRepository,
    private readonly aiProvider: IAIProvider
  ) {}

  /**
   * 🎯 SEMANTIC INTENT: Preserve conversation context with AI enhancement
   *
   * BUSINESS FLOW:
   * 1. AI Enhancement: Raw content → Semantic summary + tags
   * 2. Domain Validation: Create snapshot entity (enforces rules)
   * 3. Persistence: Save to repository
   *
   * SEMANTIC PRESERVATION:
   * - Input: Verbose conversation content
   * - Transform: AI compression (meaning preserved)
   * - Output: Stored semantic snapshot
   *
   * @param input - Context to save with semantic content
   * @returns Saved snapshot with AI-enhanced metadata
   */
  async saveContext(input: SaveContextInput): Promise<ContextSnapshot> {
    // Step 1: AI Enhancement - Extract semantic meaning
    const summary = await this.aiProvider.generateSummary(input.content);
    const tags = await this.aiProvider.generateTags(summary);

    // Step 2: Domain Entity Creation - Validate business rules
    const snapshot = ContextSnapshot.create({
      project: input.project,
      summary,
      source: input.source,
      metadata: input.metadata,
      tags
    });

    // Step 3: Persistence - Delegate to infrastructure
    await this.repository.save(snapshot);

    return snapshot;
  }

  /**
   * 🎯 SEMANTIC INTENT: Retrieve contexts by semantic domain
   *
   * BUSINESS RULES:
   * - Limit bounded to prevent resource exhaustion (max 10)
   * - Results ordered by temporal semantic relevance (newest first)
   *
   * @param input - Project filter and result limit
   * @returns Contexts ordered by timestamp DESC
   */
  async loadContext(input: LoadContextInput): Promise<ContextSnapshot[]> {
    // Business rule: Bounded limit for safety
    const boundedLimit = Math.min(input.limit || 1, 10);

    const results = await this.repository.findByProject(input.project, boundedLimit);

    return results.map(r => ContextSnapshot.fromDatabase(r));
  }

  /**
   * 🎯 SEMANTIC INTENT: Find contexts by semantic matching
   *
   * SEMANTIC SEARCH:
   * - Matches against summary (semantic essence)
   * - Matches against tags (categorization markers)
   * - Optional project scoping (domain filter)
   *
   * @param input - Search query and optional project filter
   * @returns Contexts matching semantic meaning
   */
  async searchContext(input: SearchContextInput): Promise<ContextSnapshot[]> {
    const results = await this.repository.search(input.query, input.project);

    return results.map(r => ContextSnapshot.fromDatabase(r));
  }
}
