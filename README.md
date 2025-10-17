# Wake Intelligence MCP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/semanticintent/semantic-wake-intelligence-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/semanticintent/semantic-wake-intelligence-mcp/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-70%20passing-brightgreen.svg)](https://github.com/semanticintent/semantic-wake-intelligence-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)

[![Semantic Intent](https://img.shields.io/badge/Pattern-Semantic%20Intent-blue.svg)](https://github.com/semanticintent)
[![Reference Implementation](https://img.shields.io/badge/Status-Reference%20Implementation-green.svg)](https://github.com/semanticintent/semantic-wake-intelligence-mcp)
[![Hexagonal Architecture](https://img.shields.io/badge/Architecture-Hexagonal-purple.svg)](docs/ARCHITECTURE.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Contributor%20Covenant-blue.svg)](CODE_OF_CONDUCT.md)

> **Wake Intelligence: 3-Layer Temporal Intelligence for AI Agents**
>
> A production-ready Model Context Protocol (MCP) server implementing a temporal intelligence "brain" with three layers: **Past** (causality tracking), **Present** (memory management), and **Future** (predictive pre-fetching).
>
> Reference implementation of Semantic Intent as Single Source of Truth patterns with hexagonal architecture.

## 📚 Table of Contents

- [Wake Intelligence Brain Architecture](#-wake-intelligence-brain-architecture)
- [What Makes This Different](#-what-makes-this-different)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Features](#features)
- [Testing](#-testing)
- [Database Setup](#database-setup)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#license)

## 🧠 Wake Intelligence Brain Architecture

Wake Intelligence implements a **3-layer temporal intelligence system** that learns from the past, manages the present, and predicts the future:

### **Layer 1: Causality Engine (Past - WHY)**
Tracks **WHY** contexts were created and their causal relationships.

**Features:**
- ✅ Causal chain tracking (what led to what)
- ✅ Dependency auto-detection from temporal proximity
- ✅ Reasoning reconstruction ("Why did I do this?")
- ✅ Action type taxonomy (decision, implementation, refactor, etc.)

**Use Cases:**
- Trace decision history backwards through time
- Understand why a context was created
- Identify context dependencies automatically
- Reconstruct reasoning from past sessions

### **Layer 2: Memory Manager (Present - HOW)**
Manages **HOW** relevant contexts are right now based on temporal patterns.

**Features:**
- ✅ 4-tier memory classification (ACTIVE, RECENT, ARCHIVED, EXPIRED)
- ✅ LRU tracking (last access time + access count)
- ✅ Automatic tier recalculation based on age
- ✅ Expired context pruning

**Memory Tiers:**
- **ACTIVE**: Last accessed < 1 hour ago
- **RECENT**: Last accessed 1-24 hours ago
- **ARCHIVED**: Last accessed 1-30 days ago
- **EXPIRED**: Last accessed > 30 days ago

**Use Cases:**
- Prioritize recent contexts in search results
- Automatically archive old contexts
- Prune expired contexts to save storage
- Track context access patterns

### **Layer 3: Propagation Engine (Future - WHAT)**
Predicts **WHAT** contexts will be needed next for proactive optimization.

**Features:**
- ✅ Composite prediction scoring (40% temporal + 30% causal + 30% frequency)
- ✅ Pattern-based next access estimation
- ✅ Observable prediction reasoning
- ✅ Staleness management with lazy refresh

**Prediction Algorithm:**
- **Temporal Score (40%)**: Exponential decay based on last access time
- **Causal Score (30%)**: Position in causal chains (roots score higher)
- **Frequency Score (30%)**: Logarithmic scaling of access count

**Use Cases:**
- Pre-fetch high-value contexts for faster retrieval
- Cache frequently accessed contexts in memory
- Prioritize contexts by prediction score
- Identify patterns in context usage

### **Temporal Intelligence Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                   WAKE INTELLIGENCE BRAIN                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LAYER 3: PROPAGATION ENGINE (Future - WHAT)                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • Predicts WHAT will be needed next                 │    │
│  │ • Composite scoring (temporal + causal + frequency) │    │
│  │ • Pre-fetching optimization                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ▲                                  │
│  LAYER 2: MEMORY MANAGER (Present - HOW)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • Tracks HOW relevant contexts are NOW              │    │
│  │ • 4-tier memory classification                      │    │
│  │ • LRU tracking + automatic tier updates             │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ▲                                  │
│  LAYER 1: CAUSALITY ENGINE (Past - WHY)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • Tracks WHY contexts were created                  │    │
│  │ • Causal chain tracking                             │    │
│  │ • Dependency auto-detection                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- 🎯 **Learn from the past**: Understand causal relationships
- 🎯 **Optimize the present**: Manage memory intelligently
- 🎯 **Predict the future**: Pre-fetch what's needed next
- 🎯 **Observable reasoning**: Every decision is explainable
- 🎯 **Deterministic algorithms**: No black-box predictions

## 🎯 What Makes This Different

This isn't just another MCP server—it's a **reference implementation** of proven semantic intent patterns:

- ✅ **Semantic Anchoring**: Decisions based on meaning, not technical characteristics
- ✅ **Intent Preservation**: Semantic contracts maintained through all transformations
- ✅ **Observable Properties**: Behavior anchored to directly observable semantic markers
- ✅ **Domain Boundaries**: Clear semantic ownership across layers

Built on research from [Semantic Intent as Single Source of Truth](https://github.com/semanticintent), this implementation demonstrates how to build maintainable, AI-friendly codebases that preserve intent.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- Cloudflare account (free tier works)
- Wrangler CLI: `npm install -g wrangler`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/semanticintent/semantic-wake-intelligence-mcp.git
   cd semantic-wake-intelligence-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Wrangler**

   Copy the example configuration:
   ```bash
   cp wrangler.jsonc.example wrangler.jsonc
   ```

   Create a D1 database:
   ```bash
   wrangler d1 create mcp-context
   ```

   Update `wrangler.jsonc` with your database ID:
   ```jsonc
   {
     "d1_databases": [{
       "database_id": "your-database-id-from-above-command"
     }]
   }
   ```

4. **Run database migrations**
   ```bash
   # Local development
   wrangler d1 execute mcp-context --local --file=./migrations/0001_initial_schema.sql

   # Production
   wrangler d1 execute mcp-context --file=./migrations/0001_initial_schema.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Deploy to Production

```bash
npm run deploy
```

Your MCP server will be available at: `semantic-wake-intelligence-mcp.<your-account>.workers.dev`

## 📚 Learning from This Implementation

This codebase demonstrates semantic intent patterns throughout:

### Architecture Files:
- **[src/index.ts](src/index.ts)** - Dependency injection composition root (74 lines)
- **[src/domain/](src/domain/)** - Business logic layer (ContextSnapshot, ContextService)
- **[src/application/](src/application/)** - Orchestration layer (handlers and protocol)
- **[src/infrastructure/](src/infrastructure/)** - Technical adapters (D1, AI, CORS)
- **[src/presentation/](src/presentation/)** - HTTP routing layer (MCPRouter)

### Documentation & Patterns:
- **[migrations/0001_initial_schema.sql](migrations/0001_initial_schema.sql)** - Schema with semantic intent documentation
- **[src/types.ts](src/types.ts)** - Type-safe semantic contracts
- **[SEMANTIC_ANCHORING_GOVERNANCE.md](SEMANTIC_ANCHORING_GOVERNANCE.md)** - Governance rules and patterns
- **[REFACTORING_PLAN.md](REFACTORING_PLAN.md)** - Complete refactoring documentation

Each file includes comprehensive comments explaining **WHY** decisions preserve semantic intent, not just **WHAT** the code does. 

## Connect to Cloudflare AI Playground

You can connect to your MCP server from the Cloudflare AI Playground, which is a remote MCP client:

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL (`remote-mcp-server-authless.<your-account>.workers.dev/sse`)
3. You can now use your MCP tools directly from the playground!

## Connect Claude Desktop to your MCP server

You can also connect to your remote MCP server from local MCP clients, by using the [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote). 

To connect to your MCP server from Claude Desktop, follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and within Claude Desktop go to Settings > Developer > Edit Config.

Update with this configuration:

```json
{
  "mcpServers": {
    "semantic-context": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"  // or semantic-wake-intelligence-mcp.your-account.workers.dev/sse
      ]
    }
  }
}
```

Restart Claude and you should see the tools become available.

## 🏗️ Architecture

This project demonstrates **Domain-Driven Hexagonal Architecture** with clean separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│              (MCPRouter - HTTP routing)                  │
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
│         (ContextService, ContextSnapshot)                │
│                 Business Logic                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Infrastructure Layer                      │
│    (D1ContextRepository, CloudflareAIProvider)          │
│           Technical Adapters (Ports & Adapters)         │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities:

**Domain Layer** ([src/domain/](src/domain/)):
- Pure business logic independent of infrastructure
- `ContextSnapshot`: Entity with validation rules
- `ContextService`: Core business operations

**Application Layer** ([src/application/](src/application/)):
- Orchestrates domain operations
- `ToolExecutionHandler`: Translates MCP tools to domain operations
- `MCPProtocolHandler`: Manages JSON-RPC protocol

**Infrastructure Layer** ([src/infrastructure/](src/infrastructure/)):
- Technical adapters implementing ports (interfaces)
- `D1ContextRepository`: Cloudflare D1 persistence
- `CloudflareAIProvider`: Workers AI integration
- `CORSMiddleware`: Cross-cutting concerns

**Presentation Layer** ([src/presentation/](src/presentation/)):
- HTTP routing and request handling
- `MCPRouter`: Routes requests to appropriate handlers

**Composition Root** ([src/index.ts](src/index.ts)):
- Dependency injection
- Wires all layers together
- 74 lines (down from 483 - **90% reduction**)

### Benefits:

- ✅ **Testability**: Each layer independently testable
- ✅ **Maintainability**: Clear responsibilities per layer
- ✅ **Flexibility**: Swap infrastructure (D1 → Postgres) without touching domain
- ✅ **Semantic Intent**: Comprehensive documentation of WHY
- ✅ **Type Safety**: Strong TypeScript contracts throughout

## Features

### Core Context Management
- **save_context**: Save conversation context with AI-powered summarization and auto-tagging
- **load_context**: Retrieve relevant context for a project (with Layer 2 LRU tracking)
- **search_context**: Search contexts using keyword matching (with Layer 2 access tracking)

### Wake Intelligence Layer 1: Causality (Past)
- **reconstruct_reasoning**: Understand WHY a context was created
- **build_causal_chain**: Trace decision history backwards through time
- **get_causality_stats**: Analytics on causal relationships and action types

### Wake Intelligence Layer 2: Memory (Present)
- **get_memory_stats**: View memory tier distribution and access patterns
- **recalculate_memory_tiers**: Update tier classifications based on current time
- **prune_expired_contexts**: Automatic cleanup of old, unused contexts

### Wake Intelligence Layer 3: Propagation (Future)
- **update_predictions**: Refresh prediction scores for a project
- **get_high_value_contexts**: Retrieve contexts most likely to be accessed next
- **get_propagation_stats**: Analytics on prediction quality and patterns

## 🧪 Testing

This project includes comprehensive unit tests with **70 tests** covering all architectural layers.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

- ✅ **Domain Layer**: 15 tests (ContextSnapshot validation, ContextService orchestration)
- ✅ **Application Layer**: 10 tests (ToolExecutionHandler, MCP tool dispatch)
- ✅ **Infrastructure Layer**: 20 tests (D1Repository, CloudflareAIProvider with fallbacks)
- ✅ **Presentation Layer**: 12 tests (MCPRouter, CORS, error handling)
- ✅ **Integration**: 13 tests (End-to-end service flows)

### Test Structure

Tests are co-located with source files using the `.test.ts` suffix:

```
src/
├── domain/
│   ├── models/
│   │   ├── ContextSnapshot.ts
│   │   └── ContextSnapshot.test.ts
│   └── services/
│       ├── ContextService.ts
│       └── ContextService.test.ts
├── application/
│   └── handlers/
│       ├── ToolExecutionHandler.ts
│       └── ToolExecutionHandler.test.ts
└── ...
```

All tests use **Vitest** with mocking for external dependencies (D1, AI services).

### Continuous Integration

This project uses **GitHub Actions** for automated testing and quality checks.

**Automated Checks on Every Push/PR:**
- ✅ TypeScript compilation (`npm run type-check`)
- ✅ Unit tests (`npm test`)
- ✅ Test coverage reports
- ✅ Code formatting (Biome)
- ✅ Linting (Biome)

**Status Badges:**
- CI status displayed at top of README
- Automatically updates on each commit
- Shows passing/failing state

**Workflow Configuration:** [.github/workflows/ci.yml](.github/workflows/ci.yml)

The CI pipeline runs on Node.js 20.x and ensures code quality before merging.

## Database Setup

This project uses Cloudflare D1 for persistent context storage.

### Initial Setup

1. **Create D1 Database**:
   ```bash
   wrangler d1 create mcp-context
   ```

2. **Update `wrangler.jsonc`** with your database ID:
   ```jsonc
   {
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "mcp-context",
         "database_id": "your-database-id-here"
       }
     ]
   }
   ```

3. **Run Initial Migration**:
   ```bash
   wrangler d1 execute mcp-context --file=./migrations/0001_initial_schema.sql
   ```

### Local Development

For local testing, initialize the local D1 database:

```bash
wrangler d1 execute mcp-context --local --file=./migrations/0001_initial_schema.sql
```

### Verify Schema

Check that tables were created successfully:

```bash
# Production
wrangler d1 execute mcp-context --command="SELECT name FROM sqlite_master WHERE type='table'"

# Local
wrangler d1 execute mcp-context --local --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### Database Migrations

All database schema changes are managed through versioned migration files in [`migrations/`](migrations/):

- `0001_initial_schema.sql` - Initial context snapshots table with semantic indexes

See [migrations/README.md](migrations/README.md) for detailed migration management guide.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔬 Research Foundation

This implementation is based on the research paper **"Semantic Intent as Single Source of Truth: Immutable Governance for AI-Assisted Development"**.

### Core Principles Applied:

1. **Semantic Over Structural** - Use meaning, not technical characteristics
2. **Intent Preservation** - Maintain semantic contracts through transformations
3. **Observable Anchoring** - Base behavior on directly observable properties
4. **Immutable Governance** - Protect semantic integrity at runtime

### Related Resources:

- [Research Paper](https://github.com/semanticintent) (coming soon)
- [Semantic Anchoring Governance](SEMANTIC_ANCHORING_GOVERNANCE.md)
- [semanticintent.dev](https://semanticintent.dev) (coming soon)

## 🤝 Contributing

We welcome contributions! This is a **reference implementation**, so contributions should maintain semantic intent principles.

### How to Contribute

1. **Read the guidelines**: [CONTRIBUTING.md](CONTRIBUTING.md)
2. **Check existing issues**: Avoid duplicates
3. **Follow the architecture**: Maintain layer boundaries
4. **Add tests**: All changes need test coverage
5. **Document intent**: Explain WHY, not just WHAT

### Contribution Standards

- ✅ Follow semantic intent patterns
- ✅ Maintain hexagonal architecture
- ✅ Add comprehensive tests
- ✅ Include semantic documentation
- ✅ Pass all CI checks

**Quick Links:**
- [Contributing Guide](CONTRIBUTING.md) - Detailed guidelines
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community standards
- [Architecture Guide](docs/ARCHITECTURE.md) - Design principles
- [Security Policy](SECURITY.md) - Report vulnerabilities

### Community

- 💬 [Discussions](https://github.com/semanticintent/semantic-wake-intelligence-mcp/discussions) - Ask questions
- 🐛 [Issues](https://github.com/semanticintent/semantic-wake-intelligence-mcp/issues) - Report bugs
- 🔒 [Security](SECURITY.md) - Report vulnerabilities privately

## 🔒 Security

Security is a top priority. Please review our [Security Policy](SECURITY.md) for:

- Secrets management best practices
- What to commit / what to exclude
- Reporting security vulnerabilities
- Security checklist for deployment

**Found a vulnerability?** Email: security@semanticintent.dev 
