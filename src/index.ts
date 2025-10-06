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
    try {
      // LAYER 1: Infrastructure - Technical adapters
      const repository = new D1ContextRepository(env.DB);
      const aiProvider = new CloudflareAIProvider(env.AI);

      // LAYER 2: Domain - Business logic
      const contextService = new ContextService(repository, aiProvider);

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
  }
};
