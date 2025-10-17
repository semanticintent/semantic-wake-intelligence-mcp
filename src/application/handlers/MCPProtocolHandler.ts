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
        metadata: { type: "object", description: "Additional metadata" }
      },
      required: ["project", "content"]
    }
  },
  {
    name: "load_context",
    description: "Load relevant context for a project",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project identifier" },
        limit: { type: "number", description: "Maximum contexts to return", default: 1 }
      },
      required: ["project"]
    }
  },
  {
    name: "search_context",
    description: "Search contexts using keyword matching",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        project: { type: "string", description: "Project to search within" }
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
