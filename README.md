# Semantic Context MCP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
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

- **[src/index.ts](src/index.ts)** - Fully documented with semantic anchoring principles
- **[migrations/0001_initial_schema.sql](migrations/0001_initial_schema.sql)** - Schema with semantic intent documentation
- **[src/types.ts](src/types.ts)** - Type-safe semantic contracts
- **[SEMANTIC_ANCHORING_GOVERNANCE.md](SEMANTIC_ANCHORING_GOVERNANCE.md)** - Governance rules and patterns

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

## Features

- **save_context**: Save conversation context with AI-powered summarization and auto-tagging
- **load_context**: Retrieve relevant context for a project
- **search_context**: Search contexts using keyword matching

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
