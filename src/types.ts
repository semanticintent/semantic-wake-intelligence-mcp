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
 * Cloudflare Workers Environment bindings
 */
export interface Env {
  DB: D1Database;
  AI: Ai;
}

/**
 * 🎯 WAKE INTELLIGENCE: Action Types
 *
 * Classifies the type of action that created this context.
 * Part of Layer 1: Causality Engine.
 *
 * SEMANTIC CLASSIFICATION:
 * - conversation: Dialog between human and AI
 * - decision: Choice made with rationale
 * - file_edit: Code or document modification
 * - tool_use: External tool invocation
 * - research: Information gathering activity
 */
export type ActionType = 'conversation' | 'decision' | 'file_edit' | 'tool_use' | 'research';

/**
 * 🎯 WAKE INTELLIGENCE: Causality Metadata
 *
 * Tracks the "WHY" behind context creation (Layer 1: Past).
 *
 * CAUSALITY PROPERTIES:
 * - actionType: Classification of action that created this context
 * - rationale: Human-readable explanation of WHY this was saved
 * - dependencies: IDs of prior contexts that influenced this decision
 * - causedBy: Direct parent context ID (causal chain link)
 *
 * PURPOSE:
 * - Reconstruct decision history
 * - Build causal chains (root → current)
 * - Enable "Why did I do this?" queries
 */
export interface CausalityMetadata {
  /** Type of action that created this context */
  actionType: ActionType;

  /** Human-readable explanation of WHY this context was saved */
  rationale: string;

  /** IDs of prior snapshots that influenced this context */
  dependencies: string[];

  /** Direct parent snapshot ID in causal chain (null for root) */
  causedBy: string | null;
}

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
 * - causality: Causality metadata (WHY was this saved? Layer 1: Past)
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

  /** Causality metadata - WHY this was saved (Layer 1: Past) */
  causality: CausalityMetadata | null;
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
 * - causality: Optional causality metadata (Layer 1: Past)
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

  /** Optional causality metadata for Layer 1 tracking */
  causality?: CausalityMetadata;
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

  const baseValid = (
    typeof snapshot.id === 'string' &&
    typeof snapshot.project === 'string' &&
    typeof snapshot.summary === 'string' &&
    typeof snapshot.source === 'string' &&
    (snapshot.metadata === null || typeof snapshot.metadata === 'string') &&
    typeof snapshot.tags === 'string' &&
    typeof snapshot.timestamp === 'string'
  );

  // Causality is optional, but if present, must be valid
  if (snapshot.causality !== null && snapshot.causality !== undefined) {
    const causality = snapshot.causality as Record<string, unknown>;
    const causalityValid = (
      typeof causality.actionType === 'string' &&
      typeof causality.rationale === 'string' &&
      Array.isArray(causality.dependencies) &&
      (causality.causedBy === null || typeof causality.causedBy === 'string')
    );
    return baseValid && causalityValid;
  }

  return baseValid;
}
