# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned - Future Enhancements
- **Layer 5: Cross-Project Intelligence** - Identify patterns across projects
- **Semantic Search** - Vector embeddings for meaning-based retrieval
- **Visualization Tools** - Graph causal chains and memory tiers
- **Performance Optimizations** - Caching and pre-fetching improvements

---

## [3.2.0] - 2026-05-02 — LAYER 4: META-LEARNING

Completes the 4-layer Wake Intelligence architecture. Weights are no longer hardcoded — each project now tunes its own 40/30/30 prediction formula from observed access patterns.

### Added

- **`MetaLearningService`** — domain service implementing Layer 4 adaptive weight learning. Records per-access component scores, tunes per-project weights from ≥20 outcomes (temporal/causal/frequency), clamps each dimension `[0.1, 0.6]`, redistributes deficit to non-pinned weights so sum stays exactly 1.0. 20 unit tests. ([MetaLearningService.ts](src/domain/services/MetaLearningService.ts))
- **`prediction_outcomes` table** — records temporal, causal, frequency component scores at access time. Indexed on `(project, recorded_at DESC)`. ([migrations/0005_add_meta_learning.sql](migrations/0005_add_meta_learning.sql))
- **`project_weights` table** — per-project learned weights (temporal/causal/frequency). `ON CONFLICT(project) DO UPDATE SET` upsert. Falls back to 0.4/0.3/0.3 defaults until 20 outcomes accumulated.
- **`IContextRepository`** — 4 new Layer 4 methods: `recordPredictionOutcome`, `findOutcomesByProject`, `getProjectWeights`, `saveProjectWeights`.
- **`D1ContextRepository`** — implements all 4 Layer 4 methods. 8 new SQL tests.
- **`PropagationService.predictContext(context, weights?)`** — optional `ProjectWeights` parameter; `calculatePropagationScore()` uses learned weights instead of hardcoded 0.4/0.3/0.3. 3 new weight-injection tests.
- **`ContextService.getLearningStats(project)`** — exposes meta-learning analytics at the service boundary.
- **`ContextService.updatePredictions()`** — now fetches per-project weights and threads them into `PropagationService` before re-scoring.
- **`loadContext()` / `searchContext()`** — record prediction outcomes fire-and-forget on every access, alongside existing `trackAccess()`.
- **`get_learning_stats` MCP tool** — shows learned weights per dimension and component averages.

### Counts
- Tests: 163 → **197** (+34)
- MCP tools: 11 → **12**

---

## [3.1.0] - 2026-05-01 🔧 HARDENING PASS — LAYER 2 GAPS CLOSED + CRON REFRESH

This release closes two functional TODOs that left Layer 2 partially broken and adds proactive Layer 3 prediction refresh via Cloudflare cron triggers.

### Fixed

- **`pruneExpiredContexts()` was a no-op** — returned a count but never deleted anything. Now calls `repository.delete()` for each EXPIRED context. ([MemoryManagerService.ts](src/domain/services/MemoryManagerService.ts))
- **`recalculateAllTiers()` without project filter returned empty** — the cross-project path was `[]` (TODO). Now calls `repository.findAll()`. ([MemoryManagerService.ts](src/domain/services/MemoryManagerService.ts))

### Added

- **`IContextRepository.findAll(limit?)`** — load all contexts across all projects (bounded). Enables cross-project bulk operations. ([IContextRepository.ts](src/application/ports/IContextRepository.ts))
- **`IContextRepository.delete(id)`** — permanent removal of a single context. Contract: only called from pruning code on EXPIRED tier. ([IContextRepository.ts](src/application/ports/IContextRepository.ts))
- **`D1ContextRepository.findAll()`** — `SELECT * ORDER BY timestamp DESC LIMIT ?` ([D1ContextRepository.ts](src/infrastructure/adapters/D1ContextRepository.ts))
- **`D1ContextRepository.delete()`** — `DELETE FROM context_snapshots WHERE id = ?` ([D1ContextRepository.ts](src/infrastructure/adapters/D1ContextRepository.ts))
- **`PropagationService.refreshAllStalePredictions(staleThreshold?, limit?)`** — cross-project stale prediction refresh in a single pass. Entry point for the cron handler. ([PropagationService.ts](src/domain/services/PropagationService.ts))
- **`ContextService.refreshStalePredictions(staleThreshold?)`** — exposes cross-project refresh at the service boundary. ([ContextService.ts](src/domain/services/ContextService.ts))
- **Scheduled cron handler in `index.ts`** — `scheduled()` export runs every 6 hours to proactively refresh stale Layer 3 predictions across all projects. ([index.ts](src/index.ts))
- **`wrangler.jsonc.example`** — `triggers.crons` entry documents cron configuration (`"0 */6 * * *"`).
- **`MemoryManagerService.test.ts`** — new test file, 10 tests covering `recalculateAllTiers()` (with + without project), `pruneExpiredContexts()` (now actually deletes), and `trackAccess()`.
- **6 new tests in `D1ContextRepository.test.ts`** — covering `findAll()` and `delete()`.

### Changed

- Total test count: 114 → **124 tests**
- Version: 3.0.0 → 3.1.0

---

## [3.0.0] - 2025-10-17 🧠 WAKE INTELLIGENCE BRAIN COMPLETE

### Major: Layer 3 (Propagation Engine) Implementation

This release completes the **3-layer Wake Intelligence brain architecture** with the addition of Layer 3: Propagation Engine, which predicts WHAT contexts will be needed next.

### Added - Layer 3: Propagation Engine (Future - WHAT)

- **PropagationService** - Orchestrates prediction workflow ([src/domain/services/PropagationService.ts](src/domain/services/PropagationService.ts))
  - `predictContext()` - Calculate composite prediction scores
  - `calculateCausalStrength()` - Score based on causal chain position
  - `estimateNextAccess()` - Pattern-based next access time estimation
  - `generatePropagationReasons()` - Human-readable prediction explanations
  - `updateProjectPredictions()` - Batch prediction refresh
  - `getHighValueContexts()` - Retrieve pre-fetch candidates
  - `refreshPredictionIfStale()` - Lazy prediction refresh

- **Composite Prediction Scoring**
  - 40% Temporal: Exponential decay based on last access time
  - 30% Causal: Position in causal chains (roots score higher)
  - 30% Frequency: Logarithmic scaling of access count

- **Domain Model Updates** ([src/domain/models/ContextSnapshot.ts](src/domain/models/ContextSnapshot.ts))
  - `PropagationMetadata` interface (score, timestamps, reasons)
  - `calculatePropagationScore()` - Composite scoring algorithm
  - `calculateTemporalScore()` - Exponential decay scoring
  - `calculateFrequencyScore()` - Logarithmic frequency scoring
  - `updatePropagation()` - Immutable propagation updates

- **Database Layer** ([migrations/0004_add_propagation_engine.sql](migrations/0004_add_propagation_engine.sql))
  - `prediction_score` column - 0.0-1.0 composite score
  - `last_predicted` column - When prediction was calculated
  - `predicted_next_access` column - Estimated next access time
  - `propagation_reason` column - JSON array of prediction reasons
  - 3 new indexes for efficient prediction queries

- **Repository Methods** ([src/infrastructure/adapters/D1ContextRepository.ts](src/infrastructure/adapters/D1ContextRepository.ts))
  - `updatePropagation()` - Persist prediction metadata
  - `findByPredictionScore()` - Query high-value contexts
  - `findStalePredictions()` - Identify contexts needing re-prediction
  - Updated `save()` to persist propagation fields
  - Updated deserialization to reconstruct propagation data

- **ContextService Integration** ([src/domain/services/ContextService.ts](src/domain/services/ContextService.ts))
  - `updatePredictions()` - Refresh prediction scores for project
  - `getHighValueContexts()` - Get contexts most likely to be accessed next
  - `getPropagationStats()` - Analytics on prediction quality and patterns

- **New MCP Tools**
  - `update_predictions` - Refresh prediction scores for a project
  - `get_high_value_contexts` - Retrieve contexts with high prediction scores
  - `get_propagation_stats` - View prediction analytics

### Changed - Documentation & Branding

- **README.md** - Completely rewritten with Wake Intelligence branding
  - Prominent 3-layer brain architecture section
  - Detailed feature breakdown by layer
  - ASCII art visualization of temporal intelligence flow
  - Updated features section with all MCP tools

- **ARCHITECTURE.md** - New comprehensive architecture documentation
  - Complete Layer 1, 2, 3 algorithm descriptions
  - Database schema with all migrations
  - Hexagonal architecture explanation
  - Data flow diagrams
  - Design principles and patterns

- **package.json** - Updated to v3.0.0
  - Enhanced description emphasizing 3-layer brain
  - Updated keywords (causality-engine, memory-manager, propagation-engine, etc.)

- **MIGRATION.md** - New migration guide for repository rename
  - Instructions for updating git remotes
  - CI/CD pipeline updates
  - MCP client configuration updates

### Fixed

- Test files updated to support 12-parameter ContextSnapshot constructor
- Mock repositories in tests include new propagation methods
- TypeScript compilation passes with no errors

### Database Migrations

- ✅ Migration 0001: Initial schema
- ✅ Migration 0002: Layer 1 (Causality Engine)
- ✅ Migration 0003: Layer 2 (Memory Manager)
- ✅ Migration 0004: Layer 3 (Propagation Engine)

### Deployment

- **Production:** semantic-wake-intelligence-mcp.michshat.workers.dev
- **Version ID:** 1904cf57-39d2-42e0-b505-dd29ecf84578
- **Database:** wake-intelligence (local + remote migrated)

### Wake Intelligence Brain - Complete! 🎉

- ✅ **Layer 1 (Past):** Causality Engine - WHY contexts were saved
- ✅ **Layer 2 (Present):** Memory Manager - HOW relevant contexts are NOW
- ✅ **Layer 3 (Future):** Propagation Engine - WHAT will be needed next

**Benefits:**
- 🎯 Learn from the past: Understand causal relationships
- 🎯 Optimize the present: Manage memory intelligently
- 🎯 Predict the future: Pre-fetch what's needed next
- 🎯 Observable reasoning: Every decision is explainable
- 🎯 Deterministic algorithms: No black-box predictions

---

## [2.0.0] - 2025-10-16 🌊 WAKE INTELLIGENCE REBRAND

### Major Rebrand: semantic-context-mcp → semantic-wake-intelligence-mcp

This release transforms the project into Wake Intelligence, the Time dimension of the Cormorant Trinity framework (Sound-Space-Time).

### Added - Wake Intelligence Features

- 🐦 Wake Cormorant Mascot - "Meet the Wake Cormorant" documentation
- 🧠 3-Layer Brain Architecture Documentation
  - Layer 1: Causality Engine (Past) - Action tracking and reasoning
  - Layer 2: Memory Manager (Present) - Context preservation
  - Layer 3: Propagation Engine (Future) - Temporal decay and prediction
- 📚 Comprehensive Research Documentation
  - WAKE-BRAIN-ARCHITECTURE.md - Complete architectural analysis
  - BRAIN-LAYER-IMPLEMENTATION-GUIDE.md - Step-by-step implementation guide
  - MEET-THE-WAKE-CORMORANT.md - Mascot personality and philosophy
  - REBRANDING-TO-WAKE-INTELLIGENCE.md - Rebranding checklist
- 🏷️ Trinity Framework Integration
  - Badge: "Part of the Cormorant Trinity"
  - Links to ChirpIQX (Sound) and PerchIQX (Space)
  - Comparison table showing dimensional alignment
- 🌐 Domain Preparation - wakeiqx.com branding throughout

### Changed - Rebranding Updates

- Package Name: @semanticintent/semantic-context-mcp → @semanticintent/semantic-wake-intelligence-mcp
- Version: 1.0.0 → 2.0.0 (major version bump for rebrand)
- Description: Updated to emphasize temporal intelligence and Cormorant Trinity
- Keywords: Added wake-intelligence, temporal-intelligence, cormorant-trinity, causality-tracking, time-dimension
- Repository URL: Updated to semantic-wake-intelligence-mcp
- Wrangler Config: Updated worker name and database name to wake-intelligence
- README.md: Completely rewritten with Wake Intelligence branding

### Documentation Improvements

- Enhanced architecture documentation with temporal reasoning focus
- Added comparison to ChirpIQX (7 layers) and PerchIQX (4 layers)
- Explained why Wake Intelligence has exactly 3 layers (temporal physics)
- Added research foundation section linking to Trinity framework
- Updated all internal links and references

---

## [1.0.0] - 2025-10-06

### Added
- Hexagonal Architecture - Domain-Driven Design implementation
- Comprehensive Testing - 70 unit tests across all layers
- GitHub Actions CI/CD - Automated testing and quality checks
- Professional Documentation - Architecture guide with Mermaid diagrams
- Security Best Practices - Secrets management and security policy
- Community Files - Contributing guide, Code of Conduct, Issue templates
- Domain Layer - Pure business logic with ContextSnapshot entity
- Application Layer - Tool execution and protocol handlers
- Infrastructure Layer - D1 and Cloudflare AI adapters
- Presentation Layer - MCP routing
- Database Migrations - Versioned schema management
- Semantic Intent Patterns - Reference implementation throughout

### Changed
- Refactored from monolithic 483-line file to clean 74-line composition root
- 90% code reduction through architectural improvements
- Improved type safety with TypeScript strict mode

---

## [0.1.0] - Initial Development

### Added
- Basic MCP server implementation
- Cloudflare Workers integration
- D1 database connection
- AI-powered context summarization

---

## The Cormorant Trinity

Wake Intelligence is part of a dimensional intelligence framework:

| System | Dimension | Layers | Domain |
|--------|-----------|--------|---------|
| ChirpIQX | Sound (Communication) | 7 | Fantasy sports breakout analysis |
| PerchIQX | Space (Structure) | 4 | Database schema intelligence |
| WakeIQX | Time (Memory) | 3 | AI context management |

Research: https://github.com/semanticintent/the-cormorant-trinity

---

The wake persists. 🐦
