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
  VECTORIZE: VectorizeIndex;
  MCP_SECRET: string;
}

/**
 * 🎯 WAKE INTELLIGENCE: Memory Tier Classification
 *
 * Classifies contexts by temporal relevance (Layer 2: Memory Manager).
 *
 * MEMORY TIERS (based on age since creation):
 * - ACTIVE: Last 1 hour - highest priority, frequently accessed
 * - RECENT: 1-24 hours - moderate priority, recent work
 * - ARCHIVED: 1-30 days - low priority, historical reference
 * - EXPIRED: > 30 days - candidate for automatic pruning
 *
 * OBSERVABLE ANCHORING:
 * - All tier decisions based solely on timestamp comparison
 * - Deterministic classification (same timestamp → same tier)
 * - No subjective interpretation required
 */
export enum MemoryTier {
  ACTIVE = 'active',
  RECENT = 'recent',
  ARCHIVED = 'archived',
  EXPIRED = 'expired',
}

/**
 * 🎯 WAKE INTELLIGENCE: Propagation Metadata (Layer 3: Future)
 *
 * Predicts WHAT contexts will be needed next.
 *
 * PROPAGATION PROPERTIES:
 * - predictionScore: 0.0-1.0 likelihood of future access (composite score)
 * - lastPredicted: When prediction was last calculated
 * - predictedNextAccess: Estimated next access time (ISO string)
 * - propagationReason: Why this was predicted (e.g., ["causal_chain", "temporal_pattern"])
 *
 * PREDICTION FACTORS:
 * - Temporal: Access patterns over time (every N hours, time-of-day)
 * - Causal: Follows from causal chains (A → B → C)
 * - Frequency: Usage frequency (high accessCount = high score)
 *
 * OBSERVABLE ANCHORING:
 * - All predictions based on historical access data
 * - Scores calculated from timestamps and counts
 * - No subjective interpretation
 */
export interface PropagationMetadata {
  /** Composite prediction score (0.0-1.0) */
  predictionScore: number;

  /** When prediction was last calculated (ISO timestamp) */
  lastPredicted: string | null;

  /** Estimated next access time (ISO timestamp) */
  predictedNextAccess: string | null;

  /** Reasons for prediction (e.g., ["causal_chain", "high_frequency"]) */
  propagationReason: string[];
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
 * - memoryTier: Classification by temporal relevance (Layer 2: Present)
 * - lastAccessed: When context was last retrieved (Layer 2: LRU tracking)
 * - accessCount: Number of times accessed (Layer 2: Usage frequency)
 * - propagation: Prediction metadata (WHAT will be needed next? Layer 3: Future)
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

  /** Memory tier classification based on age (Layer 2: Present) */
  memoryTier: MemoryTier;

  /** Last accessed timestamp for LRU tracking (Layer 2: Present) */
  lastAccessed: string | null;

  /** Number of times this context was accessed (Layer 2: Present) */
  accessCount: number;

  /** Propagation metadata - WHAT will be needed next (Layer 3: Future) */
  propagation: PropagationMetadata | null;
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
/**
 * Author type for governance attribution (Layer 5: Auditor mode).
 * Mirrors RECALL's CREATED-BY enum — same three values.
 */
export type AuthorType = 'human' | 'ai-agent' | 'ai-compositor';

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

  /** Cross-project dependency detection: include recent contexts from ALL projects */
  crossProject?: boolean;

  /** Optional author type for governance attribution (stored in metadata.authorType) */
  authorType?: AuthorType;
}

/**
 * Causal graph node — a context snapshot in graph form.
 */
export interface CausalGraphNode {
  id: string;
  project: string;
  summary: string;
  actionType: string;
  memoryTier: string;
  timestamp: string;
  authorType?: string;
}

/**
 * Causal graph edge — a directed relationship between two snapshots.
 */
export interface CausalGraphEdge {
  from: string;
  to: string;
  type: 'caused_by' | 'dependency';
}

/**
 * Full causal graph for a project — nodes + edges, ready for D3/Mermaid.
 */
export interface CausalGraph {
  nodes: CausalGraphNode[];
  edges: CausalGraphEdge[];
  nodeCount: number;
  edgeCount: number;
}

/**
 * Consolidated memory health report — all 5 layers in one snapshot.
 */
export interface MemoryHealthReport {
  project: string;
  generatedAt: string;
  memory: {
    active: number;
    recent: number;
    archived: number;
    expired: number;
    total: number;
  };
  causality: {
    totalWithCausality: number;
    rootCauses: number;
    averageChainLength: number;
    actionTypeCounts: Record<string, number>;
  };
  propagation: {
    totalContexts: number;
    totalPredicted: number;
    averagePredictionScore: number;
  };
  learning: {
    sampleSize: number;
    lastTuned: string | null;
    weights: { temporal: number; causal: number; frequency: number };
  };
}

/**
 * Input for ingesting a Rune manifest into Wake.
 */
export interface IngestRuneManifestInput {
  /** JSON string of a rune.schema.json manifest */
  manifest: string;
  /** Project to save contexts under */
  project: string;
  /** Source label (default: rune-manifest) */
  source?: string;
}

/**
 * Result of a Rune manifest ingestion.
 */
export interface IngestRuneManifestResult {
  ingested: number;
  skipped: number;
  bindings: string[];
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

  /** Temporal posture shaping retrieval and presentation (default: historian) */
  personality_mode?: import('./config/personality-modes').PersonalityMode;
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

  /** Temporal posture shaping result ranking and presentation (default: historian) */
  personality_mode?: import('./config/personality-modes').PersonalityMode;
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
 * 🎯 WAKE INTELLIGENCE: Prediction Outcome (Layer 4: Meta-Learning)
 *
 * Records whether a context that had a prediction score was actually accessed.
 * Stores individual component scores so weight tuning can identify which
 * dimension (temporal/causal/frequency) best predicts access for this project.
 *
 * OBSERVABLE ANCHORING:
 * - Component scores recalculated at access time (deterministic)
 * - actually_accessed always true when recorded (passive recording only)
 * - recordedAt is the access timestamp
 */
export interface PredictionOutcome {
  /** Unique identifier */
  id: string;
  /** Context that was accessed */
  contextId: string;
  /** Project the context belongs to */
  project: string;
  /** Composite prediction score at time of access */
  predictedScore: number;
  /** Temporal component score at time of access (0.0-1.0) */
  temporalComponent: number;
  /** Causal component score at time of access (0.0-1.0) */
  causalComponent: number;
  /** Frequency component score at time of access (0.0-1.0) */
  frequencyComponent: number;
  /** Whether the context was actually accessed (always true when recorded) */
  actuallyAccessed: boolean;
  /** When this outcome was recorded (ISO timestamp) */
  recordedAt: string;
}

/**
 * 🎯 WAKE INTELLIGENCE: Per-Project Prediction Weights (Layer 4: Meta-Learning)
 *
 * Stores learned weights for composite prediction scoring.
 * Falls back to hardcoded 0.4/0.3/0.3 defaults until sufficient
 * sample size is accumulated (default: 20 outcomes).
 *
 * WEIGHT CONSTRAINTS:
 * - Each weight: min 0.1, max 0.6
 * - Sum of weights always normalised to 1.0
 */
export interface ProjectWeights {
  /** Project these weights apply to */
  project: string;
  /** Weight for temporal score component (default 0.4) */
  temporalWeight: number;
  /** Weight for causal score component (default 0.3) */
  causalWeight: number;
  /** Weight for frequency score component (default 0.3) */
  frequencyWeight: number;
  /** Number of outcomes used to tune these weights */
  sampleSize: number;
  /** When weights were last tuned (null = using defaults) */
  lastTuned: string | null;
}

/**
 * 🎯 WAKE INTELLIGENCE: Learning Statistics (Layer 4: Meta-Learning)
 *
 * Analytics on prediction accuracy and current learned weights for a project.
 * Exposed via get_learning_stats MCP tool.
 */
export interface LearningStats {
  /** Project these stats apply to */
  project: string;
  /** Current weights (learned or defaults) */
  currentWeights: ProjectWeights;
  /** Total outcomes recorded for this project */
  sampleSize: number;
  /** When weights were last tuned */
  lastTuned: string | null;
  /** Average temporal component across all outcomes */
  avgTemporalComponent: number;
  /** Average causal component across all outcomes */
  avgCausalComponent: number;
  /** Average frequency component across all outcomes */
  avgFrequencyComponent: number;
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
    typeof snapshot.timestamp === 'string' &&
    typeof snapshot.memoryTier === 'string' &&
    (snapshot.lastAccessed === null || typeof snapshot.lastAccessed === 'string') &&
    typeof snapshot.accessCount === 'number'
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
    if (!causalityValid) return false;
  }

  // Propagation is optional, but if present, must be valid
  if (snapshot.propagation !== null && snapshot.propagation !== undefined) {
    const propagation = snapshot.propagation as Record<string, unknown>;
    const propagationValid = (
      typeof propagation.predictionScore === 'number' &&
      (propagation.lastPredicted === null || typeof propagation.lastPredicted === 'string') &&
      (propagation.predictedNextAccess === null || typeof propagation.predictedNextAccess === 'string') &&
      Array.isArray(propagation.propagationReason)
    );
    if (!propagationValid) return false;
  }

  return baseValid;
}
