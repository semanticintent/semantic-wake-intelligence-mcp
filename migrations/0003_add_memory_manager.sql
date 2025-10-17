/**
 * 🎯 WAKE INTELLIGENCE: Migration 0003 - Add Memory Manager (Layer 2: Present)
 *
 * PURPOSE: Enable temporal relevance classification and LRU tracking
 *
 * LAYER 2 FEATURES:
 * - Memory tier classification (ACTIVE, RECENT, ARCHIVED, EXPIRED)
 * - Last accessed timestamp (LRU tracking)
 * - Access count (usage frequency tracking)
 * - Automatic pruning capabilities
 *
 * SEMANTIC ANCHORING:
 * - All new columns with defaults (backward compatible)
 * - Preserves existing data
 * - Observable properties only (timestamps, counts)
 *
 * MEMORY TIER THRESHOLDS:
 * - ACTIVE: < 1 hour
 * - RECENT: 1-24 hours
 * - ARCHIVED: 1-30 days
 * - EXPIRED: > 30 days
 *
 * Date: 2025-10-16
 * Version: 2.0.0
 */

-- Add memory tier classification (ACTIVE, RECENT, ARCHIVED, EXPIRED)
ALTER TABLE context_snapshots ADD COLUMN memory_tier TEXT NOT NULL DEFAULT 'active';

-- Add last accessed timestamp for LRU tracking
ALTER TABLE context_snapshots ADD COLUMN last_accessed TEXT;

-- Add access count for usage frequency tracking
ALTER TABLE context_snapshots ADD COLUMN access_count INTEGER NOT NULL DEFAULT 0;

-- Create index for memory tier queries (e.g., find EXPIRED for pruning)
CREATE INDEX IF NOT EXISTS idx_contexts_memory_tier ON context_snapshots(memory_tier);

-- Create composite index for LRU queries (find least recently accessed by tier)
CREATE INDEX IF NOT EXISTS idx_contexts_tier_accessed ON context_snapshots(memory_tier, last_accessed DESC);

-- Create index for access frequency analytics
CREATE INDEX IF NOT EXISTS idx_contexts_access_count ON context_snapshots(access_count DESC);

-- Create composite index for automatic tier updates (find contexts needing reclassification)
CREATE INDEX IF NOT EXISTS idx_contexts_timestamp_tier ON context_snapshots(timestamp DESC, memory_tier);

/**
 * MIGRATION VALIDATION QUERIES:
 *
 * Check new columns exist with defaults:
 *   PRAGMA table_info(context_snapshots);
 *
 * Check indexes created:
 *   SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='context_snapshots';
 *
 * Test memory tier query (find EXPIRED contexts for pruning):
 *   SELECT id, summary, memory_tier, timestamp
 *   FROM context_snapshots
 *   WHERE memory_tier = 'expired';
 *
 * Test LRU query (find least recently used ARCHIVED contexts):
 *   SELECT id, summary, last_accessed, access_count
 *   FROM context_snapshots
 *   WHERE memory_tier = 'archived'
 *   ORDER BY last_accessed ASC NULLS FIRST
 *   LIMIT 10;
 *
 * Test access frequency query (find most accessed contexts):
 *   SELECT id, summary, access_count, memory_tier
 *   FROM context_snapshots
 *   ORDER BY access_count DESC
 *   LIMIT 10;
 *
 * Update existing data with calculated memory tiers:
 *   -- Note: This should be done by application code on deployment
 *   -- to ensure consistent tier calculation logic
 */
