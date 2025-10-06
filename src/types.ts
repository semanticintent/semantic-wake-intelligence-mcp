/**
 * 🎯 SEMANTIC INTENT: Type-Safe Domain Models
 *
 * PURPOSE: Ensure compile-time semantic contract enforcement
 *
 * SEMANTIC ANCHORING:
 * - Types mirror database schema semantic intent
 * - Each property documented with semantic purpose
 * - Type safety prevents semantic contract violations
 *
 * RELATIONSHIP TO SCHEMA:
 * - Maps 1:1 with migrations/0001_initial_schema.sql
 * - Maintains semantic consistency between storage and runtime
 */

/**
 * 🎯 SEMANTIC DOMAIN MODEL: Context Snapshot
 *
 * Represents a preserved conversation context with AI-enhanced metadata.
 *
 * SEMANTIC PROPERTIES:
 * - id: Unique immutable identifier (semantic anchor)
 * - project: Semantic domain grouping (WHAT domain?)
 * - summary: AI-compressed semantic essence (WHAT is the meaning?)
 * - source: Semantic provenance marker (WHERE did this come from?)
 * - metadata: Extensible semantic properties (WHAT additional context?)
 * - tags: Semantic categorization markers (HOW to find this?)
 * - timestamp: Temporal semantic anchor (WHEN was this preserved?)
 *
 * INTENT PRESERVATION:
 * - Matches database schema semantic contracts
 * - Enforces type safety for semantic operations
 * - Prevents accidental semantic violations at compile time
 */
export interface ContextSnapshot {
  /** Unique immutable identifier */
  id: string;

  /** Semantic domain anchor - groups related contexts */
  project: string;

  /** AI-compressed semantic essence of original content */
  summary: string;

  /** Semantic provenance marker (e.g., 'mcp', 'api', 'manual') */
  source: string;

  /** Extensible semantic properties (JSON-encoded) */
  metadata: string | null;

  /** Semantic categorization markers for discovery */
  tags: string;

  /** Temporal semantic anchor - when context was preserved */
  timestamp: string;
}

/**
 * 🎯 SEMANTIC INTENT: Context Save Operation
 *
 * Input contract for preserving conversation context.
 *
 * SEMANTIC REQUIREMENTS:
 * - project: Required semantic domain anchor
 * - content: Required raw content for AI compression
 * - source: Optional provenance (defaults to 'mcp')
 * - metadata: Optional extensible semantics
 */
export interface SaveContextInput {
  /** Semantic domain identifier (required) */
  project: string;

  /** Raw content to preserve (will be AI-compressed) */
  content: string;

  /** Optional provenance marker */
  source?: string;

  /** Optional extensible semantic properties */
  metadata?: Record<string, unknown>;
}

/**
 * 🎯 SEMANTIC INTENT: Context Load Operation
 *
 * Input contract for retrieving preserved contexts.
 *
 * SEMANTIC ANCHORING:
 * - Filter by project (semantic domain)
 * - Order by timestamp (temporal semantic relevance)
 * - Limit results (bounded retrieval scope)
 */
export interface LoadContextInput {
  /** Semantic domain filter (required) */
  project: string;

  /** Maximum contexts to return (optional, default: 1, max: 10) */
  limit?: number;
}

/**
 * 🎯 SEMANTIC INTENT: Context Search Operation
 *
 * Input contract for semantic discovery across contexts.
 *
 * SEMANTIC ANCHORING:
 * - Query matches semantic markers (summary + tags)
 * - Optional project filter maintains domain semantics
 * - Results ordered by temporal relevance
 */
export interface SearchContextInput {
  /** Semantic search terms (matches summary and tags) */
  query: string;

  /** Optional semantic domain filter */
  project?: string;
}

/**
 * 🎯 SEMANTIC INTENT: MCP Tool Result
 *
 * Output contract for tool execution results.
 *
 * SEMANTIC STRUCTURE:
 * - content: Array of semantic content blocks
 * - type: Content type marker ('text', 'image', etc.)
 * - text: Human-readable semantic payload
 */
export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
}

/**
 * 🎯 TYPE GUARD: Runtime Type Validation
 *
 * Validates semantic contract compliance at runtime.
 *
 * USE CASE: Validate external inputs preserve semantic intent
 */
export function isValidContextSnapshot(obj: unknown): obj is ContextSnapshot {
  if (typeof obj !== 'object' || obj === null) return false;

  const snapshot = obj as Record<string, unknown>;

  return (
    typeof snapshot.id === 'string' &&
    typeof snapshot.project === 'string' &&
    typeof snapshot.summary === 'string' &&
    typeof snapshot.source === 'string' &&
    (snapshot.metadata === null || typeof snapshot.metadata === 'string') &&
    typeof snapshot.tags === 'string' &&
    typeof snapshot.timestamp === 'string'
  );
}
