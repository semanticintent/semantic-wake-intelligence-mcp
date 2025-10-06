# Domain-Driven Hexagonal Architecture Refactoring Plan

## 🎯 Semantic Intent

Transform monolithic implementation into layered architecture that preserves semantic intent while improving maintainability, testability, and scalability.

---

## 📊 Current State Analysis

### **Current Structure:**
```
src/
├── index.ts (483 lines)  ❌ Monolithic - All concerns mixed
└── types.ts (159 lines)  ✅ Type definitions
```

### **Current Concerns in index.ts:**
1. **Protocol Handling** (MCP/JSON-RPC) - Lines 1-150
2. **Routing Logic** (method dispatch) - Lines 150-260
3. **AI Services** (summarization, tagging) - Lines 26-86
4. **Business Logic** (tool operations) - Lines 260-400
5. **Database Operations** (D1 queries) - Lines 280-370
6. **Response Formatting** (JSON construction) - Throughout
7. **CORS/Middleware** (headers) - Throughout

### **Problems:**
- ❌ **Difficult to test** - Cannot test business logic without mocking entire request/response
- ❌ **Hard to maintain** - Changes ripple across multiple concerns
- ❌ **No clear boundaries** - Domain logic mixed with infrastructure
- ❌ **Duplication** - CORS headers repeated 10+ times
- ❌ **Tight coupling** - Cannot swap D1 for another database easily

---

## 🏗️ Target Architecture

### **Hexagonal (Ports & Adapters) Pattern with DDD Layers**

```
src/
├── index.ts                          # 🚪 Entry Point (~50 lines)
│
├── domain/                           # 🎯 SEMANTIC DOMAIN LAYER
│   ├── models/
│   │   ├── ContextSnapshot.ts        # Domain entity with business rules
│   │   └── ToolResult.ts             # Value objects
│   │
│   └── services/
│       ├── ContextService.ts         # Core business logic
│       └── AIEnhancementService.ts   # AI semantic operations
│
├── application/                      # 📋 APPLICATION LAYER
│   ├── ports/
│   │   ├── IContextRepository.ts     # Port: Database contract
│   │   └── IAIProvider.ts            # Port: AI service contract
│   │
│   ├── handlers/
│   │   ├── MCPProtocolHandler.ts     # MCP protocol orchestration
│   │   └── ToolExecutionHandler.ts   # Tool dispatch & execution
│   │
│   └── dto/
│       ├── SaveContextDTO.ts         # Data transfer objects
│       ├── LoadContextDTO.ts
│       └── SearchContextDTO.ts
│
├── infrastructure/                   # 🔧 INFRASTRUCTURE LAYER
│   ├── adapters/
│   │   ├── D1ContextRepository.ts    # Adapter: D1 implementation
│   │   └── CloudflareAIProvider.ts   # Adapter: CF AI implementation
│   │
│   └── middleware/
│       ├── CORSMiddleware.ts         # CORS headers
│       └── ErrorHandler.ts           # Error transformation
│
├── presentation/                     # 🎨 PRESENTATION LAYER
│   ├── routes/
│   │   └── MCPRouter.ts              # Route definitions
│   │
│   └── formatters/
│       └── JSONRPCFormatter.ts       # Response formatting
│
├── types.ts                          # ✅ Shared types (existing)
│
└── utils/
    ├── logger.ts                     # Logging utility
    └── validation.ts                 # Input validation
```

---

## 📋 Implementation Plan

### **Phase 1: Foundation Setup** (No Breaking Changes)
**Goal:** Create structure without modifying existing functionality

#### **Step 1.1: Create Directory Structure**
```bash
mkdir -p src/{domain/{models,services},application/{ports,handlers,dto},infrastructure/{adapters,middleware},presentation/{routes,formatters},utils}
```

**Files to create:**
- Domain: 4 files
- Application: 7 files
- Infrastructure: 4 files
- Presentation: 2 files
- Utils: 2 files

**Total:** 19 new files

---

#### **Step 1.2: Define Ports (Interfaces)**
**Purpose:** Establish contracts before implementation

**Files:**
1. `application/ports/IContextRepository.ts`
   ```typescript
   // Semantic contract for context persistence
   export interface IContextRepository {
     save(snapshot: ContextSnapshot): Promise<string>;
     findByProject(project: string, limit: number): Promise<ContextSnapshot[]>;
     search(query: string, project?: string): Promise<ContextSnapshot[]>;
   }
   ```

2. `application/ports/IAIProvider.ts`
   ```typescript
   // Semantic contract for AI enhancement
   export interface IAIProvider {
     generateSummary(content: string): Promise<string>;
     generateTags(content: string): Promise<string>;
   }
   ```

**Deliverable:** Type-safe contracts with semantic documentation

---

### **Phase 2: Extract Infrastructure** (Bottom-Up)
**Goal:** Move technical dependencies to adapters

#### **Step 2.1: Database Adapter**
**File:** `infrastructure/adapters/D1ContextRepository.ts`

**Extract from index.ts:**
- Lines 282-294 (save_context DB logic)
- Lines 310-332 (load_context DB logic)
- Lines 340-372 (search_context DB logic)

**Semantic Intent:**
```typescript
/**
 * 🎯 SEMANTIC INTENT: D1 Database Adapter for Context Persistence
 *
 * INFRASTRUCTURE RESPONSIBILITY:
 * - WHERE: Cloudflare D1 SQLite database
 * - HOW: SQL queries for CRUD operations
 * - PRESERVES: Domain semantic contracts via IContextRepository
 */
export class D1ContextRepository implements IContextRepository {
  constructor(private db: D1Database) {}

  async save(snapshot: ContextSnapshot): Promise<string> {
    // Implementation
  }

  async findByProject(project: string, limit: number): Promise<ContextSnapshot[]> {
    // Implementation
  }

  async search(query: string, project?: string): Promise<ContextSnapshot[]> {
    // Implementation
  }
}
```

**Testing:** Can now mock IContextRepository for unit tests

---

#### **Step 2.2: AI Service Adapter**
**File:** `infrastructure/adapters/CloudflareAIProvider.ts`

**Extract from index.ts:**
- Lines 40-55 (generateSummary)
- Lines 71-85 (generateTags)

**Semantic Intent:**
```typescript
/**
 * 🎯 SEMANTIC INTENT: Cloudflare AI Provider Adapter
 *
 * INFRASTRUCTURE RESPONSIBILITY:
 * - WHERE: Cloudflare Workers AI binding
 * - HOW: LLaMA model inference
 * - PRESERVES: Semantic meaning through AI transformation
 */
export class CloudflareAIProvider implements IAIProvider {
  constructor(private ai: Ai) {}

  async generateSummary(content: string): Promise<string> {
    // Implementation
  }

  async generateTags(content: string): Promise<string> {
    // Implementation
  }
}
```

**Benefits:** Can swap to OpenAI/Anthropic without changing domain logic

---

#### **Step 2.3: Middleware**
**File:** `infrastructure/middleware/CORSMiddleware.ts`

**Extract:** Repeated CORS headers throughout index.ts

```typescript
/**
 * 🎯 SEMANTIC INTENT: CORS Policy Enforcement
 *
 * CROSS-CUTTING CONCERN:
 * - Applies consistent CORS headers
 * - Handles OPTIONS preflight
 */
export class CORSMiddleware {
  static headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  static addHeaders(response: Response): Response {
    // Implementation
  }

  static handlePreflight(): Response {
    // Implementation
  }
}
```

**Reduction:** Eliminate 100+ lines of duplicated headers

---

### **Phase 3: Build Domain Layer** (Core Logic)
**Goal:** Pure business logic, no dependencies on infrastructure

#### **Step 3.1: Domain Models**
**File:** `domain/models/ContextSnapshot.ts`

**Move from types.ts + add business rules:**

```typescript
/**
 * 🎯 SEMANTIC INTENT: Context Snapshot Domain Entity
 *
 * DOMAIN RESPONSIBILITY:
 * - Encapsulates business rules for context snapshots
 * - Validates semantic completeness
 * - Enforces domain invariants
 */
export class ContextSnapshot {
  constructor(
    public readonly id: string,
    public readonly project: string,
    public readonly summary: string,
    public readonly source: string,
    public readonly metadata: string | null,
    public readonly tags: string,
    public readonly timestamp: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.project || this.project.trim().length === 0) {
      throw new Error('Project is required - semantic domain anchor missing');
    }
    if (!this.summary || this.summary.trim().length === 0) {
      throw new Error('Summary is required - semantic essence missing');
    }
  }

  static create(data: ContextSnapshotData): ContextSnapshot {
    return new ContextSnapshot(
      crypto.randomUUID(),
      data.project,
      data.summary,
      data.source || 'mcp',
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.tags,
      new Date().toISOString()
    );
  }
}
```

**Benefits:**
- Self-validating entities
- Business rules centralized
- Testable in isolation

---

#### **Step 3.2: Domain Service**
**File:** `domain/services/ContextService.ts`

**Extract business logic from index.ts:**

```typescript
/**
 * 🎯 SEMANTIC INTENT: Context Management Domain Service
 *
 * DOMAIN RESPONSIBILITY:
 * - Orchestrates context operations with semantic preservation
 * - Coordinates AI enhancement + persistence
 * - Enforces business rules
 */
export class ContextService {
  constructor(
    private repository: IContextRepository,
    private aiProvider: IAIProvider
  ) {}

  async saveContext(input: SaveContextInput): Promise<ContextSnapshot> {
    // 1. AI Enhancement (semantic compression)
    const summary = await this.aiProvider.generateSummary(input.content);
    const tags = await this.aiProvider.generateTags(summary);

    // 2. Create domain entity (validates business rules)
    const snapshot = ContextSnapshot.create({
      project: input.project,
      summary,
      source: input.source,
      metadata: input.metadata,
      tags
    });

    // 3. Persist (delegate to infrastructure)
    await this.repository.save(snapshot);

    return snapshot;
  }

  async loadContext(project: string, limit: number = 1): Promise<ContextSnapshot[]> {
    // Business rule: Limit bounded to prevent resource exhaustion
    const boundedLimit = Math.min(limit, 10);
    return this.repository.findByProject(project, boundedLimit);
  }

  async searchContext(query: string, project?: string): Promise<ContextSnapshot[]> {
    return this.repository.search(query, project);
  }
}
```

**Semantic Preservation:**
- ✅ Clear WHAT (business operations)
- ✅ Clear WHY (semantic intent preserved)
- ✅ Clear HOW (orchestration flow)

---

### **Phase 4: Application Layer** (Orchestration)
**Goal:** Coordinate domain + infrastructure

#### **Step 4.1: Tool Execution Handler**
**File:** `application/handlers/ToolExecutionHandler.ts`

**Extract from index.ts lines 260-400:**

```typescript
/**
 * 🎯 SEMANTIC INTENT: MCP Tool Execution Orchestrator
 *
 * APPLICATION RESPONSIBILITY:
 * - Translates MCP tool calls to domain operations
 * - Orchestrates context service + response formatting
 * - Maintains semantic intent through transformation
 */
export class ToolExecutionHandler {
  constructor(private contextService: ContextService) {}

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

  private async handleSaveContext(input: SaveContextInput): Promise<ToolResult> {
    const snapshot = await this.contextService.saveContext(input);

    return {
      content: [{
        type: "text",
        text: `Context saved!\nID: ${snapshot.id}\nSummary: ${snapshot.summary}\nTags: ${snapshot.tags}`
      }]
    };
  }

  // ... other handlers
}
```

**Benefits:**
- Tool logic separated from protocol handling
- Easy to add new tools
- Testable with mock ContextService

---

#### **Step 4.2: MCP Protocol Handler**
**File:** `application/handlers/MCPProtocolHandler.ts`

**Extract from index.ts lines 120-260:**

```typescript
/**
 * 🎯 SEMANTIC INTENT: MCP Protocol Message Handler
 *
 * APPLICATION RESPONSIBILITY:
 * - Handles MCP/JSON-RPC protocol semantics
 * - Dispatches to appropriate handlers
 * - Maintains protocol compliance
 */
export class MCPProtocolHandler {
  constructor(private toolHandler: ToolExecutionHandler) {}

  async handle(body: unknown): Promise<Response> {
    const request = this.parseRequest(body);

    switch (request.method) {
      case 'initialize':
        return this.handleInitialize(request);

      case 'notifications/initialized':
      case 'notifications/cancelled':
        return this.handleNotification();

      case 'tools/list':
        return this.handleToolsList(request);

      case 'tools/call':
        return this.handleToolsCall(request);

      default:
        return this.handleMethodNotFound(request);
    }
  }

  // ... method implementations
}
```

---

### **Phase 5: Presentation Layer** (Slim Entry Point)
**Goal:** Clean, minimal routing

#### **Step 5.1: Router**
**File:** `presentation/routes/MCPRouter.ts`

```typescript
/**
 * 🎯 SEMANTIC INTENT: MCP Endpoint Router
 *
 * PRESENTATION RESPONSIBILITY:
 * - Routes HTTP requests to handlers
 * - Applies middleware (CORS, logging)
 * - Minimal logic - delegates to application layer
 */
export class MCPRouter {
  constructor(private protocolHandler: MCPProtocolHandler) {}

  async route(request: Request): Promise<Response> {
    const { pathname, method } = new URL(request.url);

    // OPTIONS: CORS preflight
    if (method === 'OPTIONS') {
      return CORSMiddleware.handlePreflight();
    }

    // MCP endpoints
    if (this.isMCPEndpoint(pathname)) {
      if (method === 'POST') {
        const body = await request.json();
        const response = await this.protocolHandler.handle(body);
        return CORSMiddleware.addHeaders(response);
      }

      if (method === 'GET') {
        return new Response('MCP endpoint - use POST for protocol messages', {
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    return new Response('MCP Server is running.', { status: 200 });
  }

  private isMCPEndpoint(pathname: string): boolean {
    return pathname === '/mcp' || pathname === '/sse' ||
           pathname.startsWith('/mcp') || pathname.startsWith('/sse');
  }
}
```

---

#### **Step 5.2: Entry Point (index.ts)**
**Target:** Reduce from 483 lines to ~50 lines

```typescript
/**
 * 🎯 SEMANTIC INTENT: Application Entry Point
 *
 * RESPONSIBILITY: Wire dependencies and delegate to router
 */

import { MCPRouter } from './presentation/routes/MCPRouter';
import { MCPProtocolHandler } from './application/handlers/MCPProtocolHandler';
import { ToolExecutionHandler } from './application/handlers/ToolExecutionHandler';
import { ContextService } from './domain/services/ContextService';
import { D1ContextRepository } from './infrastructure/adapters/D1ContextRepository';
import { CloudflareAIProvider } from './infrastructure/adapters/CloudflareAIProvider';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Dependency Injection (manual DI for now)
    const repository = new D1ContextRepository(env.DB);
    const aiProvider = new CloudflareAIProvider(env.AI);
    const contextService = new ContextService(repository, aiProvider);
    const toolHandler = new ToolExecutionHandler(contextService);
    const protocolHandler = new MCPProtocolHandler(toolHandler);
    const router = new MCPRouter(protocolHandler);

    try {
      return await router.route(request);
    } catch (error) {
      console.error('Unhandled error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
};
```

**Comparison:**
- Before: 483 lines of mixed concerns
- After: ~50 lines of dependency wiring

---

## 🧪 Testing Strategy

### **Unit Tests (New Capability)**

**Domain Layer:**
```typescript
// domain/services/ContextService.test.ts
describe('ContextService', () => {
  it('should preserve semantic intent through AI enhancement', async () => {
    const mockRepo = createMockRepository();
    const mockAI = createMockAIProvider();
    const service = new ContextService(mockRepo, mockAI);

    const result = await service.saveContext({
      project: 'test-project',
      content: 'Long content...'
    });

    expect(result.summary).toBe('AI-generated summary');
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      project: 'test-project'
    }));
  });
});
```

**Infrastructure Layer:**
```typescript
// infrastructure/adapters/D1ContextRepository.test.ts
describe('D1ContextRepository', () => {
  it('should execute correct SQL for save operation', async () => {
    const mockD1 = createMockD1Database();
    const repo = new D1ContextRepository(mockD1);

    await repo.save(createTestSnapshot());

    expect(mockD1.prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO context_snapshots')
    );
  });
});
```

---

## 📊 Migration Checklist

### **Phase 1: Foundation** ✅
- [ ] Create directory structure
- [ ] Define IContextRepository port
- [ ] Define IAIProvider port
- [ ] Create base test setup

### **Phase 2: Infrastructure** ✅
- [ ] Implement D1ContextRepository
- [ ] Implement CloudflareAIProvider
- [ ] Create CORSMiddleware
- [ ] Write infrastructure tests

### **Phase 3: Domain** ✅
- [ ] Create ContextSnapshot entity
- [ ] Implement ContextService
- [ ] Add business rule validation
- [ ] Write domain tests

### **Phase 4: Application** ✅
- [ ] Implement ToolExecutionHandler
- [ ] Implement MCPProtocolHandler
- [ ] Create DTOs
- [ ] Write application tests

### **Phase 5: Presentation** ✅
- [ ] Implement MCPRouter
- [ ] Refactor index.ts
- [ ] Integration testing
- [ ] Performance validation

### **Phase 6: Documentation** ✅
- [ ] Update README with new architecture
- [ ] Document each layer's semantic responsibility
- [ ] Create architecture diagram
- [ ] Update SEMANTIC_ANCHORING_GOVERNANCE.md

---

## 🎯 Success Metrics

### **Code Quality:**
- ✅ Reduce index.ts from 483 → ~50 lines (90% reduction)
- ✅ Achieve >80% test coverage
- ✅ Zero breaking changes to external API
- ✅ All existing functionality preserved

### **Maintainability:**
- ✅ Each layer independently testable
- ✅ Clear semantic boundaries documented
- ✅ Easy to swap infrastructure (D1 → Postgres, CF AI → OpenAI)
- ✅ New tools added in <50 lines of code

### **Semantic Preservation:**
- ✅ Every file documents its semantic intent
- ✅ Domain logic free of infrastructure concerns
- ✅ Clear WHAT/WHY/HOW at each layer

---

## 🚨 Risks & Mitigation

### **Risk 1: Breaking Changes**
**Mitigation:**
- Implement in parallel (new files alongside old)
- Keep old index.ts until fully tested
- Gradual cutover with feature flags

### **Risk 2: Over-Engineering**
**Mitigation:**
- Pragmatic DDD (no complex aggregates for MVP)
- Start with simple repository pattern
- Add complexity only when needed

### **Risk 3: Type Safety Issues**
**Mitigation:**
- Comprehensive interfaces for ports
- Strict TypeScript settings
- Runtime validation at boundaries

---

## 📅 Estimated Timeline

**Total:** 4-6 hours of focused work

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| Phase 1: Foundation | 30 minutes | P0 |
| Phase 2: Infrastructure | 1 hour | P0 |
| Phase 3: Domain | 1 hour | P0 |
| Phase 4: Application | 1.5 hours | P0 |
| Phase 5: Presentation | 45 minutes | P0 |
| Phase 6: Documentation | 45 minutes | P1 |

---

## ✅ Approval Gates

Before proceeding to next phase:

1. **Code Review**: Semantic intent clearly documented?
2. **Tests Pass**: All new code has tests?
3. **No Regression**: Existing functionality works?
4. **Documentation**: Each layer's responsibility clear?

---

## 🎓 Learning Outcomes

This refactoring demonstrates:

1. **Hexagonal Architecture** in practice
2. **Domain-Driven Design** principles
3. **Dependency Inversion** (ports & adapters)
4. **Semantic Intent Preservation** across architectural boundaries
5. **Clean Architecture** with Cloudflare Workers

**Reference Implementation** status maintained - this becomes THE example of how to structure MCP servers correctly!

---

**READY TO PROCEED?**

This plan preserves all semantic intent while dramatically improving code organization. Each phase is independently valuable and can be paused/resumed.

Would you like me to begin implementation starting with Phase 1? 🚀
