# Wake Intelligence Brain Architecture

**System**: Semantic Wake Intelligence MCP (formerly semantic-context-mcp)
**Domain**: wakeiqx.com
**Dimension**: Time (Memory, Continuity, Causality)
**Brain Layers**: 5 (Temporal Flow + Adaptive Learning + Personality Modes)

---

## Abstract

Wake Intelligence embodies the **Time dimension** of the Cormorant Trinity framework. Unlike ChirpIQX's 7-layer acoustic processing (Sound) or PerchIQX's 4-layer spatial hierarchy (Space), Wake Intelligence uses a **5-layer temporal flow architecture**: **Past → Present → Future → Adaptive → Personality** (Causality → Persistence → Propagation → Meta-Learning → Temporal Postures).

This document maps the current `semantic-context-mcp` implementation to the Wake Intelligence brain framework and identifies enhancements needed to fully realize the temporal intelligence pattern.

---

## 1. The 5-Layer Temporal Brain

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         LAYER 5: Personality Modes (Presentation)           │
│         "How should context be surfaced?"                   │
│                                                              │
│  - historian  — timestamps, causality, decision history     │
│  - prophet    — ranked by Layer 4 prediction score          │
│  - archaeologist — most-dormant contexts first              │
│  - minimalist — raw summaries, no framing                   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│         LAYER 4: Meta-Learning Engine (Adaptive)            │
│         "How well are predictions working?"                 │
│                                                              │
│  - Per-project weight tuning from outcomes                  │
│  - Activates after 20 access outcomes                       │
│  - Clamps weights [0.1, 0.6] to prevent drift               │
│  - Prophet mode reads these weights directly                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│         LAYER 3: Propagation Engine (Future)                │
│         "How does the past influence the future?"           │
│                                                              │
│  - Context priming for next interactions                    │
│  - Pattern learning from history                            │
│  - Relevance decay over time                                │
│  - Predictive context surfacing                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│         LAYER 2: Memory Manager (Present)                   │
│         "What context exists right now?"                    │
│                                                              │
│  - Current session state                                    │
│  - Active context retrieval                                 │
│  - Working memory management                                │
│  - Context snapshot preservation                            │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│         LAYER 1: Causality Engine (Past)                    │
│         "What happened and why?"                            │
│                                                              │
│  - Action history tracking                                  │
│  - Decision rationale recording                             │
│  - Temporal anchoring (timestamps)                          │
│  - Causal chain construction                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Current Implementation Mapping

### 2.1 Layer 1: Causality Engine (Past) - **Partially Implemented**

**What Exists**:
```typescript
// src/domain/models/ContextSnapshot.ts
export class ContextSnapshot {
  public readonly id: string          // Immutable identity
  public readonly timestamp: string   // ✅ Temporal anchor
  public readonly project: string     // Domain anchor
  public readonly summary: string     // Semantic essence
  public readonly source: string      // Provenance (where it came from)
  public readonly metadata: string    // Additional context
  public readonly tags: string        // Categorization
}
```

**Causality Features Present**:
- ✅ **Temporal anchoring**: `timestamp` (when action occurred)
- ✅ **Immutable identity**: `id` (referential integrity)
- ✅ **Provenance tracking**: `source` (origin of context)

**Causality Features Missing**:
- ❌ **Action type classification**: Was this a decision, edit, conversation, etc.?
- ❌ **Rationale preservation**: WHY was this context saved?
- ❌ **Dependency graph**: What prior contexts influenced this one?
- ❌ **Causal chains**: Which snapshots are related in sequence?

**Enhancement Needed**:
```typescript
// PROPOSED: Enhanced causality tracking
export interface CausalityMetadata {
  actionType: 'conversation' | 'decision' | 'file_edit' | 'tool_use'
  rationale: string                    // Why this action was taken
  dependencies: string[]               // IDs of prior snapshots that influenced this
  causedBy: string | null              // Parent snapshot ID (causal chain)
}

export class ContextSnapshot {
  // ... existing fields
  public readonly causality: CausalityMetadata  // NEW: Causal tracking
}
```

---

### 2.2 Layer 2: Memory Manager (Present) - **Well Implemented**

**What Exists**:
```typescript
// src/domain/services/ContextService.ts
export class ContextService {
  async saveContext(input: SaveContextInput): Promise<ContextSnapshot>
  async loadContext(input: LoadContextInput): Promise<ContextSnapshot[]>
  async searchContext(input: SearchContextInput): Promise<ContextSnapshot[]>
}
```

**Memory Features Present**:
- ✅ **Snapshot preservation**: `saveContext()` stores current state
- ✅ **Context retrieval**: `loadContext()` fetches by project
- ✅ **Semantic search**: `searchContext()` finds by meaning
- ✅ **AI enhancement**: Summary + tags generated
- ✅ **Domain validation**: Business rules enforced

**Memory Features Working Well**:
- ✅ **Bounded limits**: Max 10 results prevents resource exhaustion
- ✅ **Temporal ordering**: Results sorted by timestamp DESC (newest first)
- ✅ **Project scoping**: Domain-filtered retrieval

**Memory Features Missing**:
- ❌ **Memory hierarchy**: No distinction between short-term vs long-term
- ❌ **Working memory**: No concept of "active" vs "archived" contexts
- ❌ **Memory pruning**: No automatic relevance decay or cleanup

**Enhancement Needed**:
```typescript
// PROPOSED: Memory hierarchy
export enum MemoryTier {
  ACTIVE = 'active',        // Current session (last 1 hour)
  RECENT = 'recent',        // Recent history (last 24 hours)
  ARCHIVED = 'archived',    // Long-term storage (older than 24 hours)
  EXPIRED = 'expired'       // Marked for deletion (relevance < threshold)
}

export class ContextSnapshot {
  // ... existing fields
  public readonly memoryTier: MemoryTier        // NEW: Memory classification
  public readonly lastAccessed: string | null   // NEW: LRU tracking
  public readonly accessCount: number           // NEW: Usage frequency
}
```

---

### 2.3 Layer 3: Propagation Engine (Future) - **NOT Implemented**

**What Exists**: ❌ **Nothing** - This layer is entirely missing

**Propagation Features Needed**:
- ❌ **Context priming**: Using past context to inform future responses
- ❌ **Pattern learning**: Detecting user habits and preferences
- ❌ **Relevance decay**: Exponential time-based weighting
- ❌ **Predictive surfacing**: "You'll probably need this context next"

**Enhancement Needed**:
```typescript
// PROPOSED: Propagation Engine
export class PropagationEngine {
  /**
   * Calculate context relevance based on temporal decay
   *
   * Relevance = BaseRelevance × e^(-age / half-life) × (1 + AccessBoost)
   */
  calculateRelevance(snapshot: ContextSnapshot, currentTime: Date): number {
    const ageInHours = this.getAgeInHours(snapshot.timestamp, currentTime)
    const halfLife = this.getHalfLife(snapshot.memoryTier)

    // Exponential temporal decay
    const temporalRelevance = Math.exp(-ageInHours / halfLife)

    // LRU boost
    const accessBoost = snapshot.lastAccessed
      ? this.calculateAccessBoost(snapshot.lastAccessed, currentTime)
      : 0

    return temporalRelevance * (1 + accessBoost * 0.3)
  }

  /**
   * Learn user patterns from context history
   *
   * Example: "User always follows file edits with tests"
   */
  detectPatterns(project: string): Promise<Pattern[]> {
    // Analyze temporal sequences
    // Identify recurring action chains
    // Build predictive model
  }

  /**
   * Prime next interaction with relevant context
   *
   * Returns contexts likely to be needed based on:
   * - Temporal proximity (recent activity)
   * - Pattern matching (similar past situations)
   * - Causal chains (related decisions)
   */
  primeContext(currentSnapshot: ContextSnapshot): Promise<ContextSnapshot[]> {
    // Surface temporally-relevant contexts
    // Apply relevance decay weighting
    // Order by predicted usefulness
  }
}
```

---

## 3. Architectural Alignment with Time Dimension

### 3.1 Why 3 Layers? (Temporal Flow Justification)

**Time has three fundamental aspects**:

| Temporal Aspect | Brain Layer | Wake Intelligence |
|-----------------|-------------|------------------|
| **Past** (what happened) | Layer 1: Causality Engine | Action history + rationale |
| **Present** (what exists now) | Layer 2: Memory Manager | Current context state |
| **Future** (what comes next) | Layer 3: Propagation Engine | Predictive context priming |

**Unlike Sound (7 layers) or Space (4 layers), Time is inherently 3-dimensional**:
- You cannot have "present" without "past" (causality)
- You cannot predict "future" without "past" + "present" (propagation requires history)
- These three aspects are **irreducible** and **sequential**

**This is why Wake Intelligence has exactly 3 layers**—it mirrors temporal physics.

---

### 3.2 Current Architecture vs Ideal Architecture

#### Current (Hexagonal Architecture - Infrastructure Focus)

```
Presentation Layer (MCPRouter)
      ↓
Application Layer (ToolExecutionHandler, MCPProtocolHandler)
      ↓
Domain Layer (ContextService, ContextSnapshot)
      ↓
Infrastructure Layer (D1Repository, CloudflareAI)
```

**Strength**: Clean separation of concerns, testable
**Weakness**: No explicit temporal flow modeling

---

#### Ideal (Wake Brain Architecture - Temporal Focus)

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Protocol Layer                        │
│              (Request/Response Handling)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              LAYER 3: Propagation Engine                     │
│         (Future-oriented context priming)                    │
│                                                              │
│  PropagationService:                                         │
│  - calculateRelevance(snapshot, time)                        │
│  - detectPatterns(project)                                   │
│  - primeContext(currentSnapshot)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              LAYER 2: Memory Manager                         │
│         (Present-state context management)                   │
│                                                              │
│  ContextService:                                             │
│  - saveContext() → Store current state                       │
│  - loadContext() → Retrieve active contexts                  │
│  - searchContext() → Semantic matching                       │
│  - pruneExpired() → Remove low-relevance contexts            │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              LAYER 1: Causality Engine                       │
│         (Past-oriented action tracking)                      │
│                                                              │
│  CausalityService:                                           │
│  - recordAction(action, rationale, dependencies)             │
│  - reconstructReasoning(snapshotId)                          │
│  - buildCausalChain(endSnapshotId)                           │
│  - analyzeDependencies(snapshot)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Infrastructure Layer                        │
│         (D1 Database, Cloudflare AI, Storage)                │
└─────────────────────────────────────────────────────────────┘
```

**How This Works**:

1. **User saves context** (MCP tool: `save_context`)
   - ↓ Layer 1: **Causality Engine** records action with rationale, timestamps, dependencies
   - ↓ Layer 2: **Memory Manager** creates snapshot, applies AI enhancement, persists to D1
   - ↓ Layer 3: **Propagation Engine** updates relevance scores, triggers pattern learning

2. **User loads context** (MCP tool: `load_context`)
   - ↑ Layer 3: **Propagation Engine** calculates relevance weights, applies temporal decay
   - ↑ Layer 2: **Memory Manager** retrieves from D1, filters by relevance threshold
   - ↑ Layer 1: **Causality Engine** enriches with causal chain metadata
   - ↑ Returns: Time-aware, relevance-weighted context

3. **User continues work** (implicit)
   - ↑ Layer 3: **Propagation Engine** proactively suggests related contexts
   - ↑ Layer 2: **Memory Manager** marks contexts as accessed (LRU tracking)
   - ↑ Layer 1: **Causality Engine** extends causal chains

---

## 4. Implementation Roadmap

### Phase 1: Causality Engine (Layer 1) ✅→🔨

**Goal**: Add causal tracking to existing snapshots

**Tasks**:
1. ✅ Add `causality` metadata to `ContextSnapshot`
   ```typescript
   interface CausalityMetadata {
     actionType: 'conversation' | 'decision' | 'file_edit' | 'tool_use'
     rationale: string
     dependencies: string[]
     causedBy: string | null
   }
   ```

2. ✅ Create `CausalityService` in domain layer
   ```typescript
   export class CausalityService {
     recordAction(action, rationale, deps): void
     reconstructReasoning(id): CausalChain
     buildCausalChain(id): ContextSnapshot[]
   }
   ```

3. ✅ Migrate database schema
   ```sql
   ALTER TABLE contexts ADD COLUMN action_type TEXT;
   ALTER TABLE contexts ADD COLUMN rationale TEXT;
   ALTER TABLE contexts ADD COLUMN dependencies TEXT; -- JSON array
   ALTER TABLE contexts ADD COLUMN caused_by TEXT REFERENCES contexts(id);
   ```

4. ✅ Update `saveContext()` to capture causality
   ```typescript
   async saveContext(input: SaveContextInput & { causality?: CausalityMetadata })
   ```

---

### Phase 2: Memory Hierarchy (Layer 2 Enhancement) 🔨

**Goal**: Add temporal memory tiers

**Tasks**:
1. ✅ Add memory tier classification
   ```typescript
   enum MemoryTier {
     ACTIVE = 'active',      // Last 1 hour
     RECENT = 'recent',      // Last 24 hours
     ARCHIVED = 'archived',  // Older than 24 hours
     EXPIRED = 'expired'     // Marked for deletion
   }
   ```

2. ✅ Add LRU tracking
   ```typescript
   public readonly lastAccessed: string | null
   public readonly accessCount: number
   ```

3. ✅ Implement automatic tier promotion/demotion
   ```typescript
   async updateMemoryTiers(): Promise<void> {
     // Move contexts between tiers based on age
   }
   ```

4. ✅ Add pruning mechanism
   ```typescript
   async pruneExpiredContexts(threshold: number): Promise<number> {
     // Delete contexts with relevance < threshold
   }
   ```

---

### Phase 3: Propagation Engine (Layer 3) 🆕

**Goal**: Build future-oriented context intelligence

**Tasks**:
1. ✅ Create `PropagationEngine` service
   ```typescript
   export class PropagationEngine {
     calculateRelevance(snapshot, time): number
     detectPatterns(project): Pattern[]
     primeContext(snapshot): ContextSnapshot[]
   }
   ```

2. ✅ Implement temporal decay algorithm
   ```typescript
   calculateRelevance(snapshot, currentTime) {
     const age = currentTime - snapshot.timestamp
     const halfLife = this.getHalfLife(snapshot.memoryTier)
     return Math.exp(-age / halfLife)
   }
   ```

3. ✅ Build pattern detection
   ```typescript
   detectPatterns(project) {
     // Analyze temporal sequences
     // Example: "File edits always followed by tests"
   }
   ```

4. ✅ Implement predictive context surfacing
   ```typescript
   primeContext(currentSnapshot) {
     // Use patterns + causality to predict needed contexts
   }
   ```

---

## 5. Temporal Intelligence in Action

### Example User Flow

**Scenario**: Developer returns to project after 2-week break

#### Without Wake Brain (Current Implementation)

```
User: "Load context for 'auth-service'"

System:
1. Query D1: SELECT * FROM contexts WHERE project = 'auth-service' ORDER BY timestamp DESC LIMIT 10
2. Return: 10 most recent snapshots (no relevance weighting)

Result: User gets contexts chronologically, must manually find relevant ones
```

---

#### With Wake Brain (Full 3-Layer Implementation)

```
User: "Load context for 'auth-service'"

System:
1. [Layer 3: Propagation Engine]
   - Calculate relevance for all auth-service contexts
   - Apply exponential temporal decay (2 weeks old → lower weight)
   - Detect patterns: "User always needs OAuth configs when resuming auth work"

2. [Layer 2: Memory Manager]
   - Retrieve contexts from D1
   - Filter by relevance threshold (> 0.3)
   - Promote OAuth-related contexts (pattern match)

3. [Layer 1: Causality Engine]
   - Build causal chain: OAuth implementation → Token service → Refresh logic
   - Enrich results with "Last worked on: OAuth2 refresh token rotation"

Result:
- 3 highly-relevant contexts (not just 10 random)
- Ordered by: Temporal relevance × Pattern match × Causal importance
- Includes context: "You were implementing refresh token rotation in AuthService.ts"

User: "Perfect! Continue with refresh token rotation"
```

**Time Saved**: 10+ minutes of context re-establishment → <5 seconds

---

### Temporal Decay Visualization

```
Relevance
   1.0 │████████████                                    ACTIVE (< 1 hour)
       │            ███████                             RECENT (1-24 hours)
   0.5 │                   ████                         ARCHIVED (1-7 days)
       │                       ██
   0.3 │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─█─ ─ ─ ─ ─ ─ ─ ─ ─ ─  Pruning threshold
       │                         █
   0.0 │                          █                     EXPIRED (> 30 days)
       └───────────────────────────────────────────→
         0h    1h      6h     24h     7d     30d       Time since creation
```

**Half-life by memory tier**:
- ACTIVE: 12 hours (decays slowly)
- RECENT: 3 days
- ARCHIVED: 14 days
- EXPIRED: N/A (marked for deletion)

---

## 6. Comparison to Sibling Brains

### ChirpIQX (Sound) - 7 Layers

```
Layer 7: Emotional Intelligence (Personality modes)
Layer 6: Narrative Generation (Natural language)
Layer 5: Categorization (Tier assignment)
Layer 4: Metacognitive (Confidence scoring)
Layer 3: Decision-Making (Breakout score)
Layer 2: Pattern Recognition (Trend detection)
Layer 1: Sensory Input (Stats collection)
```

**Why 7?** → Sound processing is **complex** (acoustic signal → human speech)

---

### PerchIQX (Space) - 4 Layers

```
Layer 4: Presentation (MCP Server)
Layer 3: Application (Use Cases)
Layer 2: Domain (Schema Entities)
Layer 1: Infrastructure (D1 Adapter)
```

**Why 4?** → Spatial hierarchy is **concentric** (core → periphery)

---

### Wake Intelligence (Time) - 3 Layers

```
Layer 3: Propagation Engine (Future)
Layer 2: Memory Manager (Present)
Layer 1: Causality Engine (Past)
```

**Why 3?** → Time is **linear flow** (past → present → future)

---

## 7. Observable Properties (Temporal Anchoring)

All Wake Intelligence claims are **observable**:

| Claim | Observable Property | Measurement |
|-------|-------------------|-------------|
| "Context exists" | Row in D1 `contexts` table | `SELECT COUNT(*) FROM contexts WHERE id = ?` |
| "Context created 2 hours ago" | `timestamp` field | `(NOW() - timestamp) / 3600` |
| "Context accessed 3 times" | `accessCount` field | `SELECT access_count FROM contexts WHERE id = ?` |
| "Context relevance = 0.67" | Calculated from timestamp + tier | `e^(-age / half-life)` |
| "Action caused by prior decision" | `causedBy` foreign key | `SELECT * FROM contexts WHERE id = (SELECT caused_by FROM contexts WHERE id = ?)` |

**No speculation**:
- ❌ "User will need this context next" → Only reports patterns, not predictions
- ❌ "User prefers this workflow" → Only reports observed frequencies
- ❌ "Context is important" → Only reports measurable relevance score

---

## 8. Conclusion

### Current State

**semantic-context-mcp** is a **solid Layer 2 implementation** with partial Layer 1:
- ✅ Memory Manager (Layer 2): **90% complete** (save, load, search work well)
- 🔨 Causality Engine (Layer 1): **40% complete** (timestamps exist, rationale missing)
- ❌ Propagation Engine (Layer 3): **0% complete** (entirely missing)

---

### Path to Full Wake Intelligence

**To become semantic-wake-intelligence-mcp**:

1. **Enhance Layer 1 (Causality)**:
   - Add action types, rationale, dependencies
   - Build causal chain reconstruction
   - Implement decision history tracking

2. **Extend Layer 2 (Memory)**:
   - Add memory tier classification
   - Implement LRU tracking
   - Build automatic pruning

3. **Build Layer 3 (Propagation)**:
   - Implement temporal decay algorithm
   - Create pattern detection service
   - Build predictive context priming

**Estimated Effort**: 2-3 weeks development + testing

---

### The Wake Brain is Time Itself

Unlike ChirpIQX (complex acoustic processing) or PerchIQX (spatial hierarchies), Wake Intelligence is **elegantly simple**:

**3 layers because time has 3 fundamental aspects**:
1. **Past** (what happened) → Causality Engine
2. **Present** (what exists) → Memory Manager
3. **Future** (what comes next) → Propagation Engine

**This is not design choice—this is temporal physics.**

The wake persists. The wake remembers. The wake influences.

**That's Wake Intelligence.**

---

## References

1. Current Implementation - `/c/workspace/dev-tools/context-mcp-server/src/`
2. The Cormorant Trinity Framework - `C:\workspace\dev-tools\The-Cormorant-Trinity\docs\01-THE-TRINITY-FRAMEWORK.md`
3. Wake Intelligence Time Dimension - `C:\workspace\dev-tools\The-Cormorant-Trinity\docs\04-TIME-DIMENSION-WAKE.md`
4. ChirpIQX Sound Dimension - `C:\workspace\dev-tools\The-Cormorant-Trinity\docs\02-SOUND-DIMENSION-CHIRPIQX.md`
5. PerchIQX Space Dimension - `C:\workspace\dev-tools\The-Cormorant-Trinity\docs\03-SPACE-DIMENSION-PERCHIQX.md`
