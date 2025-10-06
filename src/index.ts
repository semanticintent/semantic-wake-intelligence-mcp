/**
 * 🎯 SEMANTIC INTENT: Context Snapshot Domain Model
 *
 * Represents a conversation context snapshot with AI-enhanced metadata.
 *
 * SEMANTIC ANCHORING PRINCIPLES:
 * - Each property maps to directly observable semantic meaning
 * - 'project' = semantic grouping anchor (WHAT domain does this belong to?)
 * - 'summary' = AI-generated semantic compression (WHAT is the essence?)
 * - 'tags' = semantic categorization markers (HOW do we find this?)
 * - 'source' = semantic provenance (WHERE did this come from?)
 *
 * INTENT PRESERVATION: This structure maintains semantic meaning
 * through all transformation layers (storage → retrieval → presentation)
 */
interface Context {
  id: string;              // Unique identifier for immutability tracking
  project: string;         // Semantic domain anchor
  summary: string;         // AI-compressed semantic essence
  source: string;          // Semantic provenance marker
  metadata: string | null; // Extensible semantic properties
  tags: string;            // Semantic categorization markers
  timestamp: string;       // Temporal semantic anchor
}

/**
 * 🎯 SEMANTIC INTENT: AI-Enhanced Content Summarization
 *
 * PURPOSE: Transform verbose content into semantic essence (2-3 sentences)
 *
 * SEMANTIC ANCHORING:
 * - Uses AI to extract MEANING, not just compress text
 * - Preserves semantic intent through transformation
 * - Falls back to structural truncation only when AI unavailable
 *
 * @param content - Raw content to summarize (semantic source)
 * @param env - Cloudflare environment with AI binding
 * @returns Semantic summary preserving original intent
 */
async function generateSummary(content: string, env: any): Promise<string> {
  try {
    if (env.AI) {
      const response = await env.AI.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
        messages: [{
          role: 'user',
          content: `Summarize in 2-3 sentences: ${content}`
        }]
      });
      return response.response || content.slice(0, 200) + '...';
    }
  } catch (error) {
    console.error('AI summary failed:', error);
  }
  return content.slice(0, 200) + '...';
}

/**
 * 🎯 SEMANTIC INTENT: AI-Enhanced Tag Generation
 *
 * PURPOSE: Extract semantic categorization markers from content
 *
 * SEMANTIC ANCHORING:
 * - Tags represent MEANING categories, not keyword extraction
 * - AI identifies semantic themes for future retrieval
 * - Observable semantic markers for search anchoring
 *
 * @param content - Content to analyze for semantic themes
 * @param env - Cloudflare environment with AI binding
 * @returns Comma-separated semantic tags
 */
async function generateTags(content: string, env: any): Promise<string> {
  try {
    if (env.AI) {
      const response = await env.AI.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
        messages: [{
          role: 'user',
          content: `Generate 3-5 relevant tags (comma-separated): ${content}`
        }]
      });
      return response.response || 'auto-generated';
    }
  } catch (error) {
    console.error('AI tags failed:', error);
  }
  return 'auto-generated';
}

/**
 * 🎯 SEMANTIC INTENT: Model Context Protocol (MCP) Server
 *
 * PURPOSE: Provide remote context management tools for AI assistants
 *
 * SEMANTIC ANCHORING ARCHITECTURE:
 * - Endpoint routing based on SEMANTIC PURPOSE (/mcp, /sse)
 * - Tool dispatch based on SEMANTIC INTENT (save, load, search)
 * - Intent preservation through JSON-RPC protocol layers
 *
 * DOMAIN BOUNDARIES:
 * - Transport Layer: HTTP/SSE (how messages arrive)
 * - Protocol Layer: MCP/JSON-RPC (how messages are structured)
 * - Tool Layer: Context operations (what semantic actions to perform)
 * - Storage Layer: D1 database (where semantic data persists)
 *
 * CRITICAL PRINCIPLE: Each layer preserves semantic intent without override
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    console.log(`Request: ${request.method} ${pathname}`);

    // ✅ SEMANTIC ANCHORING: Route by endpoint PURPOSE, not technical characteristics
    // Semantic intent: "This is an MCP protocol endpoint"
    if (pathname === '/mcp' || pathname === '/sse' || pathname.startsWith('/mcp') || pathname.startsWith('/sse')) {

      // ✅ SEMANTIC ANCHORING: Handle by request INTENT, not just HTTP method
      // Semantic intent: "Client wants to send MCP protocol message"
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          console.log('MCP Request:', JSON.stringify(body, null, 2));
          
          // ========================================
          // 🎯 MCP PROTOCOL METHODS (Semantic Intent Routing)
          // ========================================

          // ✅ SEMANTIC INTENT: "Client wants to establish MCP connection"
          // PURPOSE: Declare server capabilities and protocol version
          // ANCHORING: Method name 'initialize' directly expresses semantic purpose
          if (body.method === 'initialize') {
            const response = {
              jsonrpc: "2.0",
              id: body.id,
              result: {
                protocolVersion: "2025-06-18",
                capabilities: {
                  tools: {} // Semantic capability: "This server provides tools"
                },
                serverInfo: {
                  name: "Enhanced Context Manager", // Semantic identity
                  version: "1.0.0"
                }
              }
            };
            console.log('Initialize response:', JSON.stringify(response, null, 2));
            return new Response(JSON.stringify(response), {
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            });
          }

          // ✅ SEMANTIC INTENT: "Client confirms initialization complete"
          // PURPOSE: Acknowledge notification (no response needed per MCP spec)
          // ANCHORING: Notification methods semantically don't require responses
          if (body.method === 'notifications/initialized') {
            console.log('Client initialized notification received');
            return new Response('', { 
              status: 204,
              headers: { 
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            });
          }

          // ✅ SEMANTIC INTENT: "Client cancelled an operation"
          // PURPOSE: Acknowledge cancellation (no response needed)
          if (body.method === 'notifications/cancelled') {
            console.log('Client cancelled notification received');
            return new Response('', { 
              status: 204,
              headers: { 
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            });
          }
          
          // ✅ SEMANTIC INTENT: "Client requests available tool catalog"
          // PURPOSE: Advertise semantic capabilities (what operations can be performed)
          // ANCHORING: Tool names express SEMANTIC INTENT, not technical implementation
          if (body.method === 'tools/list') {
            const tools = [
              // ✅ SEMANTIC TOOL: save_context
              // INTENT: "Preserve conversation semantic meaning with AI enhancement"
              // ANCHORING: Name expresses PURPOSE (save) + DOMAIN (context)
              {
                name: "save_context",
                description: "Save conversation context with AI enhancement",
                inputSchema: {
                  type: "object",
                  properties: {
                    project: { type: "string", description: "Project identifier" },  // Semantic domain anchor
                    content: { type: "string", description: "Context content to save" }, // Semantic payload
                    source: { type: "string", description: "Source of the context", default: "mcp" }, // Provenance
                    metadata: { type: "object", description: "Additional metadata" } // Extensible semantics
                  },
                  required: ["project", "content"] // Minimum semantic requirements
                }
              },
              // ✅ SEMANTIC TOOL: load_context
              // INTENT: "Retrieve preserved semantic meaning for continuation"
              // ANCHORING: Name expresses PURPOSE (load) + DOMAIN (context)
              {
                name: "load_context",
                description: "Load relevant context for a project",
                inputSchema: {
                  type: "object",
                  properties: {
                    project: { type: "string", description: "Project identifier" }, // Semantic domain filter
                    limit: { type: "number", description: "Maximum contexts to return", default: 1 } // Result scope
                  },
                  required: ["project"] // Minimum semantic anchor needed
                }
              },
              // ✅ SEMANTIC TOOL: search_context
              // INTENT: "Find semantic matches across preserved contexts"
              // ANCHORING: Name expresses PURPOSE (search) + DOMAIN (context)
              {
                name: "search_context",
                description: "Search contexts using keyword matching",
                inputSchema: {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "Search query" }, // Semantic search terms
                    project: { type: "string", description: "Project to search within" } // Optional domain filter
                  },
                  required: ["query"] // Minimum semantic requirement
                }
              }
            ];
            
            const response = {
              jsonrpc: "2.0",
              id: body.id,
              result: { tools }
            };
            console.log('Tools list response:', JSON.stringify(response, null, 2));
            return new Response(JSON.stringify(response), {
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            });
          }

          // ========================================
          // 🎯 TOOL EXECUTION (Semantic Intent → Action)
          // ========================================

          // ✅ SEMANTIC INTENT: "Client wants to execute a tool operation"
          // PURPOSE: Dispatch to semantic operations based on tool name
          // ANCHORING: Tool name directly maps to semantic intent (not technical implementation)
          if (body.method === 'tools/call') {
            const { name, arguments: args } = body.params;
            console.log(`Tool call: ${name}`, args);

            let result;
            try {
              // Tool dispatch based on SEMANTIC PURPOSE, not implementation details
              switch (name) {
                // ========================================
                // 🎯 TOOL: save_context
                // SEMANTIC INTENT: "Preserve conversation meaning for future retrieval"
                // ANCHORING PATTERN: AI enhancement → Semantic compression → Immutable storage
                // ========================================
                case 'save_context':
                  // Step 1: AI-enhanced semantic compression (preserve MEANING, not just text)
                  const summary = await generateSummary(args.content, env);
                  const autoTags = await generateTags(summary, env);

                  // Step 2: Generate immutable identifier
                  const id = crypto.randomUUID();

                  // Step 3: Persist semantic snapshot with intent preservation
                  // ✅ INTENT PRESERVATION: Store semantic essence, not raw content
                  await env.DB.prepare(
                    `INSERT INTO context_snapshots (id, project, summary, source, metadata, tags)
                     VALUES (?, ?, ?, ?, ?, ?)`
                  ).bind(
                    id,
                    args.project,           // Semantic domain anchor
                    summary,                // AI-compressed semantic essence
                    args.source || "mcp",   // Provenance marker
                    JSON.stringify(args.metadata || null), // Extensible semantics
                    autoTags                // Semantic categorization
                  ).run();

                  result = {
                    content: [{
                      type: "text",
                      text: `Context saved!\nID: ${id}\nSummary: ${summary}\nTags: ${autoTags}`
                    }]
                  };
                  break;

                // ========================================
                // 🎯 TOOL: load_context
                // SEMANTIC INTENT: "Retrieve preserved meaning for continuation"
                // ANCHORING PATTERN: Project filter → Temporal order → Semantic retrieval
                // ========================================
                case 'load_context':
                  // ✅ SEMANTIC ANCHORING: Filter by PROJECT (semantic domain)
                  // ✅ OBSERVABLE ANCHORING: Sort by TIMESTAMP (temporal semantic order)
                  const { results } = await env.DB.prepare(
                    `SELECT * FROM context_snapshots WHERE project = ? ORDER BY timestamp DESC LIMIT ?`
                  ).bind(
                    args.project,                    // Semantic domain anchor
                    Math.min(args.limit || 1, 10)    // Bounded retrieval scope
                  ).all();

                  if (results.length === 0) {
                    result = {
                      content: [{ type: "text", text: `No context found for project: ${args.project}` }]
                    };
                  } else {
                    // Format semantic snapshots for human comprehension
                    const contextList = results.map((ctx: any) =>
                      `**${ctx.project}** (${ctx.timestamp})\n${ctx.summary}\nTags: ${ctx.tags}`
                    ).join('\n\n');

                    result = {
                      content: [{ type: "text", text: `Found ${results.length} context(s):\n\n${contextList}` }]
                    };
                  }
                  break;

                // ========================================
                // 🎯 TOOL: search_context
                // SEMANTIC INTENT: "Find semantic matches across all contexts"
                // ANCHORING PATTERN: Semantic query → Tag/summary matching → Relevance ranking
                // ========================================
                case 'search_context':
                  // ✅ SEMANTIC ANCHORING: Search by MEANING (summary + tags), not technical fields
                  // ✅ INTENT PRESERVATION: Optional project filter maintains domain semantics
                  let dbQuery = `SELECT * FROM context_snapshots WHERE (summary LIKE ? OR tags LIKE ?)`;
                  let params = [`%${args.query}%`, `%${args.query}%`];

                  if (args.project) {
                    // Optional semantic domain filter
                    dbQuery += ` AND project = ?`;
                    params.push(args.project);
                  }

                  // ✅ OBSERVABLE ANCHORING: Recent contexts first (temporal semantic relevance)
                  dbQuery += ` ORDER BY timestamp DESC LIMIT 10`;
                  const searchResults = await env.DB.prepare(dbQuery).bind(...params).all();

                  if (searchResults.results.length === 0) {
                    result = {
                      content: [{ type: "text", text: `No contexts found matching: "${args.query}"` }]
                    };
                  } else {
                    // Format semantic matches for human comprehension
                    const searchList = searchResults.results.map((ctx: any) =>
                      `**${ctx.project}** (${ctx.timestamp})\n${ctx.summary}\nTags: ${ctx.tags}`
                    ).join('\n\n');

                    result = {
                      content: [{
                        type: "text",
                        text: `Found ${searchResults.results.length} context(s) for "${args.query}":\n\n${searchList}`
                      }]
                    };
                  }
                  break;
                  
                default:
                  throw new Error(`Unknown tool: ${name}`);
              }

              const response = {
                jsonrpc: "2.0",
                id: body.id,
                result
              };
              console.log('Tool call response:', JSON.stringify(response, null, 2));
              return new Response(JSON.stringify(response), {
                headers: { 
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type'
                }
              });
              
            } catch (error) {
              const errorResponse = {
                jsonrpc: "2.0",
                id: body.id,
                error: {
                  code: -32000,
                  message: error.message
                }
              };
              console.log('Tool call error:', JSON.stringify(errorResponse, null, 2));
              return new Response(JSON.stringify(errorResponse), {
                status: 500,
                headers: { 
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type'
                }
              });
            }
          }

          // Default response for unhandled methods
          const errorResponse = {
            jsonrpc: "2.0",
            id: body.id,
            error: {
              code: -32601,
              message: `Method not found: ${body.method}`
            }
          };
          console.log('Method not found:', JSON.stringify(errorResponse, null, 2));
          return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          });
          
        } catch (error) {
          console.error('MCP Error:', error);
          const parseErrorResponse = {
            jsonrpc: "2.0",
            error: {
              code: -32700,
              message: "Parse error"
            }
          };
          return new Response(JSON.stringify(parseErrorResponse), {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          });
        }
      }

      // Handle OPTIONS requests (CORS preflight)
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
          }
        });
      }

      // Handle GET requests for SSE endpoint
      if (request.method === 'GET') {
        return new Response('MCP endpoint - use POST for protocol messages', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }
    
    return new Response('MCP Server is running. Connect via /sse or /mcp endpoint.', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  },
};