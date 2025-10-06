-- ========================================
-- 🎯 MIGRATION: 0001_initial_schema
-- ========================================
-- SEMANTIC INTENT: Establish foundational data model for context preservation
-- CREATED: 2025-10-06
-- DESCRIPTION: Initial schema for MCP context snapshot storage with AI-enhanced metadata
--
-- SEMANTIC ANCHORING PRINCIPLES APPLIED:
-- 1. Each field represents directly observable semantic properties
-- 2. Indexes optimize semantic query patterns (project grouping, temporal ordering)
-- 3. Schema preserves intent through null/default constraints
-- ========================================

-- ========================================
-- 🎯 TABLE: context_snapshots
-- ========================================
-- SEMANTIC INTENT: Preserve conversation context with AI-enhanced semantic metadata
--
-- DOMAIN MODEL:
-- - id: Immutable unique identifier (semantic anchor for referencing)
-- - project: Semantic domain grouping (WHAT project does this belong to?)
-- - summary: AI-compressed semantic essence (WHAT is the core meaning?)
-- - source: Semantic provenance marker (WHERE did this originate?)
-- - metadata: Extensible semantic properties (WHAT additional context exists?)
-- - tags: Semantic categorization markers (HOW do we find this later?)
-- - timestamp: Temporal semantic anchor (WHEN was this preserved?)
--
-- INTENT PRESERVATION:
-- - NOT NULL constraints enforce semantic completeness
-- - DEFAULT values provide semantic fallbacks
-- - TEXT type preserves semantic flexibility (no arbitrary length limits)
-- ========================================

CREATE TABLE IF NOT EXISTS context_snapshots (
  -- ✅ SEMANTIC ANCHOR: Unique immutable identifier
  -- PURPOSE: Enable referential integrity and deduplication
  id TEXT PRIMARY KEY,

  -- ✅ SEMANTIC DOMAIN ANCHOR: Project grouping
  -- PURPOSE: Filter contexts by semantic domain (required for load_context)
  -- OBSERVABLE PROPERTY: Directly provided by user, not derived
  project TEXT NOT NULL,

  -- ✅ SEMANTIC ESSENCE: AI-compressed meaning
  -- PURPOSE: Preserve conversation intent in condensed form
  -- TRANSFORMATION: Raw content → AI summary (intent-preserving)
  summary TEXT NOT NULL,

  -- ✅ SEMANTIC PROVENANCE: Origin marker
  -- PURPOSE: Track where context came from (mcp, api, manual, etc.)
  -- DEFAULT: 'unknown' maintains semantic integrity even without explicit source
  source TEXT DEFAULT 'unknown',

  -- ✅ EXTENSIBLE SEMANTICS: Additional context properties
  -- PURPOSE: Allow semantic extension without schema changes
  -- FORMAT: JSON-encoded for structured semantic data
  metadata TEXT,

  -- ✅ SEMANTIC CATEGORIZATION: Search and discovery markers
  -- PURPOSE: Enable semantic matching via tags (used in search_context)
  -- TRANSFORMATION: Summary → AI tags (semantic theme extraction)
  tags TEXT DEFAULT '',

  -- ✅ TEMPORAL SEMANTIC ANCHOR: When was this preserved?
  -- PURPOSE: Enable chronological ordering and temporal filtering
  -- OBSERVABLE PROPERTY: System-generated at moment of preservation
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 🎯 INDEXES: Optimize Semantic Query Patterns
-- ========================================
-- SEMANTIC INTENT: Accelerate common semantic access patterns
--
-- INDEX DESIGN PRINCIPLES:
-- 1. Index on SEMANTIC ANCHORS (project, timestamp)
-- 2. Support OBSERVABLE QUERY PATTERNS (load, search)
-- 3. Composite indexes for COMBINED FILTERS
-- ========================================

-- ✅ INDEX: Fast project-based filtering
-- USE CASE: load_context tool (filter by project domain)
-- QUERY PATTERN: WHERE project = ?
CREATE INDEX IF NOT EXISTS idx_project ON context_snapshots(project);

-- ✅ INDEX: Fast temporal ordering
-- USE CASE: Recent-first ordering for all tools
-- QUERY PATTERN: ORDER BY timestamp DESC
CREATE INDEX IF NOT EXISTS idx_timestamp ON context_snapshots(timestamp);

-- ✅ INDEX: Composite project + timestamp
-- USE CASE: load_context with temporal ordering (most common pattern)
-- QUERY PATTERN: WHERE project = ? ORDER BY timestamp DESC
-- OPTIMIZATION: Single index scan instead of separate filter + sort
CREATE INDEX IF NOT EXISTS idx_project_timestamp ON context_snapshots(project, timestamp);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- SEMANTIC STATE: Foundational context preservation model established
-- NEXT MIGRATIONS: Future schema evolution should preserve semantic contracts
-- ========================================
