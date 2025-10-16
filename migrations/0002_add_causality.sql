/**
 * 🎯 WAKE INTELLIGENCE: Migration 0002 - Add Causality Tracking (Layer 1: Past)
 *
 * PURPOSE: Enable causal chain reconstruction and dependency tracking
 *
 * LAYER 1 FEATURES:
 * - Action type classification (conversation, decision, file_edit, tool_use, research)
 * - Rationale preservation (WHY was this saved?)
 * - Dependency tracking (what influenced this?)
 * - Causal chains (parent → child relationships)
 *
 * SEMANTIC ANCHORING:
 * - All new columns nullable (backward compatible)
 * - Preserves existing data
 * - Observable properties only
 *
 * Date: 2025-10-16
 * Version: 2.0.0
 */

-- Add action type classification
ALTER TABLE context_snapshots ADD COLUMN action_type TEXT;

-- Add rationale (WHY this context was saved)
ALTER TABLE context_snapshots ADD COLUMN rationale TEXT;

-- Add dependencies (JSON array of snapshot IDs)
ALTER TABLE context_snapshots ADD COLUMN dependencies TEXT;

-- Add causal parent link
ALTER TABLE context_snapshots ADD COLUMN caused_by TEXT;

-- Create index for causal chain traversal (find children of a parent)
CREATE INDEX IF NOT EXISTS idx_contexts_caused_by ON context_snapshots(caused_by);

-- Create composite index for dependency detection (recent contexts in project)
CREATE INDEX IF NOT EXISTS idx_contexts_project_timestamp ON context_snapshots(project, timestamp DESC);

-- Create index for action type analytics
CREATE INDEX IF NOT EXISTS idx_contexts_action_type ON context_snapshots(action_type);

/**
 * MIGRATION VALIDATION QUERIES:
 *
 * Check new columns exist:
 *   PRAGMA table_info(context_snapshots);
 *
 * Check indexes created:
 *   SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='context_snapshots';
 *
 * Test causality query (find causal chain):
 *   SELECT id, summary, caused_by, action_type FROM context_snapshots WHERE caused_by IS NOT NULL;
 *
 * Test dependency detection (recent contexts):
 *   SELECT id, summary, timestamp FROM context_snapshots
 *   WHERE project = 'test-project'
 *   AND timestamp >= datetime('now', '-1 hour')
 *   ORDER BY timestamp DESC;
 */
