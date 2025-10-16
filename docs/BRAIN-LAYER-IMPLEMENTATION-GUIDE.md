# Wake Brain Layer Implementation Guide

**Purpose**: Practical guide for implementing the 3-layer Wake Intelligence brain architecture in semantic-wake-intelligence-mcp.

**Target**: Developers implementing temporal intelligence patterns

---

## Quick Reference

| Layer | Current Status | Priority | Effort |
|-------|---------------|----------|--------|
| **Layer 1: Causality Engine** | 40% complete | HIGH | 1 week |
| **Layer 2: Memory Manager** | 90% complete | LOW | 3 days |
| **Layer 3: Propagation Engine** | 0% complete | HIGH | 1.5 weeks |

**Total Implementation Time**: ~3-4 weeks

---

## Layer 1: Causality Engine (Past)

### Current State

**What Exists**:
```typescript
// src/domain/models/ContextSnapshot.ts
export class ContextSnapshot {
  public readonly timestamp: string   // ✅ Temporal anchor
  public readonly source: string      // ✅ Provenance
  // Missing: rationale, action type, dependencies
}
```

**What's Missing**: Causal tracking, rationale preservation, dependency graphs

---

### Implementation Steps

#### Step 1.1: Extend ContextSnapshot with Causality

**File**: `src/domain/models/ContextSnapshot.ts`

```typescript
/**
 * LAYER 1: Causality tracking metadata
 */
export interface CausalityMetadata {
  actionType: 'conversation' | 'decision' | 'file_edit' | 'tool_use' | 'research'
  rationale: string                    // WHY this context was saved
  dependencies: string[]               // IDs of prior snapshots that influenced this
  causedBy: string | null              // Parent snapshot ID (causal chain)
}

export class ContextSnapshot implements IContextSnapshot {
  constructor(
    public readonly id: string,
    public readonly project: string,
    public readonly summary: string,
    public readonly source: string,
    public readonly metadata: string | null,
    public readonly tags: string,
    public readonly timestamp: string,
    public readonly causality: CausalityMetadata | null  // NEW
  ) {
    this.validate();
  }

  static create(data: {
    project: string;
    summary: string;
    source?: string;
    metadata?: Record<string, unknown>;
    tags: string;
    causality?: CausalityMetadata;  // NEW: Optional causality tracking
  }): ContextSnapshot {
    return new ContextSnapshot(
      crypto.randomUUID(),
      data.project,
      data.summary,
      data.source || 'mcp',
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.tags,
      new Date().toISOString(),
      data.causality || null  // NEW
    );
  }
}
```

---

#### Step 1.2: Create CausalityService

**File**: `src/domain/services/CausalityService.ts` (NEW)

```typescript
/**
 * 🎯 LAYER 1: Causality Engine
 *
 * PURPOSE: Track action history and causal relationships
 *
 * RESPONSIBILITIES:
 * - Record actions with rationale
 * - Build causal chains
 * - Reconstruct decision reasoning
 * - Detect dependencies
 */

import type { IContextRepository } from '../../application/ports/IContextRepository';
import { ContextSnapshot } from '../models/ContextSnapshot';

export interface CausalChain {
  snapshot: ContextSnapshot;
  rationale: string;
  dependencies: ContextSnapshot[];
  causedBy: ContextSnapshot | null;
}

export class CausalityService {
  constructor(private readonly repository: IContextRepository) {}

  /**
   * Reconstruct the reasoning behind a decision
   *
   * Returns full causal chain: Why → What → Dependencies
   */
  async reconstructReasoning(snapshotId: string): Promise<CausalChain> {
    const snapshot = await this.repository.findById(snapshotId);
    if (!snapshot) throw new Error(`Snapshot ${snapshotId} not found`);

    const causality = snapshot.causality;
    if (!causality) {
      return {
        snapshot,
        rationale: 'No rationale recorded',
        dependencies: [],
        causedBy: null
      };
    }

    // Load dependencies
    const dependencies = await Promise.all(
      causality.dependencies.map(id => this.repository.findById(id))
    ).then(results => results.filter(Boolean) as ContextSnapshot[]);

    // Load parent (if exists)
    const causedBy = causality.causedBy
      ? await this.repository.findById(causality.causedBy)
      : null;

    return {
      snapshot,
      rationale: causality.rationale,
      dependencies,
      causedBy
    };
  }

  /**
   * Build full causal chain from root to specified snapshot
   *
   * Returns array of snapshots in temporal order
   */
  async buildCausalChain(endSnapshotId: string): Promise<ContextSnapshot[]> {
    const chain: ContextSnapshot[] = [];
    let currentId: string | null = endSnapshotId;

    while (currentId) {
      const snapshot = await this.repository.findById(currentId);
      if (!snapshot) break;

      chain.unshift(snapshot);  // Add to front (chronological order)

      currentId = snapshot.causality?.causedBy || null;
    }

    return chain;
  }

  /**
   * Detect which prior snapshots influenced this decision
   *
   * Uses temporal proximity + content similarity
   */
  async detectDependencies(
    project: string,
    currentTimestamp: string
  ): Promise<string[]> {
    // Get recent snapshots (last 24 hours)
    const recentSnapshots = await this.repository.findRecent(project, currentTimestamp, 24);

    // Simple heuristic: last 3 snapshots are dependencies
    // TODO: Enhance with semantic similarity matching
    return recentSnapshots.slice(0, 3).map(s => s.id);
  }
}
```

---

#### Step 1.3: Database Migration

**File**: `migrations/0002_add_causality.sql` (NEW)

```sql
-- LAYER 1: Causality Engine schema
-- Adds causal tracking to contexts table

ALTER TABLE contexts ADD COLUMN action_type TEXT;
ALTER TABLE contexts ADD COLUMN rationale TEXT;
ALTER TABLE contexts ADD COLUMN dependencies TEXT;  -- JSON array of snapshot IDs
ALTER TABLE contexts ADD COLUMN caused_by TEXT REFERENCES contexts(id);

-- Index for causal chain traversal
CREATE INDEX idx_contexts_caused_by ON contexts(caused_by);

-- Index for dependency lookups
CREATE INDEX idx_contexts_project_timestamp ON contexts(project, timestamp DESC);
```

**Run Migration**:
```bash
wrangler d1 execute mcp-context --file=./migrations/0002_add_causality.sql
```

---

#### Step 1.4: Update Repository Interface

**File**: `src/application/ports/IContextRepository.ts`

```typescript
export interface IContextRepository {
  // ... existing methods

  // NEW: Layer 1 methods
  findById(id: string): Promise<ContextSnapshot | null>;
  findRecent(project: string, beforeTimestamp: string, hoursBack: number): Promise<ContextSnapshot[]>;
}
```

**File**: `src/infrastructure/adapters/D1ContextRepository.ts`

```typescript
export class D1ContextRepository implements IContextRepository {
  // ... existing implementation

  async findById(id: string): Promise<ContextSnapshot | null> {
    const result = await this.db
      .prepare('SELECT * FROM contexts WHERE id = ?')
      .bind(id)
      .first();

    return result ? ContextSnapshot.fromDatabase(result as IContextSnapshot) : null;
  }

  async findRecent(
    project: string,
    beforeTimestamp: string,
    hoursBack: number
  ): Promise<ContextSnapshot[]> {
    const cutoff = new Date(new Date(beforeTimestamp).getTime() - hoursBack * 3600000)
      .toISOString();

    const results = await this.db
      .prepare(`
        SELECT * FROM contexts
        WHERE project = ?
          AND timestamp >= ?
          AND timestamp < ?
        ORDER BY timestamp DESC
        LIMIT 10
      `)
      .bind(project, cutoff, beforeTimestamp)
      .all();

    return results.results.map(r => ContextSnapshot.fromDatabase(r as IContextSnapshot));
  }
}
```

---

#### Step 1.5: Update ContextService

**File**: `src/domain/services/ContextService.ts`

```typescript
export class ContextService {
  constructor(
    private readonly repository: IContextRepository,
    private readonly aiProvider: IAIProvider,
    private readonly causalityService: CausalityService  // NEW: Inject causality
  ) {}

  async saveContext(input: SaveContextInput & {
    causality?: {
      actionType: string;
      rationale: string;
      causedBy?: string;
    }
  }): Promise<ContextSnapshot> {
    // Step 1: AI Enhancement
    const summary = await this.aiProvider.generateSummary(input.content);
    const tags = await this.aiProvider.generateTags(summary);

    // Step 2: Detect dependencies (Layer 1)
    const dependencies = input.causality
      ? await this.causalityService.detectDependencies(input.project, new Date().toISOString())
      : [];

    // Step 3: Create snapshot with causality
    const snapshot = ContextSnapshot.create({
      project: input.project,
      summary,
      source: input.source,
      metadata: input.metadata,
      tags,
      causality: input.causality ? {
        actionType: input.causality.actionType as any,
        rationale: input.causality.rationale,
        dependencies,
        causedBy: input.causality.causedBy || null
      } : null
    });

    // Step 4: Persist
    await this.repository.save(snapshot);

    return snapshot;
  }
}
```

---

## Layer 2: Memory Manager (Present)

### Current State

**What Exists**: ✅ Core functionality complete
- `saveContext()` - Snapshot preservation
- `loadContext()` - Context retrieval
- `searchContext()` - Semantic search

**What's Missing**: Memory tiers, LRU tracking, pruning

---

### Implementation Steps

#### Step 2.1: Add Memory Tiers

**File**: `src/domain/models/ContextSnapshot.ts`

```typescript
/**
 * LAYER 2: Memory hierarchy
 */
export enum MemoryTier {
  ACTIVE = 'active',      // Last 1 hour
  RECENT = 'recent',      // 1-24 hours
  ARCHIVED = 'archived',  // 1-30 days
  EXPIRED = 'expired'     // > 30 days (marked for deletion)
}

export class ContextSnapshot {
  constructor(
    // ... existing fields
    public readonly memoryTier: MemoryTier,           // NEW
    public readonly lastAccessed: string | null,      // NEW: LRU tracking
    public readonly accessCount: number               // NEW: Frequency
  ) {}

  /**
   * Calculate memory tier based on age
   */
  static calculateMemoryTier(timestamp: string): MemoryTier {
    const ageInHours = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);

    if (ageInHours < 1) return MemoryTier.ACTIVE;
    if (ageInHours < 24) return MemoryTier.RECENT;
    if (ageInHours < 720) return MemoryTier.ARCHIVED;  // 30 days
    return MemoryTier.EXPIRED;
  }

  /**
   * Mark snapshot as accessed (LRU)
   */
  markAccessed(): ContextSnapshot {
    return new ContextSnapshot(
      this.id,
      this.project,
      this.summary,
      this.source,
      this.metadata,
      this.tags,
      this.timestamp,
      this.causality,
      this.memoryTier,
      new Date().toISOString(),  // Update last accessed
      this.accessCount + 1       // Increment count
    );
  }
}
```

---

#### Step 2.2: Add Pruning Logic

**File**: `src/domain/services/ContextService.ts`

```typescript
export class ContextService {
  /**
   * LAYER 2: Update memory tiers based on age
   *
   * Runs periodically (e.g., via cron trigger)
   */
  async updateMemoryTiers(): Promise<number> {
    const allSnapshots = await this.repository.findAll();
    let updated = 0;

    for (const snapshot of allSnapshots) {
      const newTier = ContextSnapshot.calculateMemoryTier(snapshot.timestamp);

      if (newTier !== snapshot.memoryTier) {
        await this.repository.updateMemoryTier(snapshot.id, newTier);
        updated++;
      }
    }

    return updated;
  }

  /**
   * LAYER 2: Prune expired contexts
   *
   * Deletes contexts with MemoryTier.EXPIRED
   */
  async pruneExpiredContexts(): Promise<number> {
    return await this.repository.deleteByMemoryTier(MemoryTier.EXPIRED);
  }

  /**
   * LAYER 2: Mark context as accessed (LRU tracking)
   */
  async recordAccess(snapshotId: string): Promise<void> {
    const snapshot = await this.repository.findById(snapshotId);
    if (!snapshot) return;

    const updated = snapshot.markAccessed();
    await this.repository.update(updated);
  }
}
```

---

#### Step 2.3: Database Migration

**File**: `migrations/0003_add_memory_tiers.sql` (NEW)

```sql
-- LAYER 2: Memory hierarchy schema
-- Adds memory tier classification and LRU tracking

ALTER TABLE contexts ADD COLUMN memory_tier TEXT DEFAULT 'recent';
ALTER TABLE contexts ADD COLUMN last_accessed TEXT;
ALTER TABLE contexts ADD COLUMN access_count INTEGER DEFAULT 0;

-- Index for tier-based queries
CREATE INDEX idx_contexts_memory_tier ON contexts(memory_tier);

-- Index for pruning expired contexts
CREATE INDEX idx_contexts_expired ON contexts(memory_tier) WHERE memory_tier = 'expired';
```

---

## Layer 3: Propagation Engine (Future)

### Current State

**What Exists**: ❌ Nothing - entirely new layer

**What's Needed**: Temporal decay, pattern detection, predictive surfacing

---

### Implementation Steps

#### Step 3.1: Create PropagationEngine

**File**: `src/domain/services/PropagationEngine.ts` (NEW)

```typescript
/**
 * 🎯 LAYER 3: Propagation Engine
 *
 * PURPOSE: Future-oriented context intelligence
 *
 * RESPONSIBILITIES:
 * - Calculate temporal relevance decay
 * - Detect user patterns
 * - Prime context for next interactions
 * - Predictive context surfacing
 */

import type { IContextRepository } from '../../application/ports/IContextRepository';
import { ContextSnapshot, MemoryTier } from '../models/ContextSnapshot';

export interface Pattern {
  type: 'sequential' | 'conditional' | 'periodic';
  description: string;
  confidence: number;
  examples: string[];  // Snapshot IDs demonstrating pattern
}

export class PropagationEngine {
  constructor(private readonly repository: IContextRepository) {}

  /**
   * Calculate context relevance with temporal decay
   *
   * Formula: Relevance = e^(-age / half-life) × (1 + AccessBoost × 0.3)
   */
  calculateRelevance(snapshot: ContextSnapshot, currentTime: Date): number {
    const ageInHours = this.getAgeInHours(snapshot.timestamp, currentTime);
    const halfLife = this.getHalfLife(snapshot.memoryTier);

    // Exponential temporal decay
    const temporalRelevance = Math.exp(-ageInHours / halfLife);

    // LRU boost
    const accessBoost = snapshot.lastAccessed
      ? this.calculateAccessBoost(snapshot.lastAccessed, currentTime)
      : 0;

    return temporalRelevance * (1 + accessBoost * 0.3);
  }

  /**
   * Get half-life for temporal decay based on memory tier
   *
   * Half-life = time for relevance to decay to 50%
   */
  private getHalfLife(tier: MemoryTier): number {
    switch (tier) {
      case MemoryTier.ACTIVE: return 12;     // 12 hours
      case MemoryTier.RECENT: return 72;     // 3 days
      case MemoryTier.ARCHIVED: return 336;  // 14 days
      case MemoryTier.EXPIRED: return 1;     // 1 hour (rapid decay)
    }
  }

  /**
   * Calculate LRU boost based on recent access
   */
  private calculateAccessBoost(lastAccessed: string, currentTime: Date): number {
    const hoursSinceAccess = this.getAgeInHours(lastAccessed, currentTime);
    const accessHalfLife = 12;  // 12 hours

    return Math.exp(-hoursSinceAccess / accessHalfLife);
  }

  private getAgeInHours(timestamp: string, currentTime: Date): number {
    return (currentTime.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  }

  /**
   * Detect patterns in context history
   *
   * Examples:
   * - Sequential: "User always follows file edits with tests"
   * - Conditional: "When OAuth is mentioned, user needs token configs"
   * - Periodic: "User returns to auth-service every Monday"
   */
  async detectPatterns(project: string): Promise<Pattern[]> {
    const snapshots = await this.repository.findByProject(project, 100);
    const patterns: Pattern[] = [];

    // Pattern 1: Sequential actions (simple bigram model)
    const sequences = this.detectSequentialPatterns(snapshots);
    patterns.push(...sequences);

    // Pattern 2: Conditional context (co-occurrence)
    const conditionals = this.detectConditionalPatterns(snapshots);
    patterns.push(...conditionals);

    // TODO: Pattern 3: Periodic patterns (time-based)

    return patterns;
  }

  private detectSequentialPatterns(snapshots: ContextSnapshot[]): Pattern[] {
    // Simplified: Look for repeated action sequences
    // Example: "conversation" → "file_edit" → "tool_use" (test)

    const sequences = new Map<string, number>();

    for (let i = 0; i < snapshots.length - 1; i++) {
      const current = snapshots[i].causality?.actionType || 'unknown';
      const next = snapshots[i + 1].causality?.actionType || 'unknown';
      const sequence = `${current} → ${next}`;

      sequences.set(sequence, (sequences.get(sequence) || 0) + 1);
    }

    // Convert to patterns (threshold: 3+ occurrences)
    return Array.from(sequences.entries())
      .filter(([_, count]) => count >= 3)
      .map(([sequence, count]) => ({
        type: 'sequential' as const,
        description: `User typically follows ${sequence}`,
        confidence: Math.min(count / 10, 0.95),
        examples: []  // TODO: Add snapshot IDs
      }));
  }

  private detectConditionalPatterns(snapshots: ContextSnapshot[]): Pattern[] {
    // Simplified: Look for tag co-occurrence
    // Example: If "OAuth" tag present, "token" tag often follows

    const cooccurrence = new Map<string, Map<string, number>>();

    for (const snapshot of snapshots) {
      const tags = snapshot.tags.split(',').map(t => t.trim());

      for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
          const tagA = tags[i];
          const tagB = tags[j];

          if (!cooccurrence.has(tagA)) cooccurrence.set(tagA, new Map());
          const map = cooccurrence.get(tagA)!;
          map.set(tagB, (map.get(tagB) || 0) + 1);
        }
      }
    }

    // Convert to patterns (threshold: 5+ co-occurrences)
    const patterns: Pattern[] = [];

    for (const [tagA, relations] of cooccurrence.entries()) {
      for (const [tagB, count] of relations.entries()) {
        if (count >= 5) {
          patterns.push({
            type: 'conditional' as const,
            description: `When working on "${tagA}", user often needs "${tagB}"`,
            confidence: Math.min(count / 20, 0.90),
            examples: []
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Prime context for next interaction
   *
   * Returns contexts likely to be needed based on:
   * - Temporal relevance (decay)
   * - Pattern matching (learned behaviors)
   * - Causal chains (related decisions)
   */
  async primeContext(
    project: string,
    currentSnapshot: ContextSnapshot | null
  ): Promise<ContextSnapshot[]> {
    const allSnapshots = await this.repository.findByProject(project, 50);
    const currentTime = new Date();

    // Calculate relevance for each snapshot
    const scored = allSnapshots.map(snapshot => ({
      snapshot,
      relevance: this.calculateRelevance(snapshot, currentTime)
    }));

    // Filter by threshold and sort
    const relevant = scored
      .filter(s => s.relevance > 0.1)  // Pruning threshold
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);

    return relevant.map(s => s.snapshot);
  }
}
```

---

#### Step 3.2: Integrate into ContextService

**File**: `src/domain/services/ContextService.ts`

```typescript
export class ContextService {
  constructor(
    private readonly repository: IContextRepository,
    private readonly aiProvider: IAIProvider,
    private readonly causalityService: CausalityService,
    private readonly propagationEngine: PropagationEngine  // NEW: Layer 3
  ) {}

  /**
   * LAYER 3: Load context with temporal relevance weighting
   */
  async loadContextWithRelevance(input: LoadContextInput): Promise<{
    snapshot: ContextSnapshot;
    relevance: number;
  }[]> {
    const snapshots = await this.loadContext(input);
    const currentTime = new Date();

    return snapshots.map(snapshot => ({
      snapshot,
      relevance: this.propagationEngine.calculateRelevance(snapshot, currentTime)
    }))
    .filter(item => item.relevance > 0.1)  // Prune low-relevance
    .sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * LAYER 3: Get patterns for project
   */
  async getPatterns(project: string): Promise<Pattern[]> {
    return await this.propagationEngine.detectPatterns(project);
  }

  /**
   * LAYER 3: Prime context for next interaction
   */
  async primeForNext(
    project: string,
    currentSnapshotId?: string
  ): Promise<ContextSnapshot[]> {
    const current = currentSnapshotId
      ? await this.repository.findById(currentSnapshotId)
      : null;

    return await this.propagationEngine.primeContext(project, current);
  }
}
```

---

#### Step 3.3: Add MCP Tools

**File**: `src/application/handlers/ToolExecutionHandler.ts`

```typescript
export class ToolExecutionHandler {
  // ... existing tools

  /**
   * NEW TOOL: get_context_with_relevance
   *
   * Load context with temporal decay weighting
   */
  async getContextWithRelevance(args: {
    project: string;
    limit?: number;
  }): Promise<unknown> {
    const results = await this.contextService.loadContextWithRelevance({
      project: args.project,
      limit: args.limit || 10
    });

    return {
      contexts: results.map(r => ({
        ...r.snapshot,
        relevance: r.relevance.toFixed(3)
      }))
    };
  }

  /**
   * NEW TOOL: detect_patterns
   *
   * Identify user patterns for project
   */
  async detectPatterns(args: { project: string }): Promise<unknown> {
    const patterns = await this.contextService.getPatterns(args.project);

    return {
      patterns: patterns.map(p => ({
        type: p.type,
        description: p.description,
        confidence: p.confidence.toFixed(2)
      }))
    };
  }

  /**
   * NEW TOOL: prime_context
   *
   * Predictively surface relevant contexts
   */
  async primeContext(args: {
    project: string;
    currentSnapshotId?: string;
  }): Promise<unknown> {
    const primed = await this.contextService.primeForNext(
      args.project,
      args.currentSnapshotId
    );

    return {
      suggested_contexts: primed.map(s => ({
        id: s.id,
        summary: s.summary,
        tags: s.tags,
        reason: 'High temporal relevance + pattern match'
      }))
    };
  }
}
```

---

## Testing Strategy

### Layer 1: Causality Engine

```typescript
// src/domain/services/CausalityService.test.ts
describe('CausalityService', () => {
  it('should reconstruct reasoning with dependencies', async () => {
    // Arrange: Create snapshots with causal links
    // Act: reconstructReasoning(snapshotId)
    // Assert: Returns full causal chain
  });

  it('should build causal chain from root', async () => {
    // Arrange: Create chain A → B → C
    // Act: buildCausalChain(C.id)
    // Assert: Returns [A, B, C]
  });

  it('should detect dependencies from temporal proximity', async () => {
    // Arrange: Create snapshots in sequence
    // Act: detectDependencies(project, timestamp)
    // Assert: Returns recent snapshot IDs
  });
});
```

### Layer 2: Memory Manager

```typescript
// src/domain/services/ContextService.test.ts
describe('ContextService - Memory Management', () => {
  it('should calculate memory tier based on age', () => {
    // Arrange: Snapshots with various ages
    // Act: ContextSnapshot.calculateMemoryTier()
    // Assert: Correct tier assignment
  });

  it('should mark snapshot as accessed (LRU)', async () => {
    // Arrange: Existing snapshot
    // Act: recordAccess(snapshotId)
    // Assert: lastAccessed updated, accessCount incremented
  });

  it('should prune expired contexts', async () => {
    // Arrange: Mix of ACTIVE, RECENT, EXPIRED
    // Act: pruneExpiredContexts()
    // Assert: Only EXPIRED deleted
  });
});
```

### Layer 3: Propagation Engine

```typescript
// src/domain/services/PropagationEngine.test.ts
describe('PropagationEngine', () => {
  it('should calculate temporal relevance with exponential decay', () => {
    // Arrange: Snapshot with age = 12 hours, tier = ACTIVE
    // Act: calculateRelevance(snapshot, now)
    // Assert: Relevance ≈ 0.5 (half-life decay)
  });

  it('should detect sequential patterns', async () => {
    // Arrange: 5 snapshots with sequence "conversation → file_edit"
    // Act: detectPatterns(project)
    // Assert: Returns pattern with confidence > 0.5
  });

  it('should prime context with high relevance', async () => {
    // Arrange: Mix of old/new/accessed snapshots
    // Act: primeContext(project, null)
    // Assert: Returns top 10 by relevance, sorted DESC
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run all tests: `npm test`
- [ ] Type check: `npm run type-check`
- [ ] Run migrations locally: `wrangler d1 execute mcp-context --local --file=./migrations/000X_*.sql`
- [ ] Test locally: `npm run dev` → verify MCP tools work

### Production Deployment

- [ ] Run migrations on production D1: `wrangler d1 execute mcp-context --file=./migrations/000X_*.sql`
- [ ] Deploy worker: `npm run deploy`
- [ ] Verify MCP server responds: `curl https://semantic-wake-intelligence-mcp.your-account.workers.dev/sse`
- [ ] Test new MCP tools from Claude Desktop or Cloudflare AI Playground

### Post-Deployment

- [ ] Monitor Cloudflare Workers logs for errors
- [ ] Test full flow: save → load with relevance → detect patterns → prime context
- [ ] Update documentation: README.md, CHANGELOG.md
- [ ] Tag release: `git tag v2.0.0-wake-brain`

---

## Summary

**Implementation Priority**:
1. **Layer 1 (Causality)** - HIGH (foundation for Layer 3)
2. **Layer 3 (Propagation)** - HIGH (biggest value add)
3. **Layer 2 (Memory tiers)** - LOW (nice-to-have enhancement)

**Expected Timeline**:
- Week 1: Layer 1 (causality tracking)
- Week 2-3: Layer 3 (propagation engine)
- Week 4: Layer 2 enhancements + testing

**Outcome**: Full 3-layer Wake Intelligence brain architecture, ready for wakeiqx.com launch.

---

**Next Steps**: Start with Layer 1 implementation → database migration → test → move to Layer 3.
