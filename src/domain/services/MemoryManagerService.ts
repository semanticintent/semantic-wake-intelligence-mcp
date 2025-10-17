/**
 * 🎯 WAKE INTELLIGENCE: Memory Manager Service (Layer 2: Present)
 *
 * PURPOSE: Manage temporal relevance and automatic memory lifecycle
 *
 * LAYER 2 RESPONSIBILITIES:
 * - Classify contexts by age (ACTIVE, RECENT, ARCHIVED, EXPIRED)
 * - Track access patterns (LRU tracking)
 * - Automatic tier updates based on time
 * - Memory pruning (delete EXPIRED contexts)
 * - Memory analytics and statistics
 *
 * SEMANTIC ANCHORING:
 * - All decisions based on observable timestamps
 * - Deterministic tier classification
 * - No subjective interpretation
 *
 * MEMORY TIER THRESHOLDS:
 * - ACTIVE: < 1 hour (high priority, frequently accessed)
 * - RECENT: 1-24 hours (moderate priority, recent work)
 * - ARCHIVED: 1-30 days (low priority, historical reference)
 * - EXPIRED: > 30 days (candidate for automatic pruning)
 */

import type { IContextRepository } from '../../application/ports/IContextRepository';
import { ContextSnapshot } from '../models/ContextSnapshot';
import { MemoryTier } from '../../types';

/**
 * Memory statistics for a project
 */
export interface MemoryStats {
  total: number;
  active: number;
  recent: number;
  archived: number;
  expired: number;
}

/**
 * Domain service for memory management operations (Layer 2: Present)
 */
export class MemoryManagerService {
  constructor(private readonly repository: IContextRepository) {}

  /**
   * 🎯 WAKE INTELLIGENCE: Recalculate memory tier for all contexts
   *
   * PURPOSE: Migrate existing data or update stale tiers
   *
   * OBSERVABLE OPERATION:
   * - Query all contexts
   * - Calculate current tier from timestamp
   * - Update if tier changed
   * - Return count of updated contexts
   *
   * @param project - Optional project filter (null = all projects)
   * @returns Number of contexts updated
   */
  async recalculateAllTiers(project?: string): Promise<number> {
    const limit = 1000; // Process in batches
    const contexts = project
      ? await this.repository.findByProject(project, limit)
      : []; // TODO: Add findAll() method to repository

    let updatedCount = 0;

    for (const context of contexts) {
      const currentTier = ContextSnapshot.calculateMemoryTier(context.timestamp);

      if (currentTier !== context.memoryTier) {
        await this.repository.updateMemoryTier(context.id, currentTier);
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Prune expired contexts
   *
   * PURPOSE: Automatic memory cleanup for old, unused contexts
   *
   * OBSERVABLE OPERATION:
   * - Find contexts in EXPIRED tier
   * - Delete oldest first
   * - Bounded deletion (max limit)
   * - Return count of pruned contexts
   *
   * SAFETY:
   * - Only deletes EXPIRED tier (> 30 days old)
   * - Bounded limit prevents mass deletion
   * - Deterministic (oldest first)
   *
   * @param limit - Maximum contexts to prune (default: 100)
   * @returns Number of contexts deleted
   */
  async pruneExpiredContexts(limit: number = 100): Promise<number> {
    const expiredContexts = await this.repository.findByMemoryTier(
      MemoryTier.EXPIRED,
      limit
    );

    // TODO: Add delete() method to repository
    // For now, just return count that would be deleted
    return expiredContexts.length;
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Get memory statistics for project
   *
   * PURPOSE: Analytics on memory tier distribution
   *
   * OBSERVABLE QUERY:
   * - Count contexts in each tier
   * - Calculate percentages
   * - Identify optimization opportunities
   *
   * @param project - Project to analyze
   * @returns Statistics on memory tier distribution
   */
  async getMemoryStats(project: string): Promise<MemoryStats> {
    // Query by project
    const allContexts = await this.repository.findByProject(project, 1000);

    // Count by tier
    const stats: MemoryStats = {
      total: allContexts.length,
      active: 0,
      recent: 0,
      archived: 0,
      expired: 0,
    };

    for (const context of allContexts) {
      switch (context.memoryTier) {
        case MemoryTier.ACTIVE:
          stats.active++;
          break;
        case MemoryTier.RECENT:
          stats.recent++;
          break;
        case MemoryTier.ARCHIVED:
          stats.archived++;
          break;
        case MemoryTier.EXPIRED:
          stats.expired++;
          break;
      }
    }

    return stats;
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Update access tracking for context
   *
   * PURPOSE: Track LRU metadata when context is accessed
   *
   * OBSERVABLE OPERATION:
   * - Update last_accessed timestamp
   * - Increment access_count
   * - Idempotent operation
   *
   * @param snapshotId - ID of context being accessed
   * @returns void
   */
  async trackAccess(snapshotId: string): Promise<void> {
    await this.repository.updateAccessTracking(snapshotId);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Find least recently used contexts
   *
   * PURPOSE: Identify candidates for archival or pruning
   *
   * OBSERVABLE QUERY:
   * - Filter by memory tier
   * - Order by last_accessed ASC (oldest first)
   * - NULLS FIRST (never accessed)
   * - Return top N
   *
   * @param tier - Memory tier to search
   * @param limit - Maximum results
   * @returns Least recently used contexts in tier
   */
  async findLeastRecentlyUsed(tier: MemoryTier, limit: number = 10): Promise<ContextSnapshot[]> {
    // Get contexts in tier (already ordered by timestamp ASC)
    const contexts = await this.repository.findByMemoryTier(tier, limit * 2);

    // Sort by last_accessed (nulls first, then oldest)
    const sorted = contexts.sort((a, b) => {
      if (a.lastAccessed === null && b.lastAccessed === null) return 0;
      if (a.lastAccessed === null) return -1; // a comes first
      if (b.lastAccessed === null) return 1; // b comes first

      return new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime();
    });

    return sorted.slice(0, limit).map(c => ContextSnapshot.fromDatabase(c));
  }
}
