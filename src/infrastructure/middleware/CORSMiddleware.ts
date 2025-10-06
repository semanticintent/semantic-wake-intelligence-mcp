/**
 * 🎯 SEMANTIC INTENT: CORS Policy Enforcement Middleware
 *
 * PURPOSE: Apply consistent Cross-Origin Resource Sharing headers
 *
 * CROSS-CUTTING CONCERN:
 * - Applies to all HTTP responses
 * - Handles OPTIONS preflight requests
 * - Centralizes CORS policy in one place
 *
 * SEMANTIC ANCHORING:
 * - WHAT: CORS headers for browser security
 * - WHY: Enable web clients to call MCP server
 * - HOW: Middleware pattern for reusability
 *
 * ELIMINATES DUPLICATION:
 * - Before: CORS headers repeated 10+ times in index.ts
 * - After: Single source of truth for CORS policy
 */

/**
 * Centralized CORS middleware for MCP server.
 *
 * POLICY:
 * - Allow all origins (*)
 * - Allow GET, POST, OPTIONS methods
 * - Allow Content-Type header
 * - Cache preflight for 24 hours
 */
export class CORSMiddleware {
  /**
   * Standard CORS headers for all responses
   */
  static readonly headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  /**
   * 🎯 SEMANTIC INTENT: Add CORS headers to response
   *
   * @param response - Original response
   * @returns Response with CORS headers added
   */
  static addHeaders(response: Response): Response {
    const headers = new Headers(response.headers);

    for (const [key, value] of Object.entries(this.headers)) {
      headers.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  /**
   * 🎯 SEMANTIC INTENT: Handle OPTIONS preflight request
   *
   * PURPOSE: Respond to browser CORS preflight checks
   *
   * @returns 200 response with CORS headers and cache directive
   */
  static handlePreflight(): Response {
    return new Response(null, {
      status: 200,
      headers: {
        ...this.headers,
        'Access-Control-Max-Age': '86400' // Cache for 24 hours
      }
    });
  }

  /**
   * 🎯 SEMANTIC INTENT: Create JSON response with CORS
   *
   * Helper for creating JSON responses with automatic CORS headers.
   *
   * @param data - Data to serialize as JSON
   * @param status - HTTP status code (default: 200)
   * @returns Response with JSON body and CORS headers
   */
  static jsonResponse(data: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        ...this.headers,
        'Content-Type': 'application/json'
      }
    });
  }
}
