/**
 * 🎯 SEMANTIC INTENT: Unit tests for MCPRouter
 *
 * PURPOSE: Verify HTTP routing and request handling
 *
 * TEST STRATEGY:
 * - Mock MCPProtocolHandler
 * - Test routing logic (GET, POST, OPTIONS)
 * - Test CORS handling
 * - Test error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPRouter } from './MCPRouter';
import type { MCPProtocolHandler } from '../../application/handlers/MCPProtocolHandler';

// Mock MCPProtocolHandler
class MockMCPProtocolHandler {
  handle = vi.fn();
}

describe('MCPRouter', () => {
  let router: MCPRouter;
  let mockHandler: MockMCPProtocolHandler;

  beforeEach(() => {
    mockHandler = new MockMCPProtocolHandler();
    router = new MCPRouter(mockHandler as unknown as MCPProtocolHandler);
  });

  describe('OPTIONS requests (CORS preflight)', () => {
    it('should handle OPTIONS request with CORS headers', async () => {
      // Arrange
      const request = new Request('http://localhost/mcp', { method: 'OPTIONS' });

      // Act
      const response = await router.route(request);

      // Assert
      expect(response.status).toBe(200); // CORSMiddleware returns 200
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('GET requests', () => {
    it('should return info message for GET on MCP endpoint', async () => {
      // Arrange
      const request = new Request('http://localhost/mcp', { method: 'GET' });

      // Act
      const response = await router.route(request);

      // Assert
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('MCP endpoint');
      expect(text).toContain('use POST');
    });

    it('should return server status for GET on root', async () => {
      // Arrange
      const request = new Request('http://localhost/', { method: 'GET' });

      // Act
      const response = await router.route(request);

      // Assert
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('Semantic Context MCP Server is running');
    });
  });

  describe('POST requests to MCP endpoints', () => {
    it('should delegate valid JSON-RPC to protocol handler', async () => {
      // Arrange
      const mcpRequest = {
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: {}
      };

      const mockResponse = new Response(JSON.stringify({
        jsonrpc: "2.0",
        result: {},
        id: 1
      }));

      mockHandler.handle.mockResolvedValue(mockResponse);

      const request = new Request('http://localhost/mcp', {
        method: 'POST',
        body: JSON.stringify(mcpRequest),
        headers: { 'Content-Type': 'application/json' }
      });

      // Act
      const response = await router.route(request);

      // Assert
      expect(mockHandler.handle).toHaveBeenCalledWith(mcpRequest);
      expect(response).toBe(mockResponse);
    });

    it('should handle /sse endpoint', async () => {
      // Arrange
      const mcpRequest = { jsonrpc: "2.0", method: "tools/list", id: 2 };
      const mockResponse = new Response('{}');
      mockHandler.handle.mockResolvedValue(mockResponse);

      const request = new Request('http://localhost/sse', {
        method: 'POST',
        body: JSON.stringify(mcpRequest)
      });

      // Act
      const response = await router.route(request);

      // Assert
      expect(mockHandler.handle).toHaveBeenCalledWith(mcpRequest);
    });

    it('should handle /mcp/* sub-paths', async () => {
      // Arrange
      const mcpRequest = { jsonrpc: "2.0", method: "test", id: 3 };
      const mockResponse = new Response('{}');
      mockHandler.handle.mockResolvedValue(mockResponse);

      const request = new Request('http://localhost/mcp/v1', {
        method: 'POST',
        body: JSON.stringify(mcpRequest)
      });

      // Act
      const response = await router.route(request);

      // Assert
      expect(mockHandler.handle).toHaveBeenCalledWith(mcpRequest);
    });
  });

  describe('Error handling', () => {
    it('should return 400 for invalid JSON', async () => {
      // Arrange
      const request = new Request('http://localhost/mcp', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' }
      });

      // Act
      const response = await router.route(request);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe(-32700); // Parse error
      expect(json.error.message).toBe('Parse error');
    });

    it('should log errors to console', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = new Request('http://localhost/mcp', {
        method: 'POST',
        body: 'bad json'
      });

      // Act
      await router.route(request);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('MCP Error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should catch and return 400 for handler errors', async () => {
      // Arrange
      const mcpRequest = { jsonrpc: "2.0", method: "test", id: 1 };
      mockHandler.handle.mockRejectedValue(new Error('Handler error'));

      const request = new Request('http://localhost/mcp', {
        method: 'POST',
        body: JSON.stringify(mcpRequest)
      });

      // Act
      const response = await router.route(request);

      // Assert - Router catches errors in try-catch and returns 400
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBeDefined();
    });
  });

  describe('Endpoint detection', () => {
    it('should recognize /mcp as MCP endpoint', async () => {
      const request = new Request('http://localhost/mcp', {
        method: 'POST',
        body: JSON.stringify({ jsonrpc: "2.0", method: "test", id: 1 })
      });

      mockHandler.handle.mockResolvedValue(new Response('{}'));

      await router.route(request);

      expect(mockHandler.handle).toHaveBeenCalled();
    });

    it('should recognize /sse as MCP endpoint', async () => {
      const request = new Request('http://localhost/sse', {
        method: 'POST',
        body: JSON.stringify({ jsonrpc: "2.0", method: "test", id: 1 })
      });

      mockHandler.handle.mockResolvedValue(new Response('{}'));

      await router.route(request);

      expect(mockHandler.handle).toHaveBeenCalled();
    });

    it('should not treat /other as MCP endpoint', async () => {
      const request = new Request('http://localhost/other', { method: 'GET' });

      const response = await router.route(request);
      const text = await response.text();

      expect(text).toContain('Semantic Context MCP Server is running');
      expect(mockHandler.handle).not.toHaveBeenCalled();
    });
  });
});
