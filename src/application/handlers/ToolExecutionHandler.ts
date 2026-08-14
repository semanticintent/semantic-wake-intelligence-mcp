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
import type { TaskService } from '../../domain/services/TaskService';
import type { ToolResult, SaveContextInput, LoadContextInput, SearchContextInput, IngestRuneManifestInput, CreateTaskInput, GetTasksInput, CompleteTaskInput, FailTaskInput } from '../../types';
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
  constructor(
    private readonly contextService: ContextService,
    private readonly taskService: TaskService
  ) {}

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

      case 'reindex_project':
        return this.handleReindexProject(args as { project: string });

      case 'get_cross_project_dependents':
        return this.handleGetCrossProjectDependents(args as { snapshotId: string });

      // v3.5.0: Observability + Rune Integration
      case 'get_causal_graph':
        return this.handleGetCausalGraph(args as { project: string; limit?: number });

      case 'get_memory_health':
        return this.handleGetMemoryHealth(args as { project: string });

      case 'ingest_rune_manifest':
        return this.handleIngestRuneManifest(args as IngestRuneManifestInput);

      case 'admin_reindex_all':
        return this.handleAdminReindexAll();

      // Agent Task Coordination (v3.7.0)
      case 'create_task':
        return this.handleCreateTask(args as CreateTaskInput);

      case 'claim_task':
        return this.handleClaimTask(args as { agent: string });

      case 'get_tasks':
        return this.handleGetTasks(args as GetTasksInput);

      case 'complete_task':
        return this.handleCompleteTask(args as CompleteTaskInput);

      case 'fail_task':
        return this.handleFailTask(args as FailTaskInput);

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
    const mode = input.personality_mode ?? 'historian';

    if (snapshots.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No context found for project: ${input.project}`
        }]
      };
    }

    if (mode === 'minimalist') {
      return {
        content: [{
          type: "text",
          text: snapshots.map(ctx => ctx.summary).join('\n\n')
        }]
      };
    }

    let header: string;
    let contextList: string;

    if (mode === 'prophet') {
      header = `Prophet Mode — Predicted priorities for \`${input.project}\``;
      contextList = snapshots.map(ctx => {
        const score = ctx.propagation?.predictionScore?.toFixed(2) ?? 'unscored';
        const reasons = ctx.propagation?.propagationReason?.join(', ') ?? 'none';
        const next = ctx.propagation?.predictedNextAccess ?? 'unknown';
        return `**Prediction score: ${score}** (${reasons})\n${ctx.summary}\nPredicted next access: ${next}`;
      }).join('\n\n');
    } else if (mode === 'archaeologist') {
      header = `Archaeologist Mode — Dormant threads for \`${input.project}\``;
      contextList = snapshots.map(ctx => {
        const dormant = ctx.lastAccessed ? `last accessed ${ctx.lastAccessed}` : 'never accessed';
        return `**${ctx.timestamp}** · ${dormant} · tier: ${ctx.memoryTier}\n${ctx.summary}\nTags: ${ctx.tags}`;
      }).join('\n\n');
    } else if (mode === 'auditor') {
      header = `Auditor Mode — Authorship breakdown for \`${input.project}\``;
      const groups: Record<string, typeof snapshots> = { human: [], 'ai-agent': [], 'ai-compositor': [], unattributed: [] };
      for (const ctx of snapshots) {
        let authorType = 'unattributed';
        if (ctx.metadata) {
          try {
            const meta = JSON.parse(ctx.metadata) as Record<string, unknown>;
            if (typeof meta.authorType === 'string') authorType = meta.authorType;
          } catch { /* ignore */ }
        }
        (groups[authorType] ?? groups.unattributed).push(ctx);
      }
      const labels: Record<string, string> = { human: '👤 Human', 'ai-agent': '🤖 AI Agent', 'ai-compositor': '🎼 AI Compositor', unattributed: '❓ Unattributed' };
      contextList = Object.entries(groups)
        .filter(([, ctxs]) => ctxs.length > 0)
        .map(([type, ctxs]) => {
          const items = ctxs.map(ctx => `  - **${ctx.timestamp}** · ${ctx.summary}`).join('\n');
          return `**${labels[type] ?? type}** (${ctxs.length})\n${items}`;
        })
        .join('\n\n');
    } else {
      header = `Historian Mode — Decision history for \`${input.project}\``;
      contextList = snapshots.map(ctx => {
        const causality = ctx.causality
          ? `\nAction: ${ctx.causality.actionType} — ${ctx.causality.rationale}`
          : '';
        return `**${ctx.timestamp}** · tier: ${ctx.memoryTier}${causality}\n${ctx.summary}\nTags: ${ctx.tags}`;
      }).join('\n\n');
    }

    return {
      content: [{
        type: "text",
        text: `Found ${snapshots.length} context(s):\n\n${header}\n\n${contextList}`
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
    const mode = input.personality_mode ?? 'historian';

    if (snapshots.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No contexts found matching: "${input.query}"`
        }]
      };
    }

    if (mode === 'minimalist') {
      return {
        content: [{
          type: "text",
          text: snapshots.map(ctx => ctx.summary).join('\n\n')
        }]
      };
    }

    let header: string;
    let searchList: string;

    if (mode === 'prophet') {
      header = `Prophet Mode — Predicted priorities matching "${input.query}"`;
      searchList = snapshots.map(ctx => {
        const score = ctx.propagation?.predictionScore?.toFixed(2) ?? 'unscored';
        return `**Score: ${score}** · \`${ctx.project}\` (${ctx.timestamp})\n${ctx.summary}`;
      }).join('\n\n');
    } else if (mode === 'archaeologist') {
      header = `Archaeologist Mode — Dormant matches for "${input.query}"`;
      searchList = snapshots.map(ctx => {
        const dormant = ctx.lastAccessed ? `last accessed ${ctx.lastAccessed}` : 'never accessed';
        return `**\`${ctx.project}\`** · ${dormant}\n${ctx.summary}`;
      }).join('\n\n');
    } else if (mode === 'auditor') {
      header = `Auditor Mode — Authorship breakdown for "${input.query}"`;
      const groups: Record<string, typeof snapshots> = { human: [], 'ai-agent': [], 'ai-compositor': [], unattributed: [] };
      for (const ctx of snapshots) {
        let authorType = 'unattributed';
        if (ctx.metadata) {
          try {
            const meta = JSON.parse(ctx.metadata) as Record<string, unknown>;
            if (typeof meta.authorType === 'string') authorType = meta.authorType;
          } catch { /* ignore */ }
        }
        (groups[authorType] ?? groups.unattributed).push(ctx);
      }
      const labels: Record<string, string> = { human: '👤 Human', 'ai-agent': '🤖 AI Agent', 'ai-compositor': '🎼 AI Compositor', unattributed: '❓ Unattributed' };
      searchList = Object.entries(groups)
        .filter(([, ctxs]) => ctxs.length > 0)
        .map(([type, ctxs]) => {
          const items = ctxs.map(ctx => `  - **${ctx.project}** (${ctx.timestamp}) · ${ctx.summary}`).join('\n');
          return `**${labels[type] ?? type}** (${ctxs.length})\n${items}`;
        })
        .join('\n\n');
    } else {
      header = `Historian Mode — Results for "${input.query}"`;
      searchList = snapshots
        .map(ctx => `**${ctx.project}** (${ctx.timestamp})\n${ctx.summary}\nTags: ${ctx.tags}`)
        .join('\n\n');
    }

    return {
      content: [{
        type: "text",
        text: `Found ${snapshots.length} context(s):\n\n${header}\n\n${searchList}`
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

  private async handleReindexProject(args: { project: string }): Promise<ToolResult> {
    const count = await this.contextService.reindexProject(args.project);
    return {
      content: [{
        type: "text",
        text: count > 0
          ? `Reindexed ${count} contexts for project "${args.project}" — semantic search now covers all existing snapshots.`
          : `No contexts reindexed for "${args.project}". Either no contexts exist or the vector index is not configured.`
      }]
    };
  }

  private async handleGetCrossProjectDependents(args: { snapshotId: string }): Promise<ToolResult> {
    const dependents = await this.contextService.getDownstreamDependents(args.snapshotId);

    if (dependents.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No downstream dependents found for snapshot: ${args.snapshotId}`
        }]
      };
    }

    const list = dependents
      .map(ctx => `**${ctx.project}** (${ctx.timestamp})\n${ctx.summary}\nID: ${ctx.id}`)
      .join('\n\n');

    return {
      content: [{
        type: "text",
        text: `Found ${dependents.length} downstream dependent(s):\n\n${list}`
      }]
    };
  }

  // =============================================================================
  // v3.5.0: Observability + Rune Integration
  // =============================================================================

  private async handleGetCausalGraph(args: { project: string; limit?: number }): Promise<ToolResult> {
    const graph = await this.contextService.getCausalGraph(args.project, args.limit);

    if (graph.nodeCount === 0) {
      return { content: [{ type: "text", text: `No contexts found for project: ${args.project}` }] };
    }

    const nodeList = graph.nodes
      .map(n => `  ${n.id.slice(0, 8)} | ${n.actionType.padEnd(12)} | ${n.memoryTier.padEnd(8)} | ${n.summary.slice(0, 60)}`)
      .join('\n');

    const edgeList = graph.edges.length > 0
      ? graph.edges.map(e => `  ${e.from.slice(0, 8)} → ${e.to.slice(0, 8)} (${e.type})`).join('\n')
      : '  No edges (no causal relationships recorded)';

    return {
      content: [{
        type: "text",
        text: `**Causal Graph for \`${args.project}\`**\n\n📊 ${graph.nodeCount} nodes · ${graph.edgeCount} edges\n\n**Nodes:**\n${nodeList}\n\n**Edges:**\n${edgeList}`
      }]
    };
  }

  private async handleGetMemoryHealth(args: { project: string }): Promise<ToolResult> {
    const health = await this.contextService.getMemoryHealth(args.project);
    const m = health.memory;
    const c = health.causality;
    const p = health.propagation;
    const l = health.learning;
    const tuned = l.lastTuned ? new Date(l.lastTuned).toLocaleString() : 'never';

    const text = `**Memory Health Report — \`${health.project}\`**
Generated: ${health.generatedAt}

🗂️ **Memory Tiers** (total: ${m.total})
  🔥 ACTIVE  (< 1h):    ${m.active}
  ⚡ RECENT  (1-24h):   ${m.recent}
  📦 ARCHIVED (1-30d):  ${m.archived}
  ❄️  EXPIRED (> 30d):  ${m.expired}

🔗 **Causality** (Layer 1)
  Contexts with causality: ${c.totalWithCausality}
  Root causes:             ${c.rootCauses}
  Avg chain length:        ${c.averageChainLength.toFixed(2)}

🔮 **Predictions** (Layer 3)
  Total contexts:          ${p.totalContexts}
  Predicted:               ${p.totalPredicted}
  Avg prediction score:    ${p.averagePredictionScore.toFixed(3)}

🧠 **Meta-Learning** (Layer 4 — sample: ${l.sampleSize}, tuned: ${tuned})
  Temporal:  ${(l.weights.temporal * 100).toFixed(1)}%
  Causal:    ${(l.weights.causal * 100).toFixed(1)}%
  Frequency: ${(l.weights.frequency * 100).toFixed(1)}%`;

    return { content: [{ type: "text", text }] };
  }

  private async handleIngestRuneManifest(input: IngestRuneManifestInput): Promise<ToolResult> {
    const result = await this.contextService.ingestRuneManifest(input);

    if (result.ingested === 0) {
      return {
        content: [{
          type: "text",
          text: `No bindings ingested from manifest (${result.skipped} skipped — no intent annotations found)`
        }]
      };
    }

    const bindingList = result.bindings.map(b => `  - ${b}`).join('\n');

    return {
      content: [{
        type: "text",
        text: `**Rune Manifest Ingested → \`${input.project}\`**\n\n✅ ${result.ingested} binding(s) saved as Wake contexts\n⏭️  ${result.skipped} binding(s) skipped (no intent)\n\n**Ingested bindings:**\n${bindingList}`
      }]
    };
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

  private async handleAdminReindexAll(): Promise<ToolResult> {
    const result = await this.contextService.reindexAll();
    if (result.total === 0) {
      return {
        content: [{
          type: "text",
          text: "No contexts reindexed. Either no contexts exist or the vector index is not configured."
        }]
      };
    }
    const breakdown = Object.entries(result.byProject)
      .map(([project, count]) => `  - ${project}: ${count}`)
      .join('\n');
    return {
      content: [{
        type: "text",
        text: `Reindexed ${result.total} contexts across all projects — semantic search now covers all historical snapshots.\n\n**By project:**\n${breakdown}`
      }]
    };
  }

  // ─── Agent Task Coordination (v3.7.0) ───────────────────────────────────────

  private async handleCreateTask(input: CreateTaskInput): Promise<ToolResult> {
    const task = await this.taskService.createTask(input);
    const assignee = task.assignedTo ? ` → assigned to ${task.assignedTo}` : ' → open to any agent';
    return {
      content: [{
        type: "text",
        text: `Task created!\nID: ${task.id}\nProject: ${task.project}\nObjective: ${task.objective}\nStatus: ${task.status}${assignee}${task.sourceContextId ? `\nSource context: ${task.sourceContextId}` : ''}`
      }]
    };
  }

  private async handleClaimTask(input: { agent: string }): Promise<ToolResult> {
    const task = await this.taskService.claimNextTask(input.agent);
    if (!task) {
      return {
        content: [{ type: "text", text: "No tasks available to claim." }]
      };
    }
    return {
      content: [{
        type: "text",
        text: `Task claimed!\nID: ${task.id}\nProject: ${task.project}\nObjective: ${task.objective}\nClaimed by: ${task.assignedTo}\nClaimed at: ${task.claimedAt}${task.sourceContextId ? `\nSource context: ${task.sourceContextId}` : ''}`
      }]
    };
  }

  private async handleGetTasks(input: GetTasksInput): Promise<ToolResult> {
    const tasks = await this.taskService.getTasks(input);
    if (tasks.length === 0) {
      return {
        content: [{ type: "text", text: "No tasks found matching the given filters." }]
      };
    }
    const lines = tasks.map(t => {
      const assignee = t.assignedTo ? ` | assignedTo: ${t.assignedTo}` : '';
      const results = t.resultContextIds.length > 0 ? ` | results: [${t.resultContextIds.join(', ')}]` : '';
      return `- [${t.status.toUpperCase()}] ${t.id} | ${t.project} | ${t.objective}${assignee}${results}`;
    });
    return {
      content: [{
        type: "text",
        text: `Found ${tasks.length} task(s):\n${lines.join('\n')}`
      }]
    };
  }

  private async handleCompleteTask(input: CompleteTaskInput): Promise<ToolResult> {
    const contextIds = input.resultContextIds ?? [];
    await this.taskService.completeTask(input.taskId, contextIds);
    const linked = contextIds.length > 0
      ? `\nLinked context(s): ${contextIds.join(', ')}`
      : '';
    return {
      content: [{
        type: "text",
        text: `Task ${input.taskId} marked completed.${linked}`
      }]
    };
  }

  private async handleFailTask(input: FailTaskInput): Promise<ToolResult> {
    await this.taskService.failTask(input.taskId, input.reason);
    return {
      content: [{
        type: "text",
        text: `Task ${input.taskId} marked failed.\nReason: ${input.reason}`
      }]
    };
  }
}
