# Semantic Context MCP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/semanticintent/semantic-context-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/semanticintent/semantic-context-mcp/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-70%20passing-brightgreen.svg)](https://github.com/semanticintent/semantic-context-mcp)
[![Semantic Intent](https://img.shields.io/badge/Pattern-Semantic%20Intent-blue.svg)](https://github.com/semanticintent)
[![Reference Implementation](https://img.shields.io/badge/Status-Reference%20Implementation-green.svg)](https://github.com/semanticintent/semantic-context-mcp)

> **Reference implementation of Semantic Intent as Single Source of Truth patterns**
>
> A Model Context Protocol (MCP) server demonstrating semantic anchoring, intent preservation, and observable property patterns for AI-assisted development.

## 🎯 What Makes This Different

This isn't just another MCP server—it's a **reference implementation** of proven semantic intent patterns:

- ✅ **Semantic Anchoring**: Decisions based on meaning, not technical characteristics
- ✅ **Intent Preservation**: Semantic contracts maintained through all transformations
- ✅ **Observable Properties**: Behavior anchored to directly observable semantic markers
- ✅ **Domain Boundaries**: Clear semantic ownership across layers

Built on research from [Semantic Intent as Single Source of Truth](https://github.com/semanticintent), this implementation demonstrates how to build maintainable, AI-friendly codebases that preserve intent.

---

## 🚀 Quick Start 

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

This will deploy your MCP server to a URL like: `remote-mcp-server-authless.<your-account>.workers.dev/sse`

Alternatively, you can use the command line below to get the remote MCP Server created on your local machine:
```bash
npm create cloudflare@latest -- my-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless
```

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
        "http://localhost:8787/sse"  // or semantic-context-mcp.your-account.workers.dev/sse
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

- **save_context**: Save conversation context with AI-powered summarization and auto-tagging
- **load_context**: Retrieve relevant context for a project
- **search_context**: Search contexts using keyword matching

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

Contributions are welcome! Please ensure:

- Changes follow semantic intent principles documented in [SEMANTIC_ANCHORING_GOVERNANCE.md](SEMANTIC_ANCHORING_GOVERNANCE.md)
- Code includes semantic intent documentation (WHY, not just WHAT)
- Type safety is maintained in [src/types.ts](src/types.ts)
- Migrations follow versioned pattern in [migrations/](migrations/)

Feel free to open issues or submit pull requests! 
