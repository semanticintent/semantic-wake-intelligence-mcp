# Wake Intelligence - Interview Preparation Guide

> **Wake Intelligence: 3-Layer Temporal Intelligence for AI Agents**
> MCP server implementing Past (causality), Present (memory), Future (prediction)
> Reference implementation of Semantic Intent patterns and Hexagonal Architecture

---

## 🎯 Table of Contents

1. [Project Overview - The 30-Second Elevator Pitch](#1-project-overview---the-30-second-elevator-pitch)
2. [Technical Architecture](#2-technical-architecture)
3. [Key Design Decisions & Trade-offs](#3-key-design-decisions--trade-offs)
4. [Implementation Highlights](#4-implementation-highlights)
5. [Testing Strategy](#5-testing-strategy)
6. [Challenges & Solutions](#6-challenges--solutions)
7. [Interview Q&A by Theme](#7-interview-qa-by-theme)
8. [Connection to Other Projects](#8-connection-to-other-projects)

---

## 1. Project Overview - The 30-Second Elevator Pitch

**What is Wake Intelligence?**

Wake Intelligence is an MCP server implementing a **3-layer temporal intelligence brain** for AI agents: **Past** (causality tracking), **Present** (memory management), and **Future** (predictive pre-fetching).

**Why it matters:**
- Enables AI agents to **learn from history**, **optimize current context**, and **predict future needs**
- **109 passing tests** demonstrate comprehensive coverage
- Deploys to Cloudflare Workers (edge computing)
- Reference implementation of semantic intent + hexagonal architecture

**Business value:**
- AI agents remember WHY decisions were made (causality)
- Automatic memory optimization with 4-tier LRU system
- Proactive pre-fetching based on composite prediction scoring
- Production-ready with deterministic, explainable algorithms

**Tech stack:** TypeScript, Cloudflare Workers, D1 Database, Workers AI, MCP SDK, Vitest

---

## 2. Technical Architecture

### 2.1 The 3-Layer Temporal Intelligence Brain

```
┌─────────────────────────────────────────────────────────────┐
│                   WAKE INTELLIGENCE BRAIN                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LAYER 3: PROPAGATION ENGINE (Future - WHAT)                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • Predicts WHAT will be needed next                 │    │
│  │ • Composite scoring (40% temporal + 30% causal +    │    │
│  │   30% frequency)                                    │    │
│  │ • Pre-fetching optimization                         │    │
│  │ • Pattern-based next access estimation              │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ▲                                  │
│  LAYER 2: MEMORY MANAGER (Present - HOW)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • Tracks HOW relevant contexts are NOW              │    │
│  │ • 4-tier memory classification                      │    │
│  │   (ACTIVE/RECENT/ARCHIVED/EXPIRED)                  │    │
│  │ • LRU tracking + automatic tier updates             │    │
│  │ • Expired context pruning                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ▲                                  │
│  LAYER 1: CAUSALITY ENGINE (Past - WHY)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • Tracks WHY contexts were created                  │    │
│  │ • Causal chain tracking                             │    │
│  │ • Dependency auto-detection                         │    │
│  │ • Reasoning reconstruction                          │    │
│  │ • Action type taxonomy                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Why 3 layers?**
1. **Past (Causality)** - Understand decision history → informs predictions
2. **Present (Memory)** - Optimize current relevance → informs access patterns
3. **Future (Propagation)** - Predict what's needed → proactive optimization

### 2.2 Hexagonal Architecture

```
┌────────────────────────────────────────────┐
│      Presentation Layer (MCPRouter)        │
│        HTTP Request Routing                │
└─────────────────┬──────────────────────────┘
                  │
┌─────────────────▼──────────────────────────┐
│        Application Layer                   │
│   • ToolExecutionHandler                   │
│   • MCPProtocolHandler                     │
└─────────────────┬──────────────────────────┘
                  │
┌─────────────────▼──────────────────────────┐
│           Domain Layer                     │
│   • PropagationService (Layer 3)          │
│   • MemoryManagerService (Layer 2)        │
│   • CausalityService (Layer 1)            │
│   • ContextService (Orchestrator)         │
│   • ContextSnapshot (Entity)              │
└─────────────────┬──────────────────────────┘
                  │ (Ports: Interfaces)
┌─────────────────▼──────────────────────────┐
│      Infrastructure Layer                  │
│   • D1ContextRepository                    │
│   • CloudflareAIProvider                   │
│   • CORSMiddleware                         │
└────────────────────────────────────────────┘
```

### 2.3 Directory Structure

```
src/
├── domain/                    # Pure business logic (20 tests)
│   ├── models/                # ContextSnapshot entity
│   └── services/              # 4 services (Context, Causality, Memory, Propagation)
├── application/               # Orchestration (10 tests)
│   └── handlers/              # ToolExecutionHandler, MCPProtocolHandler
├── infrastructure/            # External adapters (20 tests)
│   └── adapters/              # D1Repository, CloudflareAIProvider
├── presentation/              # HTTP routing (12 tests)
│   └── routes/                # MCPRouter
└── index.ts                   # Composition root (74 lines!)
```

---

## 3. Key Design Decisions & Trade-offs

### 3.1 Why 3-Layer Brain vs Traditional Context Management?

**Decision:** Temporal intelligence with Past/Present/Future layers

**Rationale:**
- **Causality (Past)** - Understand WHY contexts exist (decision history)
- **Memory (Present)** - HOW relevant is it NOW (LRU + tiers)
- **Propagation (Future)** - WHAT will be needed next (predictive)

**Trade-off:**
- ✅ Rich temporal understanding
- ✅ Proactive optimization
- ✅ Explainable predictions
- ❌ More complex than simple key-value storage
- ❌ Additional database columns

**Code reference:** [ARCHITECTURE.md:25-363](https://github.com/semanticintent/semantic-wake-intelligence-mcp/blob/main/ARCHITECTURE.md)

### 3.2 Why Composite Prediction Scoring?

**Decision:** 40% temporal + 30% causal + 30% frequency

**Rationale:**
```typescript
predictionScore =
  0.4 * temporalScore +      // Recency (exponential decay)
  0.3 * causalStrength +     // Position in causal chains
  0.3 * frequencyScore       // Access frequency (log scale)
```

**Why these weights?**
- **40% temporal** - Recency is strongest signal (most recent = most likely next)
- **30% causal** - Causal roots often re-accessed (important contexts)
- **30% frequency** - High-use contexts likely needed again

**Trade-off:**
- ✅ Balanced multi-factor prediction
- ✅ Deterministic (not black-box ML)
- ✅ Each component is explainable
- ❌ Weights are heuristic (could be tuned with ML later)

**Code reference:** [PropagationService.ts:60-115](https://github.com/semanticintent/semantic-wake-intelligence-mcp/blob/main/src/domain/services/PropagationService.ts)

### 3.3 Why 4-Tier Memory System?

**Decision:** ACTIVE (< 1hr) / RECENT (1-24hr) / ARCHIVED (1-30d) / EXPIRED (> 30d)

**Rationale:**
- **Observable tiers** based on time since last access
- **Auto-recalculation** as contexts age
- **Pruning candidates** (EXPIRED tier)
- **Search prioritization** (ACTIVE/RECENT ranked higher)

**Trade-off:**
- ✅ Simple, observable logic
- ✅ Automatic memory optimization
- ✅ Prevents database bloat
- ❌ Time thresholds are fixed (could be configurable)

**Code reference:** [MemoryManagerService.ts:15-85](https://github.com/semanticintent/semantic-wake-intelligence-mcp/blob/main/src/domain/services/MemoryManagerService.ts)

### 3.4 Why Cloudflare Workers vs Traditional Server?

**Decision:** Deploy to Cloudflare Workers (edge computing)

**Rationale:**
- **Global edge deployment** - Low latency worldwide
- **Serverless** - No servers to manage
- **D1 + Workers AI integration** - Native Cloudflare ecosystem
- **Auto-scaling** - Handles traffic spikes

**Trade-off:**
- ✅ Fast (edge-deployed)
- ✅ Scalable (auto-scale)
- ✅ Cheap (pay-per-use)
- ❌ Platform lock-in (Cloudflare-specific)
- ❌ Cold start latency (first request)

### 3.5 Why Hexagonal Architecture for MCP Server?

**Decision:** Full hexagonal architecture with ports & adapters

**Rationale:**
- **Testability** - Domain logic has zero infrastructure dependencies
- **Flexibility** - Could swap D1 for PostgreSQL
- **Clarity** - Clear layer boundaries
- **Reference implementation** - Demonstrates patterns

**Trade-off:**
- ✅ Highly maintainable
- ✅ Easy to test (109 tests!)
- ✅ Composition root is only 74 lines (down from 483 - 90% reduction)
- ❌ More files/abstractions upfront

---

## 4. Implementation Highlights

### 4.1 Composition Root (Dependency Injection)

**Location:** [src/index.ts](https://github.com/semanticintent/semantic-wake-intelligence-mcp/blob/main/src/index.ts)

**What it does:** Wires all dependencies in 74 lines (90% reduction from monolithic version)

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Infrastructure
    const repository = new D1ContextRepository(env.DB);
    const aiProvider = new CloudflareAIProvider(env.AI);

    // Domain services (3-layer brain)
    const causalityService = new CausalityService(repository);
    const memoryService = new MemoryManagerService(repository);
    const propagationService = new PropagationService(
      repository,
      causalityService
    );

    // Orchestrator
    const contextService = new ContextService(
      repository,
      aiProvider,
      causalityService,
      memoryService,
      propagationService
    );

    // Application
    const toolHandler = new ToolExecutionHandler(contextService);
    const protocolHandler = new MCPProtocolHandler(toolHandler);

    // Presentation
    const router = new MCPRouter(protocolHandler);
    return router.handle(request);
  }
};
```

**Why this matters:**
- **Single source of truth** for dependency graph
- **90% reduction** from previous monolithic approach
- **Explicit dependencies** make testing easy

### 4.2 Layer 1: Causality Engine

**Location:** [CausalityService.ts](https://github.com/semanticintent/semantic-wake-intelligence-mcp/blob/main/src/domain/services/CausalityService.ts)

**Auto-dependency detection:**
```typescript
async detectDependencies(project: string): Promise<string[]> {
  // Find contexts created in last 24 hours
  const recent = await this.repository.findRecent(project, 5, 24);

  // Auto-detect dependencies from temporal proximity
  return recent
    .filter(ctx => {
      const hoursSince = (Date.now() - new Date(ctx.timestamp).getTime()) / 3600000;
      return hoursSince < 1;  // Created within last hour
    })
    .map(ctx => ctx.id);
}
```

**Causal chain building:**
```typescript
async buildCausalChain(targetId: string): Promise<ContextSnapshot[]> {
  const chain: ContextSnapshot[] = [];
  let current = await this.repository.findById(targetId);

  while (current.causality?.causedBy) {
    chain.unshift(current);
    current = await this.repository.findById(current.causality.causedBy);
  }

  chain.unshift(current);  // Add root
  return chain;
}
```

**Why this matters:**
- **Temporal proximity heuristic** for dependency detection
- **Reconstruct decision history** for "Why did I do this?"
- **Observable causal relationships**

### 4.3 Layer 2: Memory Manager

**Location:** [MemoryManagerService.ts](https://github.com/semanticintent/semantic-wake-intelligence-mcp/blob/main/src/domain/services/MemoryManagerService.ts)

**Tier calculation:**
```typescript
calculateMemoryTier(lastAccessed: string | null, timestamp: string): MemoryTier {
  const referenceTime = lastAccessed || timestamp;
  const hoursSince = (Date.now() - new Date(referenceTime).getTime()) / 3600000;

  if (hoursSince < 1) return MemoryTier.ACTIVE;
  if (hoursSince < 24) return MemoryTier.RECENT;
  if (hoursSince < 720) return MemoryTier.ARCHIVED;  // 30 days
  return MemoryTier.EXPIRED;
}
```

**LRU tracking:**
```typescript
async trackAccess(contextId: string): Promise<void> {
  const context = await this.repository.findById(contextId);
  const newTier = this.calculateMemoryTier(new Date().toISOString(), context.timestamp);

  await this.repository.updateAccessTracking(contextId, {
    lastAccessed: new Date().toISOString(),
    accessCount: context.accessCount + 1,
    memoryTier: newTier
  });
}
```

**Why this matters:**
- **Observable time-based tiers**
- **Fire-and-forget access tracking** (don't block responses)
- **Automatic tier recalculation**

### 4.4 Layer 3: Propagation Engine

**Location:** [PropagationService.ts](https://github.com/semanticintent/semantic-wake-intelligence-mcp/blob/main/src/domain/services/PropagationService.ts)

**Composite scoring:**
```typescript
calculatePropagationScore(context: ContextSnapshot, causalStrength: number): number {
  const temporal = this.calculateTemporalScore(context);
  const frequency = this.calculateFrequencyScore(context);

  return 0.4 * temporal + 0.3 * causalStrength + 0.3 * frequency;
}
```

**Temporal score (exponential decay):**
```typescript
private calculateTemporalScore(context: ContextSnapshot): number {
  if (!context.lastAccessed) {
    // Never accessed - use tier-based default
    return context.memoryTier === 'ACTIVE' ? 0.3 :
           context.memoryTier === 'RECENT' ? 0.2 :
           context.memoryTier === 'ARCHIVED' ? 0.1 : 0.0;
  }

  const hoursSince = (Date.now() - new Date(context.lastAccessed).getTime()) / 3600000;
  return Math.exp(-hoursSince / 24);  // Half-life of 24 hours
}
```

**Why this matters:**
- **Explainable predictions** (not black-box ML)
- **Deterministic algorithm** (same inputs = same outputs)
- **Composite multi-factor scoring**

### 4.5 Cloudflare AI Provider with Fallbacks

**Location:** [CloudflareAIProvider.ts](https://github.com/semanticintent/semantic-wake-intelligence-mcp/blob/main/src/infrastructure/adapters/CloudflareAIProvider.ts)

**Graceful degradation:**
```typescript
async generateSummary(content: string): Promise<string> {
  if (content.length <= 200) {
    return content;  // Already concise
  }

  try {
    const response = await this.ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [{ role: 'user', content: `Summarize: ${content}` }]
    });
    return response.response;
  } catch (error) {
    console.error('AI summary generation failed:', error);
    // Fallback: Simple truncation
    return content.substring(0, 200) + '...';
  }
}
```

**Why this matters:**
- **Graceful degradation** if AI unavailable
- **No critical dependency** on AI (fallback works)
- **Simple fallback** (truncation) is predictable

---

## 5. Testing Strategy

### Test Distribution

**Total: 109 tests** (all passing ✅)

| Layer | Tests | Strategy |
|-------|-------|----------|
| Domain | 20 | Pure logic, no mocks |
| Application | 10 | Mock domain services |
| Infrastructure | 20 | Mock D1/AI |
| Presentation | 12 | HTTP routing tests |
| Integration | 13 | End-to-end flows |
| Causality Service | 20 | Layer 1 algorithms |
| Context Service | 13 | Orchestration |
| Other | 1 | Config/utils |

### Testing Each Layer

**Domain Layer (No Mocks Needed):**
```typescript
describe('CausalityService', () => {
  it('should detect dependencies from temporal proximity', async () => {
    const recentContexts = [
      { id: 'ctx-1', timestamp: '2024-01-01T10:00:00Z' },
      { id: 'ctx-2', timestamp: '2024-01-01T10:30:00Z' }
    ];

    const deps = await causalityService.detectDependencies('project-1');
    expect(deps).toContain('ctx-2');  // Created within 1 hour
  });
});
```

**Infrastructure Layer (Mock External Services):**
```typescript
describe('CloudflareAIProvider', () => {
  it('should use fallback when AI throws error', async () => {
    const mockAI = {
      run: vi.fn().mockRejectedValue(new Error('AI unavailable'))
    };

    const provider = new CloudflareAIProvider(mockAI);
    const summary = await provider.generateSummary(longContent);

    expect(summary).toHaveLength(203);  // Truncated to 200 + '...'
  });
});
```

### Test Commands

```bash
npm test              # Run all 109 tests
npm run test:watch    # TDD mode
npm run test:ui       # Visual test runner
npm run test:coverage # Coverage report
```

---

## 6. Challenges & Solutions

### 6.1 Challenge: Temporal Proximity Dependency Detection

**Problem:** How to auto-detect which contexts are related without explicit user input?

**Solution:** Temporal proximity heuristic

```typescript
// Contexts created within 1 hour of each other are likely related
const hoursSince = (now - context.timestamp) / 3600000;
if (hoursSince < 1) {
  dependencies.push(context.id);
}
```

**Why this works:**
- **Observable signal** (time is measurable)
- **Reasonable assumption** (recent contexts likely related)
- **Simple heuristic** (no complex inference)

**Trade-offs:**
- ✅ Works without user input
- ✅ Simple, deterministic
- ❌ May miss long-running projects
- ❌ May create false positives

**Improvement path:** Could add semantic similarity later

### 6.2 Challenge: Prediction Weight Tuning

**Problem:** How to balance temporal, causal, and frequency scores?

**Solution:** Start with heuristic weights (40/30/30), plan for tuning

**Current approach:**
```typescript
const score = 0.4 * temporal + 0.3 * causal + 0.3 * frequency;
```

**Rationale:**
- **Temporal dominant** (40%) - Recency is strongest signal
- **Causal + Frequency balanced** (30% each)
- **Simple starting point** for validation

**Future improvement:**
```typescript
// Could add Layer 4: Meta-learning
interface PredictionOutcome {
  predicted: number;
  actuallyAccessed: boolean;
}

// Tune weights based on accuracy
function optimizeWeights(outcomes: PredictionOutcome[]) {
  // Gradient descent or similar
}
```

### 6.3 Challenge: Fire-and-Forget Access Tracking

**Problem:** Don't want to slow down context retrieval with access tracking

**Solution:** Fire-and-forget pattern

```typescript
async loadContext(project: string): Promise<ContextSnapshot[]> {
  const contexts = await repository.findByProject(project);

  // Fire-and-forget access tracking (don't await!)
  contexts.forEach(ctx => {
    memoryManager.trackAccess(ctx.id).catch(err => {
      console.error(`Failed to track access for ${ctx.id}:`, err);
    });
  });

  return contexts;
}
```

**Why this matters:**
- **Fast responses** (don't block on tracking)
- **Best-effort tracking** (log errors, continue)
- **Acceptable trade-off** (tracking is optimization, not critical)

### 6.4 Challenge: Cloudflare Workers Environment Constraints

**Problem:** Workers have execution time limits, no persistent memory

**Solution:** Design for edge constraints

**Approaches:**
- **Lazy prediction refresh** - Only recalculate when stale
- **Batch operations** - Update multiple predictions in single request
- **D1 for persistence** - No reliance on Worker memory
- **Stateless design** - Each request is independent

**Code:**
```typescript
// Only refresh if stale (default: 24 hours)
const hoursSincePrediction = (now - lastPredicted) / 3600000;
if (hoursSincePrediction > staleThreshold) {
  await propagation.refreshPrediction(context);
}
```

---

## 7. Interview Q&A by Theme

### Theme A: Architecture & Design

#### Q1: Explain the 3-layer Wake Intelligence brain. Why Past/Present/Future?

**A:** The brain is structured around **temporal understanding**:

**Layer 1: Causality (Past - WHY)**
- Tracks WHY contexts were created
- Builds causal chains (what led to what)
- Enables reasoning reconstruction
- Example: "Why did I make this decision?"

**Layer 2: Memory (Present - HOW)**
- Manages HOW relevant contexts are NOW
- 4-tier system (ACTIVE → RECENT → ARCHIVED → EXPIRED)
- LRU tracking + auto-tier recalculation
- Example: "What's actively being worked on?"

**Layer 3: Propagation (Future - WHAT)**
- Predicts WHAT will be needed next
- Composite scoring (temporal + causal + frequency)
- Pre-fetching optimization
- Example: "What contexts should we load ahead of time?"

**Why this structure?**
- **Progressive enhancement** - Each layer builds on previous
- **Temporal completeness** - Past informs present, present informs future
- **Observable at each layer** - No black-box predictions

**Code reference:** [ARCHITECTURE.md:25-363](https://github.com/semanticintent/semantic-wake-intelligence-mcp/blob/main/ARCHITECTURE.md)

---

#### Q2: Walk through the hexagonal architecture. How does it differ from traditional MCP servers?

**A:** Hexagonal architecture maintains **strict layer separation**:

**Traditional MCP server:**
```typescript
// Monolithic - everything in one file
export default {
  async fetch(request, env) {
    const data = JSON.parse(await request.text());
    const result = await env.DB.query(...); // Direct DB access
    const summary = await env.AI.run(...);   // Direct AI access
    return new Response(JSON.stringify(result));
  }
}
```

**Wake Intelligence hexagonal:**
```typescript
// Presentation → Application → Domain → Infrastructure
export default {
  async fetch(request, env) {
    // Infrastructure adapters
    const repository = new D1ContextRepository(env.DB);
    const aiProvider = new CloudflareAIProvider(env.AI);

    // Domain services (pure business logic)
    const contextService = new ContextService(repository, aiProvider);

    // Application handlers
    const toolHandler = new ToolExecutionHandler(contextService);

    // Presentation router
    const router = new MCPRouter(protocolHandler);
    return router.handle(request);
  }
}
```

**Key differences:**

**Benefits:**
1. **Testability** - Domain has zero infrastructure dependencies
2. **Composition root** - Only 74 lines (90% reduction from monolithic)
3. **Clear boundaries** - Each layer has single responsibility
4. **Swappable infrastructure** - Could replace D1 with PostgreSQL

**Trade-offs:**
- ✅ Maintainable, testable (109 tests!)
- ✅ Clear architecture for teams
- ❌ More files (4 layers vs 1 file)

---

#### Q3: Explain the composite prediction scoring algorithm. Why these weights?

**A:** Prediction score combines **3 observable signals**:

```typescript
predictionScore =
  0.4 * temporalScore +      // 40% weight
  0.3 * causalStrength +     // 30% weight
  0.3 * frequencyScore       // 30% weight
```

**1. Temporal Score (40%)** - Exponential decay
```typescript
hoursSince = (now - lastAccessed) / 3600000;
temporalScore = Math.exp(-hoursSince / 24);  // Half-life of 24 hours
```
- Most recently accessed = highest score
- Decays exponentially (24-hour half-life)
- **Why 40%?** Recency is strongest predictor

**2. Causal Strength (30%)** - Position in chains
```typescript
if (isRoot && hasDependents) return 0.5+;  // High importance
if (hasDependents) return 0.3+;            // Moderate
return 0.2;                                 // Leaf node
```
- Causal roots score higher (foundational decisions)
- Nodes with dependents are important
- **Why 30%?** Causality indicates importance

**3. Frequency Score (30%)** - Logarithmic access count
```typescript
frequencyScore = Math.log(accessCount + 1) / Math.log(101);
```
- High-use contexts likely needed again
- Logarithmic scaling (diminishing returns)
- **Why 30%?** Frequency matters but shouldn't dominate

**Why composite scoring?**
- **Multi-factor** - No single signal is perfect
- **Balanced** - Weights tuned heuristically
- **Deterministic** - Not black-box ML
- **Explainable** - Each component traceable

**Future:** Could add Layer 4 (meta-learning) to tune weights based on accuracy

---

### Theme B: Implementation Details

#### Q4: How does dependency auto-detection work?

**A:** **Temporal proximity heuristic** - contexts created within 1 hour are likely related

**Algorithm:**
```typescript
async detectDependencies(project: string): Promise<string[]> {
  // Find recent contexts (last 24 hours)
  const recent = await repository.findRecent(project, limit=5, hours=24);

  // Filter by temporal proximity (< 1 hour)
  const dependencies = recent
    .filter(ctx => {
      const hoursSince = (now - ctx.timestamp) / 3600000;
      return hoursSince < 1;
    })
    .map(ctx => ctx.id);

  return dependencies;
}
```

**Why 1 hour threshold?**
- **Observable** - Time is measurable
- **Reasonable assumption** - Developer likely working on related tasks
- **Simple heuristic** - No complex inference needed

**Example workflow:**
```
10:00 AM - Save context: "Design database schema"
10:30 AM - Save context: "Implement schema migrations"
           → Auto-detected dependency: previous context
```

**Trade-offs:**
- ✅ Works without user input
- ✅ Simple, deterministic
- ❌ May miss long-running projects (> 1 hour between saves)
- ❌ May create false positives

**Future improvement:** Add semantic similarity (embeddings) to complement temporal proximity

---

#### Q5: How does the 4-tier memory system work?

**A:** **Observable time-based classification** with automatic recalculation

**Tier calculation:**
```typescript
calculateMemoryTier(lastAccessed: string | null, timestamp: string): MemoryTier {
  const referenceTime = lastAccessed || timestamp;
  const hoursSince = (now - referenceTime) / 3600000;

  if (hoursSince < 1)    return ACTIVE;     // < 1 hour
  if (hoursSince < 24)   return RECENT;     // 1-24 hours
  if (hoursSince < 720)  return ARCHIVED;   // 1-30 days
  return EXPIRED;                            // > 30 days
}
```

**Memory tier behaviors:**

| Tier | Time Range | Search Priority | Auto-Actions |
|------|------------|----------------|--------------|
| **ACTIVE** | < 1 hr | Highest | Top of results |
| **RECENT** | 1-24 hr | High | Include in searches |
| **ARCHIVED** | 1-30 days | Low | De-prioritize |
| **EXPIRED** | > 30 days | Lowest | Pruning candidate |

**Automatic tier updates:**
```typescript
async trackAccess(contextId: string): Promise<void> {
  const context = await repository.findById(contextId);
  const newTier = this.calculateMemoryTier(new Date().toISOString(), context.timestamp);

  await repository.update(contextId, {
    lastAccessed: new Date().toISOString(),
    accessCount: context.accessCount + 1,
    memoryTier: newTier  // Auto-update tier
  });
}
```

**Pruning:**
```typescript
async pruneExpiredContexts(limit = 100): Promise<number> {
  const expired = await repository.findByTier(EXPIRED, limit);
  for (const ctx of expired) {
    await repository.delete(ctx.id);
  }
  return expired.length;
}
```

**Benefits:**
- ✅ Self-optimizing memory
- ✅ Automatic cleanup
- ✅ Observable tier logic
- ✅ Search prioritization

---

### Theme C: Testing & Quality

#### Q6: You have 109 tests. Walk through your testing strategy.

**A:** **Layer-specific strategies** optimized for each architectural layer

**Test distribution:**
- Domain: 20 tests (pure logic, no mocks)
- Application: 10 tests (mock domain services)
- Infrastructure: 20 tests (mock D1/AI)
- Presentation: 12 tests (HTTP routing)
- Integration: 13 tests (end-to-end)
- Specialized: 33 tests (Causality, Context services)
- Other: 1 test

**Domain Layer - No Mocks:**
```typescript
describe('PropagationService', () => {
  it('should calculate temporal score with exponential decay', () => {
    const context = {
      lastAccessed: '2024-01-01T12:00:00Z',
      timestamp: '2024-01-01T10:00:00Z'
    };

    const score = propagation.calculateTemporalScore(context);
    expect(score).toBeCloseTo(0.92, 2);  // exp(-2/24)
  });
});
```
**Why no mocks?** Pure functions, no infrastructure

**Infrastructure Layer - Mock External:**
```typescript
describe('D1ContextRepository', () => {
  it('should save context to D1', async () => {
    const mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true })
        })
      })
    };

    const repo = new D1ContextRepository(mockDB);
    await repo.save(context);

    expect(mockDB.prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO context_snapshots')
    );
  });
});
```

**Integration Tests - End-to-End:**
```typescript
describe('Integration: Save and Load Context', () => {
  it('should persist and retrieve context with all layers', async () => {
    // Save
    await contextService.saveContext({
      project: 'test',
      content: 'Integration test',
      actionType: 'testing'
    });

    // Load
    const contexts = await contextService.loadContext('test');
    expect(contexts).toHaveLength(1);
    expect(contexts[0].causality.actionType).toBe('testing');
  });
});
```

**Test commands:**
```bash
npm test              # All 109 tests (1.5s runtime!)
npm run test:watch    # TDD mode
npm run test:coverage # Coverage report
```

---

### Theme D: Challenges & Problem-Solving

#### Q7: What was the hardest technical challenge in this project?

**A:** **Balancing prediction accuracy with computational cost**

**The problem:**
- Prediction scoring requires multiple calculations per context
- Workers have execution time limits
- Can't recalculate predictions on every request (too slow)

**Solution 1: Lazy refresh with staleness threshold**
```typescript
// Only refresh if stale (default: 24 hours)
const hoursSincePrediction = (now - lastPredicted) / 3600000;
if (hoursSincePrediction > staleThreshold) {
  await propagation.refreshPrediction(context);
}
```

**Solution 2: Batch updates**
```typescript
async updateProjectPredictions(project: string, staleThreshold = 24) {
  const staleContexts = await repository.findStalePredictions(staleThreshold);
  const projectContexts = staleContexts.filter(c => c.project === project);

  // Batch update all stale predictions
  for (const context of projectContexts) {
    const score = this.calculatePropagationScore(context, causalStrength);
    await repository.updatePrediction(context.id, score);
  }
}
```

**Solution 3: Pre-compute causal strength**
```typescript
// Store causal strength in DB, not recalculate every time
const causalStrength = this.calculateCausalStrength(context);
await repository.update(context.id, { causalStrength });
```

**Results:**
- ✅ Fast requests (< 100ms typical)
- ✅ Predictions stay reasonably fresh (24-hour staleness ok)
- ✅ Batch updates efficient
- ❌ Predictions can be stale for up to 24 hours (acceptable trade-off)

**Lessons learned:**
- **Caching matters** in serverless environments
- **Staleness is acceptable** for predictions (not real-time data)
- **Pre-computation** beats on-demand calculation

---

### Theme E: Business & Impact

#### Q8: Why build this? What problem does it solve?

**A:** **AI agents have no memory of their past work**

**The problem:**

**Before Wake Intelligence:**
```
Developer: "Why did I make this architectural decision 2 weeks ago?"
AI Agent: "I don't have that context. What were you working on?"
Developer: *manually searches old conversations*
```

**After Wake Intelligence:**
```
Developer: "Why did I make this architectural decision?"
AI Agent: [Uses build_causal_chain]
"You made that decision as part of a refactoring effort. Here's the chain:
1. Initial design (Dec 1) - Chose monolithic architecture
2. Performance issues (Dec 5) - Identified bottleneck
3. Decision to refactor (Dec 8) - Switched to microservices
4. This decision (Dec 10) - Implemented API gateway pattern

The rationale was: 'Need to isolate authentication logic for scaling'
Related contexts: [shows 3 linked decisions]"
```

**Business value:**

1. **Institutional knowledge** - Never lose context of WHY decisions were made
2. **Onboarding** - New team members understand decision history
3. **Efficiency** - No manual searching for past contexts
4. **Proactive** - Pre-fetches contexts you'll likely need

**Real-world use cases:**

**Use case 1: Long-running projects**
```
Month 1: Design database schema
Month 2: Implement business logic
Month 3: "Wait, why did we choose this schema?"
→ Layer 1 (Causality) reconstructs reasoning from Month 1
```

**Use case 2: Context switching**
```
Work on Project A (morning)
Work on Project B (afternoon)
Return to Project A (next day)
→ Layer 3 (Propagation) pre-fetches Project A contexts
```

**Use case 3: Knowledge transfer**
```
Senior dev leaves → Junior dev takes over
Junior: "Why is this architected this way?"
→ Causal chains show decision history with rationale
```

---

## 8. Connection to Other Projects

### 8.1 Relationship to Semantic Intent Portfolio

**Wake Intelligence (this project)** is part of a portfolio demonstrating semantic intent patterns:

#### PerchIQX (Database Intelligence)
- **Domain:** Database introspection for Cloudflare D1
- **Connection:** Both use hexagonal architecture + MCP
- **Shared patterns:**
  - Semantic anchoring (observable properties)
  - Intent preservation
  - Hexagonal architecture
  - MCP protocol

**Comparison:**
| Aspect | Wake | PerchIQX |
|--------|------|----------|
| Domain | Temporal intelligence | Database introspection |
| Tests | 109 | 407 |
| Layers | 3-layer brain | 4 architectural layers |
| Key entity | ContextSnapshot | TableInfo/DatabaseSchema |
| Deployment | Cloudflare Workers | Node.js (stdio) |

#### Semantic Foragecast Engine (Video Pipeline)
- **Domain:** Procedural animation pipeline
- **Connection:** Config-driven systems, phased processing
- **Shared patterns:**
  - Observable properties
  - Semantic anchoring
  - Deterministic algorithms

### 8.2 The "Semantic Intent" Thread

**All projects demonstrate:**

1. **Semantic Over Structural**
   - Wake: Causality based on "action type" (why), not file size
   - PerchIQX: Index recommendations based on FK presence, not row counts

2. **Intent Preservation**
   - Wake: Action type maintained through all transformations
   - PerchIQX: Environment semantic never overridden

3. **Observable Anchoring**
   - Wake: Temporal proximity is measurable (time since creation)
   - PerchIQX: Foreign keys are directly observable in schema

### 8.3 How to Present in Interviews

**Strategy: Show pattern consistency across domains**

**Opening:**
*"Let me walk you through my temporal intelligence system for AI agents..."*

**Connect to portfolio:**
*"I also built a database intelligence MCP server using similar patterns - hexagonal architecture, semantic anchoring, comprehensive testing..."*

**Unified narrative:**
*"These projects demonstrate my approach to building maintainable AI-augmented systems. Whether it's temporal intelligence, database introspection, or multimedia pipelines, I focus on preserving semantic meaning through transformations."*

---

## 📚 Additional Resources

### Key Files to Reference

1. **README.md** - Quick overview, brain architecture
2. **ARCHITECTURE.md** - Complete design documentation (849 lines!)
3. **BRAIN-ARCHITECTURE-IMPLEMENTATION-PLAN.md** - 3-layer implementation
4. **src/index.ts** - Composition root (74 lines)
5. **src/domain/services/** - All 4 domain services

### Commands to Know

```bash
# Development
npm run dev          # Start local Wrangler dev server
npm run deploy       # Deploy to Cloudflare Workers

# Testing
npm test             # Run all 109 tests
npm run test:watch   # TDD mode
npm run test:coverage # Coverage report

# Database
wrangler d1 create mcp-context              # Create D1 database
wrangler d1 execute mcp-context --file=...  # Run migrations

# Code quality
npm run lint         # Biome linting
npm run format       # Format code
npm run type-check   # TypeScript validation
```

### Quick Stats to Memorize

- **109 passing tests** (all layers)
- **3-layer brain** (Past/Present/Future)
- **4-tier memory** (ACTIVE/RECENT/ARCHIVED/EXPIRED)
- **74-line composition root** (90% reduction)
- **Composite prediction** (40% temporal + 30% causal + 30% frequency)
- **Deployed to edge** (Cloudflare Workers)
- **TypeScript 5.8** with strict types

---

## 🎯 Interview Tips

### Do's

✅ **Start with the 3-layer brain** - It's the unique differentiator
✅ **Use specific numbers** - "109 tests", "40/30/30 scoring", "4 tiers"
✅ **Explain trade-offs** - Every decision has pros/cons
✅ **Connect layers** - Show how Past informs Future
✅ **Reference code** - Point to specific files
✅ **Show pattern consistency** - Connect to PerchIQX

### Don'ts

❌ **Don't oversell ML** - It's deterministic algorithms, not deep learning
❌ **Don't skip the "why"** - Always explain rationale
❌ **Don't forget business value** - Not just technical showcase
❌ **Don't ignore alternatives** - Show you evaluated options
❌ **Don't memorize code** - Understand the concepts

### Practice Questions

**Behavioral:**
- "Tell me about a system you designed from scratch"
  → Use Wake Intelligence 3-layer brain architecture

- "Describe a time you optimized performance"
  → Use lazy prediction refresh + staleness threshold

**Technical:**
- "How do you structure code for testability?"
  → Explain hexagonal architecture, 109 tests

- "Explain a complex algorithm you've implemented"
  → Walk through composite prediction scoring

**System Design:**
- "Design a context management system for AI agents"
  → Explain Wake Intelligence architecture

---

**Good luck! This project demonstrates senior-level system design, temporal intelligence, and production-ready edge computing.**

**Remember:** The 3-layer brain (Past/Present/Future) is your unique story - lead with that! 🧠
