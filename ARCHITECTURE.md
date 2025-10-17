# Wake Intelligence Architecture

## Overview

Wake Intelligence is a production-ready Model Context Protocol (MCP) server implementing a **3-layer temporal intelligence system** that gives AI agents memory with understanding of **Past**, **Present**, and **Future**.

This document describes the complete architectural design, from the temporal intelligence brain to the hexagonal infrastructure layers.

---

## Table of Contents

- [Wake Intelligence Brain (3-Layer System)](#wake-intelligence-brain-3-layer-system)
  - [Layer 1: Causality Engine (Past)](#layer-1-causality-engine-past---why)
  - [Layer 2: Memory Manager (Present)](#layer-2-memory-manager-present---how)
  - [Layer 3: Propagation Engine (Future)](#layer-3-propagation-engine-future---what)
- [Hexagonal Architecture](#hexagonal-architecture)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [Dependency Graph](#dependency-graph)
- [Design Principles](#design-principles)

---

## Wake Intelligence Brain (3-Layer System)

The Wake Intelligence brain is a temporal intelligence system that enables AI agents to:
1. **Learn from the past** - Understand causal relationships (Layer 1)
2. **Optimize the present** - Manage memory intelligently (Layer 2)
3. **Predict the future** - Pre-fetch what's needed next (Layer 3)

```
┌─────────────────────────────────────────────────────────────┐
│                   WAKE INTELLIGENCE BRAIN                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LAYER 3: PROPAGATION ENGINE (Future - WHAT)                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PropagationService                                  │    │
│  │ • predictContext()                                  │    │
│  │ • calculateCausalStrength()                         │    │
│  │ • estimateNextAccess()                              │    │
│  │ • updateProjectPredictions()                        │    │
│  │ • getHighValueContexts()                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ▲                                  │
│  LAYER 2: MEMORY MANAGER (Present - HOW)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ MemoryManagerService                                │    │
│  │ • calculateMemoryTier()                             │    │
│  │ • trackAccess()                                     │    │
│  │ • recalculateAllTiers()                             │    │
│  │ • pruneExpiredContexts()                            │    │
│  │ • getMemoryStats()                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ▲                                  │
│  LAYER 1: CAUSALITY ENGINE (Past - WHY)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ CausalityService                                    │    │
│  │ • recordAction()                                    │    │
│  │ • detectDependencies()                              │    │
│  │ • buildCausalChain()                                │    │
│  │ • reconstructReasoning()                            │    │
│  │ • getCausalityStats()                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1: Causality Engine (Past - WHY)

**Purpose:** Track WHY contexts were created and their causal relationships.

**Key Components:**
- **Service:** `CausalityService` ([src/domain/services/CausalityService.ts](src/domain/services/CausalityService.ts))
- **Data:** `CausalityMetadata` interface in [types.ts](src/types.ts)
- **Database:** Columns in `context_snapshots` table (migration [0002](migrations/0002_add_causality_engine.sql))

**Core Algorithms:**

1. **Dependency Auto-Detection:**
   ```typescript
   // Temporal proximity heuristic
   recentContexts = findRecent(project, limit=5, hours=24)
   dependencies = recentContexts.filter(context =>
     timeSince(context) < 1 hour
   ).map(c => c.id)
   ```

2. **Causal Chain Building:**
   ```typescript
   buildCausalChain(targetId):
     chain = []
     current = findById(targetId)
     while (current.causedBy != null):
       chain.unshift(current)
       current = findById(current.causedBy)
     chain.unshift(current) // Add root
     return chain
   ```

3. **Reasoning Reconstruction:**
   ```typescript
   reconstructReasoning(snapshotId):
     snapshot = findById(snapshotId)
     chain = buildCausalChain(snapshotId)

     reasoning = "Context created due to: " + snapshot.rationale
     if (chain.length > 1):
       reasoning += "\n\nCausal chain:"
       for each context in chain:
         reasoning += "\n- [" + context.actionType + "] " + context.summary
     return reasoning
   ```

**Action Types:**
- `decision` - Major decisions or architectural choices
- `implementation` - Code implementation actions
- `refactor` - Refactoring existing code
- `bug_fix` - Fixing bugs or issues
- `documentation` - Writing documentation
- `testing` - Test creation or debugging
- `exploration` - Exploring options or research

**Database Schema:**
```sql
-- Layer 1: Causality Engine columns
action_type TEXT,           -- Type of action (decision, implementation, etc.)
rationale TEXT,             -- WHY this context was created
dependencies TEXT,          -- JSON array of related context IDs
caused_by TEXT              -- Parent context ID in causal chain
```

---

### Layer 2: Memory Manager (Present - HOW)

**Purpose:** Manage HOW relevant contexts are right now based on temporal patterns.

**Key Components:**
- **Service:** `MemoryManagerService` ([src/domain/services/MemoryManagerService.ts](src/domain/services/MemoryManagerService.ts))
- **Enum:** `MemoryTier` in [types.ts](src/types.ts)
- **Database:** Columns in `context_snapshots` table (migration [0003](migrations/0003_add_memory_manager.sql))

**Memory Tier Classification:**

```typescript
calculateMemoryTier(lastAccessed: string | null, timestamp: string): MemoryTier {
  const referenceTime = lastAccessed || timestamp
  const hoursSince = (now - referenceTime) / (1000 * 60 * 60)

  if (hoursSince < 1)  return ACTIVE    // < 1 hour
  if (hoursSince < 24) return RECENT    // 1-24 hours
  if (hoursSince < 720) return ARCHIVED // 1-30 days
  return EXPIRED                        // > 30 days
}
```

**Memory Tiers:**

| Tier | Time Range | Purpose | Auto-Actions |
|------|------------|---------|--------------|
| **ACTIVE** | < 1 hour | Hot cache | Prioritize in searches |
| **RECENT** | 1-24 hours | Working memory | Include in queries |
| **ARCHIVED** | 1-30 days | Long-term storage | De-prioritize |
| **EXPIRED** | > 30 days | Pruning candidate | Auto-delete eligible |

**LRU Tracking:**
```sql
-- Layer 2: Memory Manager columns
memory_tier TEXT NOT NULL,   -- ACTIVE, RECENT, ARCHIVED, EXPIRED
last_accessed TEXT,           -- ISO timestamp of last access
access_count INTEGER DEFAULT 0 -- Number of times accessed
```

**Core Operations:**

1. **Track Access (LRU Update):**
   ```typescript
   trackAccess(contextId):
     UPDATE context_snapshots
     SET last_accessed = NOW(),
         access_count = access_count + 1,
         memory_tier = calculateMemoryTier(NOW(), timestamp)
     WHERE id = contextId
   ```

2. **Tier Recalculation:**
   ```typescript
   recalculateAllTiers(project?):
     contexts = project ? findByProject(project) : findAll()
     for each context in contexts:
       newTier = calculateMemoryTier(context.lastAccessed, context.timestamp)
       if (newTier != context.memoryTier):
         updateMemoryTier(context.id, newTier)
   ```

3. **Expired Context Pruning:**
   ```typescript
   pruneExpiredContexts(limit=100):
     expiredContexts = findByMemoryTier(EXPIRED, limit)
     for each context in expiredContexts:
       delete(context.id)
     return expiredContexts.length
   ```

**Benefits:**
- ✅ Automatic memory optimization
- ✅ Intelligent search prioritization
- ✅ Storage cleanup automation
- ✅ Access pattern analytics

---

### Layer 3: Propagation Engine (Future - WHAT)

**Purpose:** Predict WHAT contexts will be needed next for proactive optimization.

**Key Components:**
- **Service:** `PropagationService` ([src/domain/services/PropagationService.ts](src/domain/services/PropagationService.ts))
- **Data:** `PropagationMetadata` interface in [types.ts](src/types.ts)
- **Database:** Columns in `context_snapshots` table (migration [0004](migrations/0004_add_propagation_engine.sql))

**Composite Prediction Scoring:**

```typescript
calculatePropagationScore(context, causalStrength): number {
  const temporal = calculateTemporalScore(context)    // 40% weight
  const causal = causalStrength                       // 30% weight
  const frequency = calculateFrequencyScore(context)  // 30% weight

  return 0.4 * temporal + 0.3 * causal + 0.3 * frequency
}
```

**Scoring Components:**

1. **Temporal Score (40% weight):**
   ```typescript
   calculateTemporalScore(context): number {
     if (!context.lastAccessed) {
       // Never accessed - use tier-based default
       switch (context.memoryTier) {
         case ACTIVE: return 0.3
         case RECENT: return 0.2
         case ARCHIVED: return 0.1
         case EXPIRED: return 0.0
       }
     }

     // Exponential decay based on recency
     hoursSince = (now - context.lastAccessed) / (1000 * 60 * 60)
     return Math.exp(-hoursSince / 24)  // Half-life of 24 hours
   }
   ```

2. **Causal Score (30% weight):**
   ```typescript
   calculateCausalStrength(context): number {
     if (!context.causality) return 0.0

     const dependencyCount = context.causality.dependencies.length
     const isRoot = context.causality.causedBy === null

     if (isRoot && dependencyCount > 0) {
       // Root with dependents → high importance
       return Math.min(1.0, 0.5 + (dependencyCount * 0.1))
     }

     if (dependencyCount > 0) {
       // Middle of chain → moderate importance
       return Math.min(0.7, 0.3 + (dependencyCount * 0.1))
     }

     // Leaf node → lower importance
     return 0.2
   }
   ```

3. **Frequency Score (30% weight):**
   ```typescript
   calculateFrequencyScore(context): number {
     if (context.accessCount === 0) return 0.0

     // Logarithmic scaling (10 accesses ≈ 0.5, 100 ≈ 1.0)
     return Math.log(context.accessCount + 1) / Math.log(101)
   }
   ```

**Pattern Detection:**

```typescript
estimateNextAccess(context): string | null {
  if (!context.lastAccessed || context.accessCount === 0) {
    return null  // No pattern
  }

  if (context.accessCount === 1) {
    // Single access → simple heuristic (next day)
    return addDays(context.lastAccessed, 1)
  }

  // Multiple accesses → detect pattern
  const createdTime = new Date(context.timestamp)
  const lastAccessTime = new Date(context.lastAccessed)
  const totalDuration = lastAccessTime - createdTime
  const avgInterval = totalDuration / context.accessCount

  const nextAccessTime = lastAccessTime + avgInterval
  const maxFutureTime = now + (7 * 24 * 60 * 60 * 1000)  // Cap at 7 days

  return new Date(Math.min(nextAccessTime, maxFutureTime))
}
```

**Prediction Reasons:**

Observable explanations for predictions:
- `high_composite_score` - Overall score >= 0.7
- `recently_accessed` - Accessed < 1 hour ago
- `accessed_today` - Accessed < 24 hours ago
- `high_access_frequency` - Access count >= 10
- `moderate_access_frequency` - Access count >= 3
- `causal_chain_root` - Causal strength >= 0.5
- `causal_chain_member` - Causal strength >= 0.3
- `active_memory_tier` - Currently in ACTIVE tier
- `baseline_prediction` - Default (no specific signals)

**Database Schema:**
```sql
-- Layer 3: Propagation Engine columns
prediction_score REAL,           -- 0.0-1.0 composite prediction score
last_predicted TEXT,             -- ISO timestamp when prediction calculated
predicted_next_access TEXT,      -- Estimated next access time
propagation_reason TEXT          -- JSON array of prediction reasons
```

**Core Operations:**

1. **Update Predictions:**
   ```typescript
   updateProjectPredictions(project, staleThreshold=24):
     staleContexts = findStalePredictions(staleThreshold)
     projectContexts = staleContexts.filter(c => c.project === project)

     for each context in projectContexts:
       propagation = predictContext(context)
       updatePropagation(context.id, propagation)
   ```

2. **Get High-Value Contexts:**
   ```typescript
   getHighValueContexts(project, minScore=0.6, limit=10):
     return findByPredictionScore(minScore, project, limit)
   ```

**Benefits:**
- ✅ Proactive pre-fetching optimization
- ✅ Pattern-based next access estimation
- ✅ Observable prediction reasoning
- ✅ Staleness management with lazy refresh

---

## Hexagonal Architecture

Wake Intelligence uses **Hexagonal Architecture** (Ports & Adapters) to maintain clean separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│                    (MCPRouter)                           │
│                  HTTP Request Routing                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Application Layer                       │
│     (ToolExecutionHandler, MCPProtocolHandler)          │
│              MCP Protocol & Orchestration                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Domain Layer                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Wake Intelligence Brain (3 Layers)               │   │
│  │ • PropagationService (Layer 3)                   │   │
│  │ • MemoryManagerService (Layer 2)                 │   │
│  │ • CausalityService (Layer 1)                     │   │
│  └──────────────────────────────────────────────────┘   │
│         ContextService (Orchestration)                   │
│         ContextSnapshot (Domain Entity)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ ◄─── Ports (Interfaces)
                     │
┌────────────────────▼────────────────────────────────────┐
│                Infrastructure Layer                      │
│    Adapters (Concrete Implementations)                   │
│  • D1ContextRepository → IContextRepository             │
│  • CloudflareAIProvider → IAIProvider                   │
│  • CORSMiddleware                                        │
└─────────────────────────────────────────────────────────┘
```

### Layer Breakdown

#### **Domain Layer** ([src/domain/](src/domain/))
**Purpose:** Pure business logic, infrastructure-agnostic

**Components:**
- **Models:**
  - `ContextSnapshot` - Domain entity with validation ([ContextSnapshot.ts](src/domain/models/ContextSnapshot.ts))
  - Immutable by design (all methods return new instances)

- **Services:**
  - `ContextService` - Main orchestrator ([ContextService.ts](src/domain/services/ContextService.ts))
  - `CausalityService` - Layer 1 logic ([CausalityService.ts](src/domain/services/CausalityService.ts))
  - `MemoryManagerService` - Layer 2 logic ([MemoryManagerService.ts](src/domain/services/MemoryManagerService.ts))
  - `PropagationService` - Layer 3 logic ([PropagationService.ts](src/domain/services/PropagationService.ts))

**Principles:**
- ✅ No infrastructure dependencies
- ✅ Depends only on abstractions (ports)
- ✅ Pure TypeScript, no framework lock-in

#### **Application Layer** ([src/application/](src/application/))
**Purpose:** Orchestrate domain operations, implement use cases

**Components:**
- **Handlers:**
  - `ToolExecutionHandler` - Translate MCP tools to domain operations
  - `MCPProtocolHandler` - Manage JSON-RPC protocol

- **Ports (Interfaces):**
  - `IContextRepository` - Persistence abstraction
  - `IAIProvider` - AI service abstraction

**Principles:**
- ✅ Coordinates domain services
- ✅ Enforces business rules
- ✅ Protocol-specific (MCP JSON-RPC)

#### **Infrastructure Layer** ([src/infrastructure/](src/infrastructure/))
**Purpose:** Technical adapters implementing ports

**Components:**
- **Adapters:**
  - `D1ContextRepository` - Cloudflare D1 implementation
  - `CloudflareAIProvider` - Workers AI implementation

- **Middleware:**
  - `CORSMiddleware` - Cross-origin resource sharing

**Principles:**
- ✅ Implements port interfaces
- ✅ Framework/tech-specific code
- ✅ Swappable (D1 → Postgres without domain changes)

#### **Presentation Layer** ([src/presentation/](src/presentation/))
**Purpose:** HTTP routing and request handling

**Components:**
- `MCPRouter` - Routes HTTP requests to handlers

**Principles:**
- ✅ HTTP-specific logic
- ✅ Request/response transformation
- ✅ Routing logic

#### **Composition Root** ([src/index.ts](src/index.ts))
**Purpose:** Dependency injection

**Workflow:**
```typescript
// 1. Create infrastructure adapters
const repository = new D1ContextRepository(env.DB)
const aiProvider = new CloudflareAIProvider(env.AI)

// 2. Inject into domain services
const contextService = new ContextService(repository, aiProvider)

// 3. Inject into application handlers
const toolHandler = new ToolExecutionHandler(contextService)
const protocolHandler = new MCPProtocolHandler(toolHandler)

// 4. Inject into presentation layer
const router = new MCPRouter(protocolHandler)
```

**Benefits:**
- ✅ Single place for wiring
- ✅ Easy to swap implementations
- ✅ Clear dependency flow

---

## Data Flow

### Example: save_context Flow

```
1. HTTP Request
   │
   ▼
2. MCPRouter (Presentation)
   └─> routes to MCPProtocolHandler
   │
   ▼
3. MCPProtocolHandler (Application)
   └─> parses JSON-RPC, delegates to ToolExecutionHandler
   │
   ▼
4. ToolExecutionHandler (Application)
   └─> maps MCP tool to ContextService.saveContext()
   │
   ▼
5. ContextService (Domain)
   ├─> AIProvider.generateSummary() if content > 200 chars
   ├─> AIProvider.generateTags()
   ├─> CausalityService.recordAction() (Layer 1)
   ├─> MemoryManagerService.calculateMemoryTier() (Layer 2)
   ├─> ContextSnapshot.create() (validation)
   └─> ContextRepository.save()
   │
   ▼
6. D1ContextRepository (Infrastructure)
   └─> INSERT INTO context_snapshots
   │
   ▼
7. Response flows back up the chain
```

### Example: load_context with Layer 3 Pre-fetching

```
1. HTTP Request (load_context)
   │
   ▼
2-4. [Same routing as above]
   │
   ▼
5. ContextService.loadContext()
   ├─> ContextRepository.findByProject()
   ├─> MemoryManagerService.trackAccess() for each result (Layer 2)
   │
   ├─> PropagationService.getHighValueContexts() (Layer 3)
   │   ├─> ContextRepository.findByPredictionScore()
   │   └─> Returns contexts with high prediction scores
   │
   └─> Merge results (prioritize high-value contexts)
   │
   ▼
6. Return contexts (pre-fetched + queried)
```

---

## Database Schema

The database schema supports all 3 layers of Wake Intelligence:

```sql
CREATE TABLE context_snapshots (
  -- Core fields
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata TEXT,
  tags TEXT NOT NULL,
  timestamp TEXT NOT NULL,

  -- Layer 1: Causality Engine (WHY - Past)
  action_type TEXT,           -- decision, implementation, refactor, etc.
  rationale TEXT,             -- WHY this context was created
  dependencies TEXT,          -- JSON array of related context IDs
  caused_by TEXT,             -- Parent context ID in causal chain

  -- Layer 2: Memory Manager (HOW - Present)
  memory_tier TEXT NOT NULL,  -- ACTIVE, RECENT, ARCHIVED, EXPIRED
  last_accessed TEXT,         -- ISO timestamp of last access
  access_count INTEGER DEFAULT 0,

  -- Layer 3: Propagation Engine (WHAT - Future)
  prediction_score REAL,           -- 0.0-1.0 composite score
  last_predicted TEXT,             -- When prediction was calculated
  predicted_next_access TEXT,      -- Estimated next access time
  propagation_reason TEXT          -- JSON array of prediction reasons
);

-- Indexes for efficient queries
CREATE INDEX idx_project ON context_snapshots(project);
CREATE INDEX idx_timestamp ON context_snapshots(timestamp DESC);
CREATE INDEX idx_tags ON context_snapshots(tags);
CREATE INDEX idx_caused_by ON context_snapshots(caused_by);
CREATE INDEX idx_memory_tier ON context_snapshots(memory_tier);
CREATE INDEX idx_last_accessed ON context_snapshots(last_accessed DESC);
CREATE INDEX idx_prediction_score ON context_snapshots(prediction_score DESC);
CREATE INDEX idx_last_predicted ON context_snapshots(last_predicted ASC);
CREATE INDEX idx_project_prediction ON context_snapshots(project, prediction_score DESC);
```

**Migration History:**
- [0001_initial_schema.sql](migrations/0001_initial_schema.sql) - Core context table
- [0002_add_causality_engine.sql](migrations/0002_add_causality_engine.sql) - Layer 1 columns
- [0003_add_memory_manager.sql](migrations/0003_add_memory_manager.sql) - Layer 2 columns
- [0004_add_propagation_engine.sql](migrations/0004_add_propagation_engine.sql) - Layer 3 columns

---

## Dependency Graph

```
ContextService (Domain Orchestrator)
├── PropagationService (Layer 3)
│   └── CausalityService (Layer 1) ─┐
├── MemoryManagerService (Layer 2)  │
│   └── IContextRepository ─────────┤
└── CausalityService (Layer 1)      │
    └── IContextRepository ─────────┤
                                     │
IContextRepository ◄─────────────────┘
└── D1ContextRepository (Adapter)
    └── D1Database (Cloudflare)

IAIProvider
└── CloudflareAIProvider (Adapter)
    └── Ai (Cloudflare Workers AI)
```

**Key Points:**
- Services depend on **abstractions** (IContextRepository, IAIProvider)
- Infrastructure adapters implement abstractions
- Layer 3 depends on Layer 1 for causal scoring
- All layers depend on IContextRepository for persistence

---

## Design Principles

### 1. Semantic Intent as Single Source of Truth
**Every decision is based on meaning, not technical characteristics.**

Example:
```typescript
// ❌ Bad: Technical characteristic
if (content.length > 1000) { /* summarize */ }

// ✅ Good: Semantic intent
if (exceedsHumanReadableSize(content)) {
  summary = generateConciseSummary(content)
}
```

### 2. Observable Property Anchoring
**All behavior anchored to directly observable semantic markers.**

Example (Layer 2 Memory Tiers):
```typescript
// Observable: Time since last access (measurable, no interpretation)
const hoursSince = (now - lastAccessed) / (1000 * 60 * 60)

// Semantic tiers based on observable time
if (hoursSince < 1) return MemoryTier.ACTIVE
if (hoursSince < 24) return MemoryTier.RECENT
// etc.
```

### 3. Intent Preservation Through Transformations
**Semantic contracts maintained across all layers.**

Example:
```typescript
// Domain intent: "Save context with causal tracking"
interface SaveContextInput {
  content: string
  actionType?: ActionType  // WHY this context exists (Layer 1)
}

// Preserved through all layers:
// Application → Domain → Infrastructure
// Each layer maintains the "WHY" intent
```

### 4. Immutable Domain Entities
**Domain entities never mutate - all operations return new instances.**

Example:
```typescript
class ContextSnapshot {
  markAccessed(): ContextSnapshot {
    return new ContextSnapshot(
      this.id,
      this.project,
      // ... all fields
      new Date().toISOString(), // new lastAccessed
      this.accessCount + 1       // new accessCount
    )
  }
}
```

### 5. Dependency Inversion
**High-level modules don't depend on low-level modules. Both depend on abstractions.**

```typescript
// Domain Service (high-level)
class ContextService {
  constructor(
    private repository: IContextRepository,  // ← Abstraction
    private aiProvider: IAIProvider          // ← Abstraction
  ) {}
}

// Infrastructure Adapter (low-level)
class D1ContextRepository implements IContextRepository {
  // Concrete implementation
}
```

**Benefits:**
- ✅ Swap infrastructure (D1 → Postgres) without touching domain
- ✅ Test with mocks easily
- ✅ No circular dependencies

### 6. Deterministic Algorithms
**All predictions and scores use deterministic, explainable algorithms.**

Example (Layer 3 Prediction):
```typescript
// Not a black-box ML model
// Every score component is explainable:
predictionScore =
  0.4 * exponentialDecay(hoursSinceAccess) +  // Temporal
  0.3 * causalChainStrength +                  // Causal
  0.3 * log(accessCount + 1) / log(101)        // Frequency
```

### 7. Progressive Enhancement
**Each layer builds on the previous, adding intelligence.**

```
Layer 1 (Past) → Track causality
   ↓
Layer 2 (Present) → Manage memory based on access
   ↓
Layer 3 (Future) → Predict using causality + memory patterns
```

---

## Performance Considerations

### Indexing Strategy
- **Project queries:** Index on `project` column
- **Time-based queries:** Indexes on `timestamp`, `last_accessed`, `last_predicted`
- **Tier queries:** Index on `memory_tier`
- **Prediction queries:** Composite index on `(project, prediction_score DESC)`

### Lazy Prediction Refresh
Predictions are refreshed lazily (on-demand) or in batches to avoid performance overhead:
```typescript
// Only refresh if stale (default: 24 hours)
if (hoursSincePrediction > staleThreshold) {
  await propagationService.refreshPrediction(context)
}
```

### Fire-and-Forget Access Tracking
Layer 2 access tracking is fire-and-forget to avoid blocking responses:
```typescript
// Don't await - track in background
results.forEach(r => {
  memoryManager.trackAccess(r.id).catch(err => {
    console.error(`Failed to track access for ${r.id}:`, err)
  })
})
```

---

## Testing Strategy

### Unit Tests (70+ tests)
- **Domain Layer:** Pure logic tests (no mocks needed for calculations)
- **Application Layer:** Mock domain services
- **Infrastructure Layer:** Mock external dependencies (D1, AI)

### Integration Tests
- End-to-end flows with in-memory D1 database
- Full Wake Intelligence brain workflows

### Test Co-location
Tests live next to source files:
```
src/domain/services/
├── PropagationService.ts
└── PropagationService.test.ts
```

---

## Future Enhancements

### Potential Layer 4: Meta-Learning
Learn from prediction accuracy to tune weights:
```typescript
// Track prediction accuracy
interface PredictionOutcome {
  contextId: string
  predictedScore: number
  actuallyAccessed: boolean
  predictionTime: string
  accessTime: string | null
}

// Adjust weights based on accuracy
function tuneWeights(outcomes: PredictionOutcome[]) {
  // Optimize weights to minimize prediction error
}
```

### Potential Layer 5: Cross-Project Intelligence
Identify patterns across projects:
```typescript
// Find similar contexts across projects
interface CrossProjectPattern {
  pattern: string
  projects: string[]
  frequency: number
}

// Enable knowledge transfer between projects
```

---

## Conclusion

Wake Intelligence demonstrates how to build a production-ready temporal intelligence system for AI agents with:

1. **Clear architectural layers** - Domain, Application, Infrastructure, Presentation
2. **3-layer brain system** - Past (causality), Present (memory), Future (prediction)
3. **Observable reasoning** - Every decision is explainable
4. **Semantic intent preservation** - Meaning maintained through all transformations
5. **Deterministic algorithms** - No black-box ML, full transparency

The result is an **AI-friendly codebase** that's maintainable, testable, and extensible.
