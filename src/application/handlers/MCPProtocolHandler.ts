/**
 * 🎯 SEMANTIC INTENT: MCP Protocol Message Handler
 *
 * PURPOSE: Handle MCP/JSON-RPC protocol semantics
 *
 * APPLICATION RESPONSIBILITY:
 * - Parse and validate MCP requests
 * - Dispatch to appropriate handlers
 * - Format responses per MCP specification
 * - Maintain protocol compliance
 */

import type { ToolExecutionHandler } from './ToolExecutionHandler';
import { CORSMiddleware } from '../../infrastructure/middleware/CORSMiddleware';

// MCP tool definitions
const TOOL_DEFINITIONS = [
  {
    name: "save_context",
    description: "Save conversation context with AI enhancement",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" },
        content: { type: "string", description: "Context content to save" },
        source: { type: "string", description: "Source of the context", default: "mcp" },
        metadata: { type: "object", description: "Additional metadata" },
        crossProject: { type: "boolean", description: "Include recent contexts from ALL projects when detecting dependencies (default: false)" },
        authorType: { type: "string", enum: ["human", "ai-agent", "ai-compositor"], description: "Author type for governance attribution (stored in metadata.authorType)" }
      },
      required: ["project", "content"]
    }
  },
  {
    name: "load_context",
    description: "Load relevant context for a project. Use personality_mode to shape retrieval: historian (default, newest-first with causality), prophet (ranked by prediction score), archaeologist (most-dormant first), minimalist (raw summaries only).",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" },
        limit: { type: "number", description: "Maximum contexts to return", default: 1 },
        personality_mode: {
          type: "string",
          enum: ["historian", "prophet", "archaeologist", "minimalist", "auditor"],
          description: "Temporal posture: historian=causal+timestamps, prophet=prediction-ranked, archaeologist=dormant-first, minimalist=raw",
          default: "historian"
        }
      },
      required: ["project"]
    }
  },
  {
    name: "search_context",
    description: "Search contexts by keyword or semantic query. Use personality_mode to re-rank results: historian (default), prophet (prediction-score ranked), archaeologist (least-recently-accessed first), minimalist (raw summaries).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        project: { type: "string", description: "Project to search within" },
        personality_mode: {
          type: "string",
          enum: ["historian", "prophet", "archaeologist", "minimalist", "auditor"],
          description: "Temporal posture shaping result ranking and presentation",
          default: "historian"
        }
      },
      required: ["query"]
    }
  },
  // Layer 1: Causality Engine (Past - WHY)
  {
    name: "reconstruct_reasoning",
    description: "Explain WHY a context was created by reconstructing the reasoning chain",
    inputSchema: {
      type: "object",
      properties: {
        snapshotId: { type: "string", description: "ID of the context snapshot to analyze" }
      },
      required: ["snapshotId"]
    }
  },
  {
    name: "build_causal_chain",
    description: "Trace decision history backwards through time to see how contexts influenced each other",
    inputSchema: {
      type: "object",
      properties: {
        snapshotId: { type: "string", description: "Starting snapshot ID to trace backwards from" }
      },
      required: ["snapshotId"]
    }
  },
  {
    name: "get_causality_stats",
    description: "Get analytics on causal relationships for a project",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" }
      },
      required: ["project"]
    }
  },
  // Layer 2: Memory Manager (Present - HOW)
  {
    name: "get_memory_stats",
    description: "View memory tier distribution and access patterns for a project",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" }
      },
      required: ["project"]
    }
  },
  {
    name: "recalculate_memory_tiers",
    description: "Update tier classifications based on current time",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project to recalculate (optional, processes all if omitted)" }
      },
      required: []
    }
  },
  {
    name: "prune_expired_contexts",
    description: "Clean up old, unused contexts that have expired",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum number of contexts to prune (optional)" }
      },
      required: []
    }
  },
  // Layer 3: Propagation Engine (Future - WHAT)
  {
    name: "update_predictions",
    description: "Refresh prediction scores for a project's contexts",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" },
        staleThreshold: { type: "number", description: "Hours threshold for stale predictions (default: 24)" }
      },
      required: ["project"]
    }
  },
  {
    name: "get_high_value_contexts",
    description: "Retrieve contexts most likely to be accessed next (predicted high-value)",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" },
        minScore: { type: "number", description: "Minimum prediction score (default: 0.6)" },
        limit: { type: "number", description: "Maximum contexts to return (default: 5)" }
      },
      required: ["project"]
    }
  },
  {
    name: "get_propagation_stats",
    description: "Get analytics on prediction quality and patterns for a project",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" }
      },
      required: ["project"]
    }
  },
  {
    name: "get_learning_stats",
    description: "Get Layer 4 meta-learning stats: learned weights per dimension and component averages",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" }
      },
      required: ["project"]
    }
  },
  {
    name: "reindex_project",
    description: "Backfill semantic embeddings for all existing contexts in a project — run once to enable semantic search on historical snapshots",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" }
      },
      required: ["project"]
    }
  },
  // v3.5.0: Observability + Rune Integration
  {
    name: "get_causal_graph",
    description: "Get the full causal network for a project as nodes and edges — suitable for D3/Mermaid graph visualization",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" },
        limit: { type: "number", description: "Maximum contexts to include (default: 200)" }
      },
      required: ["project"]
    }
  },
  {
    name: "get_memory_health",
    description: "Get a consolidated health report for a project — all 5 layers (tiers, causality, predictions, learning) in one call",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" }
      },
      required: ["project"]
    }
  },
  {
    name: "ingest_rune_manifest",
    description: "Import a rune.schema.json manifest — saves each binding intent annotation as a Wake context, connecting Rune governance to Wake causal memory",
    inputSchema: {
      type: "object",
      properties: {
        manifest: { type: "string", description: "JSON string of a rune.schema.json manifest" },
        project: { type: "string", description: "Project to save contexts under" },
        source: { type: "string", description: "Source label (default: rune-manifest)" }
      },
      required: ["manifest", "project"]
    }
  },
  // Cross-project causality
  {
    name: "get_cross_project_dependents",
    description: "Find all contexts across any project that were caused by (directly or transitively) a given context snapshot",
    inputSchema: {
      type: "object",
      properties: {
        snapshotId: { type: "string", description: "ID of the root context snapshot" }
      },
      required: ["snapshotId"]
    }
  }
];

export class MCPProtocolHandler {
  constructor(private readonly toolHandler: ToolExecutionHandler) {}

  async handle(body: any): Promise<Response> {
    console.log('MCP Request:', JSON.stringify(body, null, 2));

    switch (body.method) {
      case 'initialize':
        return this.handleInitialize(body);
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return this.handleNotification();
      case 'tools/list':
        return this.handleToolsList(body);
      case 'tools/call':
        return this.handleToolsCall(body);
      default:
        return this.handleMethodNotFound(body);
    }
  }

  private handleInitialize(request: any): Response {
    return CORSMiddleware.jsonResponse({
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: {
          name: "Semantic Context MCP",
          version: "1.0.0"
        }
      }
    });
  }

  private handleNotification(): Response {
    return new Response('', { status: 204 });
  }

  private handleToolsList(request: any): Response {
    return CORSMiddleware.jsonResponse({
      jsonrpc: "2.0",
      id: request.id,
      result: { tools: TOOL_DEFINITIONS }
    });
  }

  private async handleToolsCall(request: any): Promise<Response> {
    try {
      const { name, arguments: args } = request.params;
      const result = await this.toolHandler.execute(name, args);

      return CORSMiddleware.jsonResponse({
        jsonrpc: "2.0",
        id: request.id,
        result
      });
    } catch (error: any) {
      return CORSMiddleware.jsonResponse({
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32000,
          message: error.message
        }
      }, 500);
    }
  }

  private handleMethodNotFound(request: any): Response {
    return CORSMiddleware.jsonResponse({
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: -32601,
        message: `Method not found: ${request.method}`
      }
    }, 400);
  }
}
