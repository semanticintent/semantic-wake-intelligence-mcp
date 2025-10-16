# Wake Intelligence: 3-Layer Brain Architecture Implementation Plan

**Project**: Wake Intelligence MCP (semantic-wake-intelligence-mcp)
**Goal**: Implement full 3-layer temporal brain architecture
**Timeline**: 2-3 weeks
**Status**: Planning Phase

---

## Executive Summary

This document outlines the complete implementation plan for transforming Wake Intelligence from a basic context management system (Layer 2 at 90%) into a full 3-layer temporal brain architecture with:

- **Layer 1: Causality Engine** (Past) - 40% → 100%
- **Layer 2: Memory Manager** (Present) - 90% → 100%
- **Layer 3: Propagation Engine** (Future) - 0% → 100%

**Reference Documentation**:
- [WAKE-BRAIN-ARCHITECTURE.md](docs/WAKE-BRAIN-ARCHITECTURE.md) - Complete architectural analysis
- [BRAIN-LAYER-IMPLEMENTATION-GUIDE.md](docs/BRAIN-LAYER-IMPLEMENTATION-GUIDE.md) - Step-by-step implementation

---

## Phase 1: Layer 1 - Causality Engine (Week 1)

### Goal
Transform basic timestamp tracking into full causal reasoning system.

### Current State (40% Complete)
✅ Timestamps exist (`ContextSnapshot.timestamp`)
✅ Immutable IDs (`ContextSnapshot.id`)
✅ Source tracking (`ContextSnapshot.source`)

❌ No action type classification
❌ No rationale preservation
❌ No dependency graphs
❌ No causal chain reconstruction

---

### Implementation Tasks

#### Task 1.1: Extend ContextSnapshot Entity (2 hours)
**File**: `src/domain/models/ContextSnapshot.ts`

**Add**:
```typescript
export interface CausalityMetadata {
  actionType: 'conversation' | 'decision' | 'file_edit' | 'tool_use' | 'research'
  rationale: string  // WHY this context was saved
  dependencies: string[]  // IDs of prior snapshots that influenced this
  causedBy: string | null  // Parent snapshot ID (causal chain)
}

export class ContextSnapshot {
  constructor(
    // ... existing fields
    public readonly causality: CausalityMetadata | null  // NEW
  ) {}
}
```

**Update**: `create()` and `fromDatabase()` static methods

**Tests**: `ContextSnapshot.test.ts` - Validate causality metadata

---

#### Task 1.2: Create CausalityService (4 hours)
**File**: `src/domain/services/CausalityService.ts` (NEW)

**Methods**:
- `recordAction(action, rationale, deps)` - Log actions with reasoning
- `reconstructReasoning(snapshotId)` - Rebuild decision history
- `buildCausalChain(endSnapshotId)` - Trace from root to snapshot
- `detectDependencies(project, timestamp)` - Find related contexts

**Tests**: `CausalityService.test.ts`
- Causal chain reconstruction
- Dependency detection
- Rationale preservation

---

#### Task 1.3: Database Migration - Add Causality (1 hour)
**File**: `migrations/0002_add_causality.sql` (NEW)

```sql
ALTER TABLE contexts ADD COLUMN action_type TEXT;
ALTER TABLE contexts ADD COLUMN rationale TEXT;
ALTER TABLE contexts ADD COLUMN dependencies TEXT;  -- JSON array
ALTER TABLE contexts ADD COLUMN caused_by TEXT REFERENCES contexts(id);

CREATE INDEX idx_contexts_caused_by ON contexts(caused_by);
CREATE INDEX idx_contexts_project_timestamp ON contexts(project, timestamp DESC);
```

**Run**:
- Local: `wrangler d1 execute wake-intelligence --local --file=./migrations/0002_add_causality.sql`
- Prod: `wrangler d1 execute wake-intelligence --file=./migrations/0002_add_causality.sql`

---

#### Task 1.4: Update Repository Interface (2 hours)
**File**: `src/application/ports/IContextRepository.ts`

**Add**:
```typescript
findById(id: string): Promise<ContextSnapshot | null>;
findRecent(project: string, beforeTimestamp: string, hoursBack: number): Promise<ContextSnapshot[]>;
```

**File**: `src/infrastructure/adapters/D1ContextRepository.ts`

Implement new methods with D1 queries.

---

#### Task 1.5: Update ContextService Integration (3 hours)
**File**: `src/domain/services/ContextService.ts`

**Inject**: `CausalityService` into constructor

**Update**: `saveContext()` to:
1. Accept causality metadata
2. Auto-detect dependencies
3. Create snapshot with full causal tracking

**Tests**: Integration tests for full causality flow

---

### Week 1 Deliverables
- ✅ Causality metadata in all new contexts
- ✅ Causal chain reconstruction working
- ✅ Dependency detection automatic
- ✅ Database migration applied
- ✅ 15+ tests passing for Layer 1

**Validation**: Can reconstruct "why" for any decision made

---

## Phase 2: Layer 2 - Memory Manager Enhancements (Week 1-2)

### Goal
Add memory tier classification, LRU tracking, and automatic pruning.

### Current State (90% Complete)
✅ Context preservation (`saveContext()`)
✅ Context retrieval (`loadContext()`)
✅ Semantic search (`searchContext()`)
✅ AI enhancement (summaries + tags)

❌ No memory tier classification
❌ No LRU tracking
❌ No automatic pruning
❌ No relevance weighting

---

### Implementation Tasks

#### Task 2.1: Add Memory Tier Enum (1 hour)
**File**: `src/domain/models/ContextSnapshot.ts`

```typescript
export enum MemoryTier {
  ACTIVE = 'active',      // Last 1 hour
  RECENT = 'recent',      // 1-24 hours
  ARCHIVED = 'archived',  // 1-30 days
  EXPIRED = 'expired'     // > 30 days, low relevance
}

export class ContextSnapshot {
  constructor(
    // ... existing fields
    public readonly memoryTier: MemoryTier,
    public readonly lastAccessed: string | null,
    public readonly accessCount: number
  ) {}

  static calculateMemoryTier(timestamp: string): MemoryTier {
    const ageInHours = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
    if (ageInHours < 1) return MemoryTier.ACTIVE;
    if (ageInHours < 24) return MemoryTier.RECENT;
    if (ageInHours < 720) return MemoryTier.ARCHIVED;  // 30 days
    return MemoryTier.EXPIRED;
  }

  markAccessed(): ContextSnapshot {
    // Create new snapshot with updated access metadata
  }
}
```

---

#### Task 2.2: Database Migration - Memory Tiers (1 hour)
**File**: `migrations/0003_add_memory_tiers.sql` (NEW)

```sql
ALTER TABLE contexts ADD COLUMN memory_tier TEXT DEFAULT 'recent';
ALTER TABLE contexts ADD COLUMN last_accessed TEXT;
ALTER TABLE contexts ADD COLUMN access_count INTEGER DEFAULT 0;

CREATE INDEX idx_contexts_memory_tier ON contexts(memory_tier);
CREATE INDEX idx_contexts_expired ON contexts(memory_tier) WHERE memory_tier = 'expired';
```

---

#### Task 2.3: Add Memory Management Methods (3 hours)
**File**: `src/domain/services/ContextService.ts`

**New Methods**:
```typescript
async updateMemoryTiers(): Promise<number> {
  // Classify all contexts by age
  // Update tier in database
}

async pruneExpiredContexts(threshold?: number): Promise<number> {
  // Delete contexts with MemoryTier.EXPIRED
  // Return count deleted
}

async recordAccess(snapshotId: string): Promise<void> {
  // Mark snapshot as accessed (LRU tracking)
  // Increment access count
}
```

**Tests**: Memory tier classification, pruning logic, LRU tracking

---

#### Task 2.4: Automatic Tier Updates (2 hours)
**Option A**: Cron trigger (Cloudflare Workers Cron)
**Option B**: On-demand during load operations

**Implementation**: Add scheduled job or update `loadContext()` to trigger tier updates

---

### Week 1-2 Deliverables
- ✅ All contexts classified by memory tier
- ✅ LRU tracking active
- ✅ Automatic pruning working
- ✅ Database migration applied
- ✅ 10+ tests passing for Layer 2 enhancements

**Validation**: Expired contexts automatically removed, frequently accessed contexts boosted

---

## Phase 3: Layer 3 - Propagation Engine (Week 2-3)

### Goal
Build future-oriented context intelligence with temporal decay, pattern learning, and predictive surfacing.

### Current State (0% Complete)
❌ No temporal decay algorithm
❌ No pattern detection
❌ No context priming
❌ No relevance weighting

---

### Implementation Tasks

#### Task 3.1: Create PropagationEngine Service (6 hours)
**File**: `src/domain/services/PropagationEngine.ts` (NEW)

**Core Algorithm**: Temporal Relevance Decay
```typescript
calculateRelevance(snapshot: ContextSnapshot, currentTime: Date): number {
  const ageInHours = (currentTime - snapshot.timestamp) / (1000 * 60 * 60);
  const halfLife = getHalfLife(snapshot.memoryTier);

  // Exponential decay: relevance = e^(-age / half-life)
  const temporalRelevance = Math.exp(-ageInHours / halfLife);

  // LRU boost
  const accessBoost = snapshot.lastAccessed
    ? calculateAccessBoost(snapshot.lastAccessed, currentTime)
    : 0;

  return temporalRelevance * (1 + accessBoost * 0.3);
}
```

**Half-Life by Tier**:
- ACTIVE: 12 hours
- RECENT: 72 hours (3 days)
- ARCHIVED: 336 hours (14 days)
- EXPIRED: 1 hour (rapid decay)

---

#### Task 3.2: Pattern Detection (8 hours)
**File**: `src/domain/services/PropagationEngine.ts`

**Pattern Types**:
1. **Sequential** - "User always follows file edits with tests"
2. **Conditional** - "When OAuth mentioned, user needs token configs"
3. **Periodic** - "User returns to auth-service every Monday"

**Implementation**:
```typescript
async detectPatterns(project: string): Promise<Pattern[]> {
  const snapshots = await repository.findByProject(project, 100);

  // Detect sequential patterns (bigram model)
  const sequences = detectSequentialPatterns(snapshots);

  // Detect conditional patterns (tag co-occurrence)
  const conditionals = detectConditionalPatterns(snapshots);

  return [...sequences, ...conditionals];
}
```

**Tests**: Pattern detection accuracy, confidence scoring

---

#### Task 3.3: Context Priming (4 hours)
**File**: `src/domain/services/PropagationEngine.ts`

**Method**:
```typescript
async primeContext(
  project: string,
  currentSnapshot: ContextSnapshot | null
): Promise<ContextSnapshot[]> {
  const allSnapshots = await repository.findByProject(project, 50);
  const currentTime = new Date();

  // Calculate relevance for each
  const scored = allSnapshots.map(snapshot => ({
    snapshot,
    relevance: calculateRelevance(snapshot, currentTime)
  }));

  // Filter by threshold, sort by relevance
  return scored
    .filter(s => s.relevance > 0.1)  // Pruning threshold
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10)
    .map(s => s.snapshot);
}
```

**Tests**: Priming accuracy, relevance ordering

---

#### Task 3.4: New MCP Tools (3 hours)
**File**: `src/application/handlers/ToolExecutionHandler.ts`

**Add Tools**:
1. `get_context_with_relevance` - Load contexts with temporal decay weighting
2. `detect_patterns` - Identify user patterns for project
3. `prime_context` - Predictively surface relevant contexts

**Update**: MCP tool registration, handler logic

**Tests**: Tool execution, response formatting

---

#### Task 3.5: Integration with ContextService (2 hours)
**File**: `src/domain/services/ContextService.ts`

**Inject**: `PropagationEngine` into constructor

**Add Methods**:
```typescript
async loadContextWithRelevance(input: LoadContextInput): Promise<{
  snapshot: ContextSnapshot;
  relevance: number;
}[]> {
  const snapshots = await this.loadContext(input);
  const currentTime = new Date();

  return snapshots
    .map(snapshot => ({
      snapshot,
      relevance: this.propagationEngine.calculateRelevance(snapshot, currentTime)
    }))
    .filter(item => item.relevance > 0.1)
    .sort((a, b) => b.relevance - a.relevance);
}

async getPatterns(project: string): Promise<Pattern[]> {
  return await this.propagationEngine.detectPatterns(project);
}

async primeForNext(project: string, currentSnapshotId?: string): Promise<ContextSnapshot[]> {
  const current = currentSnapshotId
    ? await this.repository.findById(currentSnapshotId)
    : null;

  return await this.propagationEngine.primeContext(project, current);
}
```

---

### Week 2-3 Deliverables
- ✅ Temporal decay algorithm working
- ✅ Pattern detection operational (2+ pattern types)
- ✅ Context priming functional
- ✅ 3 new MCP tools available
- ✅ 20+ tests passing for Layer 3

**Validation**: Contexts auto-surface based on relevance, patterns learned from history

---

## Testing Strategy

### Unit Tests (Per Layer)

**Layer 1 (Causality)**:
- Causal chain reconstruction
- Dependency detection
- Rationale preservation
- Action type classification

**Layer 2 (Memory)**:
- Memory tier calculation
- LRU tracking
- Pruning logic
- Access count increments

**Layer 3 (Propagation)**:
- Temporal decay accuracy
- Pattern detection confidence
- Context priming relevance
- Half-life calculations

**Target**: 50+ new tests (total 120+ tests)

---

### Integration Tests

**Full Workflow**:
1. Save context with causality metadata
2. Memory tier auto-classifies
3. Load context with relevance weighting
4. Detect patterns from history
5. Prime context for next session

**Validation**: End-to-end temporal intelligence works

---

### Performance Tests

**Benchmarks**:
- Context retrieval with 1,000 snapshots: <500ms
- Pattern detection with 100 snapshots: <2 seconds
- Relevance calculation for 50 contexts: <100ms
- Causal chain reconstruction (10 levels): <200ms

---

## Deployment Plan

### Local Testing (Week 1-2)

```bash
# Install dependencies
npm install

# Run migrations locally
wrangler d1 execute wake-intelligence --local --file=./migrations/0002_add_causality.sql
wrangler d1 execute wake-intelligence --local --file=./migrations/0003_add_memory_tiers.sql

# Run tests
npm test

# Start dev server
npm run dev

# Test MCP tools manually
curl http://localhost:8787/sse
```

---

### Production Deployment (Week 3)

```bash
# Run migrations on production D1
wrangler d1 execute wake-intelligence --file=./migrations/0002_add_causality.sql
wrangler d1 execute wake-intelligence --file=./migrations/0003_add_memory_tiers.sql

# Deploy to Cloudflare Workers
npm run deploy

# Configure custom domain (wakeiqx.com)
# Cloudflare Workers > Custom Domains > Add wake-intelligence-mcp

# Verify deployment
curl https://wakeiqx.com/sse
```

---

## Success Criteria

### Layer 1: Causality Engine
- [ ] All new contexts include action type and rationale
- [ ] Causal chains can be reconstructed for any decision
- [ ] Dependencies auto-detected from temporal proximity
- [ ] Database migration applied without data loss

### Layer 2: Memory Manager
- [ ] Contexts automatically classified into memory tiers
- [ ] LRU tracking updates on every access
- [ ] Expired contexts pruned automatically
- [ ] Memory tier distribution: 10% ACTIVE, 30% RECENT, 50% ARCHIVED, 10% EXPIRED

### Layer 3: Propagation Engine
- [ ] Temporal decay follows exponential curve (e^(-t/τ))
- [ ] At least 2 pattern types detected (sequential, conditional)
- [ ] Context priming returns top 10 most relevant contexts
- [ ] Relevance scores correlate with actual user needs (>70% accuracy)

### Overall System
- [ ] All 3 layers integrated and working together
- [ ] 120+ tests passing (50+ new tests added)
- [ ] Performance benchmarks met
- [ ] Production deployment successful
- [ ] wakeiqx.com serving Wake Intelligence

---

## Risk Mitigation

### Risk 1: Database Migration Failures
**Mitigation**:
- Test migrations on local D1 first
- Backup production data before migration
- Implement rollback scripts

### Risk 2: Performance Degradation
**Mitigation**:
- Benchmark after each layer
- Add database indexes for common queries
- Cache relevance calculations where possible

### Risk 3: Pattern Detection Accuracy
**Mitigation**:
- Start with simple patterns (sequential, conditional)
- Use confidence thresholds (only surface 70%+ confident patterns)
- Allow user feedback to refine algorithms

### Risk 4: Temporal Decay Complexity
**Mitigation**:
- Use well-tested exponential decay formula
- Validate with synthetic data before production
- Make half-life configurable (not hardcoded)

---

## Timeline Summary

| Week | Phase | Deliverables | Effort |
|------|-------|-------------|--------|
| **Week 1** | Layer 1: Causality Engine | Causal tracking, dependencies, rationales | 12 hours |
| **Week 1-2** | Layer 2: Memory Enhancements | Memory tiers, LRU, pruning | 7 hours |
| **Week 2-3** | Layer 3: Propagation Engine | Temporal decay, patterns, priming | 23 hours |
| **Week 3** | Testing + Deployment | Integration tests, production deploy | 8 hours |

**Total Effort**: ~50 hours (2-3 weeks at 20-25 hours/week)

---

## Post-Implementation

### Documentation Updates
- [ ] Update README with new MCP tools
- [ ] Add brain architecture diagrams to docs
- [ ] Create video tutorial showing 3-layer brain in action
- [ ] Update Trinity research docs with completed Wake Intelligence

### Community Engagement
- [ ] Announce on Twitter/LinkedIn
- [ ] Write blog post: "Building Temporal Intelligence: The Wake Brain"
- [ ] Create demo showcasing memory persistence
- [ ] Open GitHub Discussions for feedback

### Research Publication
- [ ] Update Trinity research paper with Wake Intelligence validation
- [ ] Submit to arXiv (completes Sound-Space-Time framework)
- [ ] Prepare ICSE/NeurIPS submission

---

## Next Steps (Immediate)

**Choose Implementation Path**:

**Option A: Sequential** (safer, slower)
- Week 1: Layer 1 only
- Week 2: Layer 2 only
- Week 3: Layer 3 only

**Option B: Parallel** (faster, riskier)
- Week 1-2: Layers 1 + 2 together
- Week 2-3: Layer 3
- Week 3: Integration + deployment

**Option C: Incremental** (balanced)
- Week 1: Layer 1 foundation
- Week 2: Layer 2 + Layer 3 basic temporal decay
- Week 3: Layer 3 pattern detection + deployment

**Recommended**: **Option C (Incremental)** - balances risk and speed

---

**Ready to start implementation?** The rebranding is complete—Wake Intelligence 2.0 is ready for the brain architecture! 🧠🌊

---

**References**:
- [WAKE-BRAIN-ARCHITECTURE.md](docs/WAKE-BRAIN-ARCHITECTURE.md)
- [BRAIN-LAYER-IMPLEMENTATION-GUIDE.md](docs/BRAIN-LAYER-IMPLEMENTATION-GUIDE.md)
- [MEET-THE-WAKE-CORMORANT.md](docs/MEET-THE-WAKE-CORMORANT.md)
