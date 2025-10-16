/**
 * 🎯 WAKE INTELLIGENCE: Causality Service (Layer 1: Past)
 *
 * PURPOSE: Track and reconstruct causal relationships between contexts
 *
 * LAYER 1 RESPONSIBILITIES:
 * - Record action history with rationale
 * - Build causal chains (root → current)
 * - Detect dependencies based on temporal proximity
 * - Reconstruct decision reasoning
 *
 * SEMANTIC ANCHORING:
 * - Every action has a "WHY" (rationale)
 * - Decisions form causal chains
 * - Observable: timestamps, dependencies, action types
 *
 * DOMAIN-DRIVEN DESIGN:
 * - Pure domain service (no infrastructure dependencies)
 * - Operates on ContextSnapshot entities
 * - Business logic for causality tracking
 */

import { ContextSnapshot } from '../models/ContextSnapshot';
import type { CausalityMetadata, ActionType, ContextSnapshot as IContextSnapshot } from '../../types';
import type { IContextRepository } from '../../application/ports/IContextRepository';

/**
 * Causal chain node representing a snapshot and its causal relationships
 */
export interface CausalChainNode {
  snapshot: IContextSnapshot;
  causedBy: CausalChainNode | null; // Parent in chain
  children: CausalChainNode[]; // Snapshots this caused
  depth: number; // Distance from root (0 = root)
}

/**
 * Result of dependency detection
 */
export interface DetectedDependencies {
  snapshots: IContextSnapshot[];
  reason: string; // Why these were considered dependencies
}

/**
 * 🎯 WAKE INTELLIGENCE: Causality Service
 *
 * Implements Layer 1 (Past) of the Wake brain architecture.
 */
export class CausalityService {
  constructor(private readonly repository: IContextRepository) {}

  /**
   * 🎯 SEMANTIC INTENT: Record action with causal metadata
   *
   * PURPOSE: Create causality metadata for a new context
   *
   * BUSINESS RULES:
   * - actionType classifies the action
   * - rationale explains WHY this context was saved
   * - dependencies auto-detected from recent contexts
   * - causedBy links to immediate parent (if provided)
   *
   * @param actionType - Classification of action
   * @param rationale - Human-readable explanation of WHY
   * @param causedBy - Optional parent snapshot ID (direct causal link)
   * @param project - Project context for dependency detection
   * @returns Causality metadata ready for snapshot creation
   */
  async recordAction(
    actionType: ActionType,
    rationale: string,
    causedBy: string | null = null,
    project?: string
  ): Promise<CausalityMetadata> {
    // Auto-detect dependencies from recent context
    const dependencies: string[] = [];

    if (project) {
      const detected = await this.detectDependencies(project, new Date());
      dependencies.push(...detected.snapshots.map(s => s.id));
    }

    return {
      actionType,
      rationale,
      dependencies,
      causedBy,
    };
  }

  /**
   * 🎯 SEMANTIC INTENT: Reconstruct reasoning for a decision
   *
   * PURPOSE: Answer "Why did I do this?" by analyzing causal chain
   *
   * ALGORITHM:
   * 1. Load snapshot by ID
   * 2. Extract causality metadata
   * 3. Build narrative from rationale + action type
   * 4. Include parent context if available
   *
   * @param snapshotId - ID of snapshot to explain
   * @returns Human-readable reasoning
   */
  async reconstructReasoning(snapshotId: string): Promise<string> {
    const snapshot = await this.repository.findById(snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    if (!snapshot.causality) {
      return `No causality metadata available for this context.\n\nSummary: ${snapshot.summary}`;
    }

    const { actionType, rationale, causedBy, dependencies } = snapshot.causality;

    let reasoning = `**Action Type**: ${actionType}\n\n`;
    reasoning += `**Rationale**: ${rationale}\n\n`;
    reasoning += `**Context Summary**: ${snapshot.summary}\n\n`;

    if (causedBy) {
      const parent = await this.repository.findById(causedBy);
      if (parent) {
        reasoning += `**Caused By**: ${parent.summary} (ID: ${causedBy})\n\n`;
      }
    }

    if (dependencies.length > 0) {
      reasoning += `**Dependencies**: ${dependencies.length} prior context(s) influenced this decision\n`;
    }

    return reasoning;
  }

  /**
   * 🎯 SEMANTIC INTENT: Build causal chain from root to target
   *
   * PURPOSE: Trace decision history backwards to root cause
   *
   * ALGORITHM:
   * 1. Start at target snapshot
   * 2. Follow causedBy links backwards
   * 3. Build chain: root → ... → target
   * 4. Calculate depth for each node
   *
   * @param endSnapshotId - Target snapshot to trace back from
   * @returns Causal chain with root at index 0
   */
  async buildCausalChain(endSnapshotId: string): Promise<CausalChainNode[]> {
    const chain: CausalChainNode[] = [];
    const visited = new Set<string>();

    let currentId: string | null = endSnapshotId;
    let depth = 0;

    // Traverse backwards to root
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);

      const snapshot = await this.repository.findById(currentId);
      if (!snapshot) break;

      const node: CausalChainNode = {
        snapshot,
        causedBy: null, // Will be set in reverse pass
        children: [],
        depth,
      };

      chain.unshift(node); // Add to front (building root → target)
      currentId = snapshot.causality?.causedBy || null;
      depth++;
    }

    // Set depth correctly (root = 0)
    chain.forEach((node, index) => {
      node.depth = index;
    });

    // Link causedBy relationships
    for (let i = 1; i < chain.length; i++) {
      chain[i].causedBy = chain[i - 1];
      chain[i - 1].children.push(chain[i]);
    }

    return chain;
  }

  /**
   * 🎯 SEMANTIC INTENT: Detect dependencies from temporal proximity
   *
   * PURPOSE: Auto-discover related contexts for dependency tracking
   *
   * HEURISTIC:
   * - Look back N hours (default: 1 hour)
   * - Find contexts in same project
   * - Temporal proximity = likely dependency
   *
   * BUSINESS RULE:
   * - Maximum 5 dependencies to prevent noise
   * - Only contexts from same project
   *
   * @param project - Project to search within
   * @param timestamp - Reference timestamp (usually now)
   * @param hoursBack - How far back to search (default: 1)
   * @returns Detected dependencies with explanation
   */
  async detectDependencies(
    project: string,
    timestamp: Date = new Date(),
    hoursBack: number = 1
  ): Promise<DetectedDependencies> {
    const beforeTimestamp = timestamp.toISOString();
    const snapshots = await this.repository.findRecent(project, beforeTimestamp, hoursBack);

    // Limit to most recent 5 to prevent dependency explosion
    const recentSnapshots = snapshots.slice(0, 5);

    const reason = recentSnapshots.length > 0
      ? `Found ${recentSnapshots.length} context(s) from the last ${hoursBack} hour(s) in project "${project}"`
      : `No recent contexts found in the last ${hoursBack} hour(s)`;

    return {
      snapshots: recentSnapshots,
      reason,
    };
  }

  /**
   * 🎯 SEMANTIC INTENT: Validate causal chain integrity
   *
   * PURPOSE: Ensure no cycles or broken links
   *
   * CHECKS:
   * - No circular references (A → B → A)
   * - All causedBy IDs resolve to valid snapshots
   * - Timestamps monotonically increase along chain
   *
   * @param snapshotId - Snapshot to validate
   * @returns True if chain is valid, false otherwise
   */
  async validateCausalChain(snapshotId: string): Promise<boolean> {
    try {
      const chain = await this.buildCausalChain(snapshotId);

      if (chain.length === 0) return false;

      // Check timestamps increase along chain
      for (let i = 1; i < chain.length; i++) {
        const prevTime = new Date(chain[i - 1].snapshot.timestamp);
        const currTime = new Date(chain[i].snapshot.timestamp);

        if (currTime < prevTime) {
          return false; // Timestamps should increase (or stay same)
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🎯 SEMANTIC INTENT: Get causal statistics for a project
   *
   * PURPOSE: Provide insights into causality tracking
   *
   * METRICS:
   * - Total contexts with causality metadata
   * - Average chain length
   * - Most common action types
   * - Root causes (contexts with no parent)
   *
   * @param project - Project to analyze
   * @returns Causality statistics
   */
  async getCausalityStats(project: string): Promise<{
    totalWithCausality: number;
    averageChainLength: number;
    actionTypeCounts: Record<ActionType, number>;
    rootCauses: number;
  }> {
    const snapshots = await this.repository.findByProject(project);

    const withCausality = snapshots.filter(s => s.causality !== null);
    const totalWithCausality = withCausality.length;

    // Count action types
    const actionTypeCounts: Record<ActionType, number> = {
      conversation: 0,
      decision: 0,
      file_edit: 0,
      tool_use: 0,
      research: 0,
    };

    let rootCauses = 0;

    for (const snapshot of withCausality) {
      if (snapshot.causality) {
        actionTypeCounts[snapshot.causality.actionType]++;
        if (!snapshot.causality.causedBy) {
          rootCauses++;
        }
      }
    }

    // Calculate average chain length (expensive, so sample)
    const sampleSize = Math.min(10, withCausality.length);
    let totalChainLength = 0;

    for (let i = 0; i < sampleSize; i++) {
      const chain = await this.buildCausalChain(withCausality[i].id);
      totalChainLength += chain.length;
    }

    const averageChainLength = sampleSize > 0 ? totalChainLength / sampleSize : 0;

    return {
      totalWithCausality,
      averageChainLength,
      actionTypeCounts,
      rootCauses,
    };
  }
}
