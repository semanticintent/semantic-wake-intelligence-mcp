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
}
