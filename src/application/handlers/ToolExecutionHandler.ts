/**
 * 🎯 SEMANTIC INTENT: MCP Tool Execution Orchestrator
 *
 * PURPOSE: Translate MCP tool calls to domain operations
 *
 * APPLICATION LAYER RESPONSIBILITY:
 * - Coordinates between presentation (MCP protocol) and domain (business logic)
 * - Transforms tool arguments to domain inputs
 * - Formats domain results for MCP protocol
 * - Maintains semantic intent through transformation
 *
 * SEMANTIC ANCHORING:
 * - Tool names express semantic intent (save_context, load_context, etc.)
 * - Each tool maps to domain service operation
 * - Results preserve semantic meaning in user-facing format
 */

import type { ContextService } from '../../domain/services/ContextService';
import type { ToolResult, SaveContextInput, LoadContextInput, SearchContextInput } from '../../types';
import { ContextSnapshot } from '../../domain/models/ContextSnapshot';

/**
 * Handler for MCP tool execution.
 *
 * DISPATCH PATTERN:
 * - Routes tool calls to appropriate handlers
 * - Each handler delegates to domain service
 * - Formats results for MCP protocol
 */
export class ToolExecutionHandler {
  constructor(private readonly contextService: ContextService) {}

  /**
   * 🎯 SEMANTIC INTENT: Execute MCP tool by semantic name
   *
   * @param toolName - Semantic tool identifier
   * @param args - Tool arguments
   * @returns MCP-formatted result
   */
  async execute(toolName: string, args: unknown): Promise<ToolResult> {
    switch (toolName) {
      case 'save_context':
        return this.handleSaveContext(args as SaveContextInput);

      case 'load_context':
        return this.handleLoadContext(args as LoadContextInput);

      case 'search_context':
        return this.handleSearchContext(args as SearchContextInput);

      // Layer 1: Causality Engine (Past - WHY)
      case 'reconstruct_reasoning':
        return this.handleReconstructReasoning(args as { snapshotId: string });

      case 'build_causal_chain':
        return this.handleBuildCausalChain(args as { snapshotId: string });

      case 'get_causality_stats':
        return this.handleGetCausalityStats(args as { project: string });

      // Layer 2: Memory Manager (Present - HOW)
      case 'get_memory_stats':
        return this.handleGetMemoryStats(args as { project: string });

      case 'recalculate_memory_tiers':
        return this.handleRecalculateMemoryTiers(args as { project?: string });

      case 'prune_expired_contexts':
        return this.handlePruneExpiredContexts(args as { limit?: number });

      // Layer 3: Propagation Engine (Future - WHAT)
      case 'update_predictions':
        return this.handleUpdatePredictions(args as { project: string; staleThreshold?: number });

      case 'get_high_value_contexts':
        return this.handleGetHighValueContexts(args as { project: string; minScore?: number; limit?: number });

      case 'get_propagation_stats':
        return this.handleGetPropagationStats(args as { project: string });

      case 'get_learning_stats':
        return this.handleGetLearningStats(args as { project: string });

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * 🎯 SEMANTIC TOOL HANDLER: save_context
   *
   * PURPOSE: Preserve conversation context with AI enhancement
   *
   * FLOW:
   * - Delegate to domain service
   * - Format result for user comprehension
   */
  private async handleSaveContext(input: SaveContextInput): Promise<ToolResult> {
    const snapshot = await this.contextService.saveContext(input);

    return {
      content: [{
        type: "text",
        text: `Context saved!\nID: ${snapshot.id}\nSummary: ${snapshot.summary}\nTags: ${snapshot.tags}`
      }]
    };
  }

  /**
   * 🎯 SEMANTIC TOOL HANDLER: load_context
   *
   * PURPOSE: Retrieve preserved contexts for continuation
   *
   * FLOW:
   * - Delegate to domain service
   * - Format results as markdown list
   */
  private async handleLoadContext(input: LoadContextInput): Promise<ToolResult> {
    const snapshots = await this.contextService.loadContext(input);

    if (snapshots.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No context found for project: ${input.project}`
        }]
      };
    }

    const contextList = snapshots
      .map(ctx => `**${ctx.project}** (${ctx.timestamp})\n${ctx.summary}\nTags: ${ctx.tags}`)
      .join('\n\n');

    return {
      content: [{
        type: "text",
        text: `Found ${snapshots.length} context(s):\n\n${contextList}`
      }]
    };
  }

  /**
   * 🎯 SEMANTIC TOOL HANDLER: search_context
   *
   * PURPOSE: Find contexts by semantic matching
   *
   * FLOW:
   * - Delegate to domain service
   * - Format results as markdown list
   */
  private async handleSearchContext(input: SearchContextInput): Promise<ToolResult> {
    const snapshots = await this.contextService.searchContext(input);

    if (snapshots.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No contexts found matching: "${input.query}"`
        }]
      };
    }

    const searchList = snapshots
      .map(ctx => `**${ctx.project}** (${ctx.timestamp})\n${ctx.summary}\nTags: ${ctx.tags}`)
      .join('\n\n');

    return {
      content: [{
        type: "text",
        text: `Found ${snapshots.length} context(s) for "${input.query}":\n\n${searchList}`
      }]
    };
  }

  // =============================================================================
  // Layer 1: Causality Engine (Past - WHY)
  // =============================================================================

  /**
   * 🎯 LAYER 1 TOOL: reconstruct_reasoning
   *
   * PURPOSE: Explain WHY a context was created
   */
  private async handleReconstructReasoning(args: { snapshotId: string }): Promise<ToolResult> {
    const reasoning = await this.contextService.reconstructReasoning(args.snapshotId);

    return {
      content: [{
        type: "text",
        text: reasoning
      }]
    };
  }

  /**
   * 🎯 LAYER 1 TOOL: build_causal_chain
   *
   * PURPOSE: Trace decision history backwards through time
   */
  private async handleBuildCausalChain(args: { snapshotId: string }): Promise<ToolResult> {
    const chain = await this.contextService.buildCausalChain(args.snapshotId);

    if (chain.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No causal chain found for snapshot: ${args.snapshotId}`
        }]
      };
    }

    const chainText = chain
      .map((node, idx) => {
        const depth = '  '.repeat(idx);
        return `${depth}${idx + 1}. **${node.snapshot.causality?.actionType || 'unknown'}** (${node.snapshot.timestamp})\n${depth}   ${node.snapshot.summary}`;
      })
      .join('\n\n');

    return {
      content: [{
        type: "text",
        text: `Causal Chain (${chain.length} steps):\n\n${chainText}`
      }]
    };
  }

  /**
   * 🎯 LAYER 1 TOOL: get_causality_stats
   *
   * PURPOSE: Analytics on causal relationships
   */
  private async handleGetCausalityStats(args: { project: string }): Promise<ToolResult> {
    const stats = await this.contextService.getCausalityStats(args.project);

    const statsText = `**Causality Statistics for ${args.project}**

📊 **Action Type Distribution:**
${Object.entries(stats.actionTypeCounts)
  .map(([type, count]) => `  - ${type}: ${count}`)
  .join('\n')}

🔗 **Causal Analysis:**
  - Total contexts with causality: ${stats.totalWithCausality}
  - Root causes (no parent): ${stats.rootCauses}
  - Average chain length: ${stats.averageChainLength.toFixed(2)}`;

    return {
      content: [{
        type: "text",
        text: statsText
      }]
    };
  }

  // =============================================================================
  // Layer 2: Memory Manager (Present - HOW)
  // =============================================================================

  /**
   * 🎯 LAYER 2 TOOL: get_memory_stats
   *
   * PURPOSE: View memory tier distribution and access patterns
   */
  private async handleGetMemoryStats(args: { project: string }): Promise<ToolResult> {
    const stats = await this.contextService.getMemoryStats(args.project);

    const statsText = `**Memory Statistics for ${args.project}**

📊 **Memory Tier Distribution:**
  - 🔥 ACTIVE (< 1 hour): ${stats.active}
  - ⚡ RECENT (1-24 hours): ${stats.recent}
  - 📦 ARCHIVED (1-30 days): ${stats.archived}
  - ❄️  EXPIRED (> 30 days): ${stats.expired}

📈 **Total Contexts:** ${stats.total}`;

    return {
      content: [{
        type: "text",
        text: statsText
      }]
    };
  }

  /**
   * 🎯 LAYER 2 TOOL: recalculate_memory_tiers
   *
   * PURPOSE: Update tier classifications based on current time
   */
  private async handleRecalculateMemoryTiers(args: { project?: string }): Promise<ToolResult> {
    const updatedCount = await this.contextService.recalculateMemoryTiers(args.project);

    return {
      content: [{
        type: "text",
        text: `✅ Recalculated memory tiers\n\nUpdated ${updatedCount} context(s)${args.project ? ` for project: ${args.project}` : ' across all projects'}`
      }]
    };
  }

  /**
   * 🎯 LAYER 2 TOOL: prune_expired_contexts
   *
   * PURPOSE: Clean up old, unused contexts
   */
  private async handlePruneExpiredContexts(args: { limit?: number }): Promise<ToolResult> {
    const deletedCount = await this.contextService.pruneExpiredContexts(args.limit);

    return {
      content: [{
        type: "text",
        text: `🗑️ Pruned expired contexts\n\nDeleted ${deletedCount} expired context(s)`
      }]
    };
  }

  // =============================================================================
  // Layer 3: Propagation Engine (Future - WHAT)
  // =============================================================================

  /**
   * 🎯 LAYER 3 TOOL: update_predictions
   *
   * PURPOSE: Refresh prediction scores for a project
   */
  private async handleUpdatePredictions(args: { project: string; staleThreshold?: number }): Promise<ToolResult> {
    const updatedCount = await this.contextService.updatePredictions(args.project, args.staleThreshold);

    return {
      content: [{
        type: "text",
        text: `🔮 Updated predictions for ${args.project}\n\nRefreshed ${updatedCount} prediction(s) (stale threshold: ${args.staleThreshold || 24} hours)`
      }]
    };
  }

  /**
   * 🎯 LAYER 3 TOOL: get_high_value_contexts
   *
   * PURPOSE: Retrieve contexts most likely to be accessed next
   */
  private async handleGetHighValueContexts(args: { project: string; minScore?: number; limit?: number }): Promise<ToolResult> {
    const contexts = await this.contextService.getHighValueContexts(args.project, args.minScore, args.limit);

    if (contexts.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No high-value contexts found for ${args.project} (min score: ${args.minScore || 0.6})`
        }]
      };
    }

    const contextList = contexts
      .map(ctx => {
        const score = ctx.propagation?.predictionScore || 0;
        const reasons = ctx.propagation?.propagationReason.join(', ') || 'none';
        return `**${ctx.project}** (Score: ${score.toFixed(3)})\n${ctx.summary}\nReasons: ${reasons}`;
      })
      .join('\n\n');

    return {
      content: [{
        type: "text",
        text: `🎯 High-Value Contexts (${contexts.length} found):\n\n${contextList}`
      }]
    };
  }

  /**
   * 🎯 LAYER 3 TOOL: get_propagation_stats
   *
   * PURPOSE: Analytics on prediction quality and patterns
   */
  private async handleGetLearningStats(args: { project: string }): Promise<ToolResult> {
    const stats = await this.contextService.getLearningStats(args.project);
    const w = stats.currentWeights;
    const tuned = stats.lastTuned ? new Date(stats.lastTuned).toLocaleString() : 'never';

    const text = `**Meta-Learning Statistics for ${args.project}**

🧠 **Learned Weights** (sample size: ${stats.sampleSize}, last tuned: ${tuned}):
  - Temporal:  ${(w.temporalWeight * 100).toFixed(1)}%
  - Causal:    ${(w.causalWeight * 100).toFixed(1)}%
  - Frequency: ${(w.frequencyWeight * 100).toFixed(1)}%

📊 **Component Averages:**
  - Avg temporal:  ${stats.avgTemporalComponent.toFixed(3)}
  - Avg causal:    ${stats.avgCausalComponent.toFixed(3)}
  - Avg frequency: ${stats.avgFrequencyComponent.toFixed(3)}`;

    return { content: [{ type: "text", text }] };
  }

  private async handleGetPropagationStats(args: { project: string }): Promise<ToolResult> {
    const stats = await this.contextService.getPropagationStats(args.project);

    const reasonsText = Object.entries(stats.reasonFrequency)
      .map(([reason, count]) => `  - ${reason}: ${count}`)
      .join('\n');

    const statsText = `**Propagation Statistics for ${args.project}**

🔮 **Predictions:**
  - Total contexts: ${stats.totalContexts}
  - Contexts predicted: ${stats.totalPredicted}
  - Average prediction score: ${stats.averagePredictionScore.toFixed(3)}

📊 **Prediction Reasons:**
${reasonsText || '  - No predictions yet'}`;

    return {
      content: [{
        type: "text",
        text: statsText
      }]
    };
  }
}
