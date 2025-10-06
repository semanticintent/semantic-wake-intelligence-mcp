/**
 * 🎯 SEMANTIC INTENT: MCP Endpoint Router
 *
 * PURPOSE: Route HTTP requests to appropriate handlers
 *
 * PRESENTATION LAYER RESPONSIBILITY:
 * - HTTP routing logic
 * - Request method handling (GET, POST, OPTIONS)
 * - Delegates to application layer
 * - Minimal logic - pure routing
 */

import type { MCPProtocolHandler } from '../../application/handlers/MCPProtocolHandler';
import { CORSMiddleware } from '../../infrastructure/middleware/CORSMiddleware';

export class MCPRouter {
  constructor(private readonly protocolHandler: MCPProtocolHandler) {}

  async route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    console.log(`Request: ${method} ${pathname}`);

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return CORSMiddleware.handlePreflight();
    }

    // MCP endpoints
    if (this.isMCPEndpoint(pathname)) {
      if (method === 'POST') {
        try {
          const body = await request.json();
          return await this.protocolHandler.handle(body);
        } catch (error) {
          console.error('MCP Error:', error);
          return CORSMiddleware.jsonResponse({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse error" }
          }, 400);
        }
      }

      if (method === 'GET') {
        return new Response('MCP endpoint - use POST for protocol messages', {
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    return new Response('Semantic Context MCP Server is running. Connect via /sse or /mcp endpoint.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  private isMCPEndpoint(pathname: string): boolean {
    return pathname === '/mcp' || pathname === '/sse' ||
           pathname.startsWith('/mcp') || pathname.startsWith('/sse');
  }
}
