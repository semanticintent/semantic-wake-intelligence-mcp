/**
 * 🎯 SEMANTIC INTENT: Application Entry Point
 *
 * PURPOSE: Wire dependencies and delegate to router
 *
 * HEXAGONAL ARCHITECTURE:
 * - This is the COMPOSITION ROOT
 * - Manually wires dependencies (Dependency Injection)
 * - Delegates all logic to appropriate layers
 * - Minimal code - just dependency setup
 *
 * BEFORE REFACTORING: 483 lines of mixed concerns
 * AFTER REFACTORING: ~60 lines of dependency wiring
 * REDUCTION: 90% smaller, infinitely more maintainable
 *
 * SEMANTIC PRESERVATION:
 * - All functionality preserved
 * - All semantic intent documented in layer files
 * - Clean architecture principles applied
 */

// Infrastructure Layer
import { D1ContextRepository } from './infrastructure/adapters/D1ContextRepository';
import { CloudflareAIProvider } from './infrastructure/adapters/CloudflareAIProvider';
import { VectorizeRepository } from './infrastructure/adapters/VectorizeRepository';
import { JWKSTokenValidator } from './infrastructure/adapters/JWKSTokenValidator';
import { AuthMiddleware } from './infrastructure/middleware/AuthMiddleware';

// Domain Layer
import { ContextService } from './domain/services/ContextService';

// Application Layer
import { ToolExecutionHandler } from './application/handlers/ToolExecutionHandler';
import { MCPProtocolHandler } from './application/handlers/MCPProtocolHandler';

// Presentation Layer
import { MCPRouter } from './presentation/routes/MCPRouter';

// Types
import type { Env } from './types';

/**
 * Cloudflare Workers entry point.
 *
 * DEPENDENCY WIRING:
 * - Creates infrastructure adapters (D1, AI)
 * - Injects into domain services
 * - Builds handler chain
 * - Delegates to router
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // RFC 9728 Protected Resource Metadata — lets MCP clients auto-discover which
    // authorization server (Signet) protects this resource server, per the current MCP
    // authorization spec's client-discovery expectations. Public, unauthenticated.
    if (request.method === 'GET' && url.pathname === '/.well-known/oauth-protected-resource') {
      return Response.json({
        resource: env.MCP_RESOURCE_IDENTIFIER,
        authorization_servers: [env.SIGNET_ISSUER],
      });
    }

    // Auth check — skip for OPTIONS (CORS preflight)
    if (request.method !== 'OPTIONS') {
      const unauthorized = await this.enforceAuth(request, env);
      if (unauthorized) return unauthorized;
    }

    try {
      // LAYER 1: Infrastructure - Technical adapters
      const repository = new D1ContextRepository(env.DB);
      const aiProvider = new CloudflareAIProvider(env.AI);
      const vectorRepository = new VectorizeRepository(env.VECTORIZE);

      // LAYER 2: Domain - Business logic
      const contextService = new ContextService(repository, aiProvider, vectorRepository);

      // LAYER 3: Application - Orchestration
      const toolHandler = new ToolExecutionHandler(contextService);
      const protocolHandler = new MCPProtocolHandler(toolHandler);

      // LAYER 4: Presentation - Routing
      const router = new MCPRouter(protocolHandler);

      // Delegate to router
      return await router.route(request);

    } catch (error) {
      console.error('Unhandled error:', error);
      return new Response('Internal server error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },

  /**
   * 🎯 SEMANTIC INTENT: Bearer Token Enforcement (Signet cutover)
   *
   * AUTH_MODE gates between the legacy static-secret check and real Signet-issued JWT
   * verification, giving a safe rollback window during cutover. Remove this branch (and
   * MCP_SECRET/AUTH_MODE from Env) once the JWT path is validated in production.
   *
   * @returns the 401 Response to send if unauthorized, or null if the request may proceed
   */
  async enforceAuth(request: Request, env: Env): Promise<Response | null> {
    if (env.AUTH_MODE === 'legacy_secret') {
      const auth = request.headers.get('Authorization');
      if (!env.MCP_SECRET || auth !== `Bearer ${env.MCP_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
      }
      return null;
    }

    const tokenValidator = new JWKSTokenValidator(`${env.SIGNET_ISSUER}/.well-known/jwks.json`, env.SIGNET_ISSUER);
    const authMiddleware = new AuthMiddleware(tokenValidator);
    return authMiddleware.enforce(request, env.MCP_RESOURCE_IDENTIFIER);
  },

  /**
   * 🎯 WAKE INTELLIGENCE: Scheduled cron handler — Layer 3 prediction refresh
   *
   * PURPOSE: Proactively refresh stale predictions across all projects
   * so they are ready when agents request them, not computed on-demand.
   *
   * TRIGGER: Configured in wrangler.jsonc under triggers.crons
   * CADENCE: Every 6 hours (recommended: "0 *\/6 * * *")
   */
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    try {
      const repository = new D1ContextRepository(env.DB);
      const aiProvider = new CloudflareAIProvider(env.AI);
      const vectorRepository = new VectorizeRepository(env.VECTORIZE);
      const contextService = new ContextService(repository, aiProvider, vectorRepository);

      const updated = await contextService.refreshStalePredictions();
      console.log(`[cron] Refreshed ${updated} stale predictions`);
    } catch (error) {
      console.error('[cron] Failed to refresh stale predictions:', error);
    }
  },
};
