interface Context {
  id: string;
  project: string;
  summary: string;
  source: string;
  metadata: string | null;
  tags: string;
  timestamp: string;
}

// AI Helper Functions
async function generateSummary(content: string, env: any): Promise<string> {
  try {
    if (env.AI) {
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
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

async function generateTags(content: string, env: any): Promise<string> {
  try {
    if (env.AI) {
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    console.log(`Request: ${request.method} ${pathname}`);
    
    // Handle both /mcp and /sse endpoints for different transport methods
    if (pathname === '/mcp' || pathname === '/sse' || pathname.startsWith('/mcp') || pathname.startsWith('/sse')) {
      
      // Handle POST requests (MCP protocol messages)
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          console.log('MCP Request:', JSON.stringify(body, null, 2));
          
          // Handle different MCP methods
          if (body.method === 'initialize') {
            const response = {
              jsonrpc: "2.0",
              id: body.id,
              result: {
                protocolVersion: "2025-06-18",
                capabilities: {
                  tools: {}
                },
                serverInfo: {
                  name: "Enhanced Context Manager",
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

          // Handle notifications (these don't need responses)
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
          
          if (body.method === 'tools/list') {
            const tools = [
              { 
                name: "add", 
                description: "Add two numbers together",
                inputSchema: {
                  type: "object",
                  properties: {
                    a: { type: "number", description: "First number" },
                    b: { type: "number", description: "Second number" }
                  },
                  required: ["a", "b"]
                }
              },
              { 
                name: "calculate", 
                description: "Perform basic arithmetic operations",
                inputSchema: {
                  type: "object",
                  properties: {
                    operation: { type: "string", enum: ["add", "subtract", "multiply", "divide"] },
                    a: { type: "number", description: "First number" },
                    b: { type: "number", description: "Second number" }
                  },
                  required: ["operation", "a", "b"]
                }
              },
              { 
                name: "save_context", 
                description: "Save conversation context with AI enhancement",
                inputSchema: {
                  type: "object",
                  properties: {
                    project: { type: "string", description: "Project identifier" },
                    content: { type: "string", description: "Context content to save" },
                    source: { type: "string", description: "Source of the context", default: "mcp" },
                    metadata: { type: "object", description: "Additional metadata" }
                  },
                  required: ["project", "content"]
                }
              },
              { 
                name: "load_context", 
                description: "Load relevant context for a project",
                inputSchema: {
                  type: "object",
                  properties: {
                    project: { type: "string", description: "Project identifier" },
                    limit: { type: "number", description: "Maximum contexts to return", default: 1 }
                  },
                  required: ["project"]
                }
              },
              { 
                name: "search_context", 
                description: "Search contexts using keyword matching",
                inputSchema: {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "Search query" },
                    project: { type: "string", description: "Project to search within" }
                  },
                  required: ["query"]
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

          if (body.method === 'tools/call') {
            const { name, arguments: args } = body.params;
            console.log(`Tool call: ${name}`, args);
            
            let result;
            try {
              switch (name) {
                case 'add':
                  result = {
                    content: [{ type: "text", text: String(args.a + args.b) }]
                  };
                  break;
                  
                case 'calculate':
                  let calcResult: number;
                  switch (args.operation) {
                    case "add": calcResult = args.a + args.b; break;
                    case "subtract": calcResult = args.a - args.b; break;
                    case "multiply": calcResult = args.a * args.b; break;
                    case "divide": 
                      if (args.b === 0) throw new Error("Division by zero");
                      calcResult = args.a / args.b;
                      break;
                    default: throw new Error("Invalid operation");
                  }
                  result = {
                    content: [{ type: "text", text: String(calcResult) }]
                  };
                  break;
                  
                case 'save_context':
                  const summary = await generateSummary(args.content, env);
                  const autoTags = await generateTags(summary, env);
                  
                  const id = crypto.randomUUID();
                  await env.DB.prepare(
                    `INSERT INTO context_snapshots (id, project, summary, source, metadata, tags)
                     VALUES (?, ?, ?, ?, ?, ?)`
                  ).bind(id, args.project, summary, args.source || "mcp", JSON.stringify(args.metadata || null), autoTags).run();

                  result = {
                    content: [{
                      type: "text",
                      text: `Context saved!\nID: ${id}\nSummary: ${summary}\nTags: ${autoTags}`
                    }]
                  };
                  break;
                  
                case 'load_context':
                  const { results } = await env.DB.prepare(
                    `SELECT * FROM context_snapshots WHERE project = ? ORDER BY timestamp DESC LIMIT ?`
                  ).bind(args.project, Math.min(args.limit || 1, 10)).all();

                  if (results.length === 0) {
                    result = {
                      content: [{ type: "text", text: `No context found for project: ${args.project}` }]
                    };
                  } else {
                    const contextList = results.map((ctx: any) => 
                      `**${ctx.project}** (${ctx.timestamp})\n${ctx.summary}\nTags: ${ctx.tags}`
                    ).join('\n\n');

                    result = {
                      content: [{ type: "text", text: `Found ${results.length} context(s):\n\n${contextList}` }]
                    };
                  }
                  break;
                  
                case 'search_context':
                  let dbQuery = `SELECT * FROM context_snapshots WHERE (summary LIKE ? OR tags LIKE ?)`;
                  let params = [`%${args.query}%`, `%${args.query}%`];

                  if (args.project) {
                    dbQuery += ` AND project = ?`;
                    params.push(args.project);
                  }

                  dbQuery += ` ORDER BY timestamp DESC LIMIT 10`;
                  const searchResults = await env.DB.prepare(dbQuery).bind(...params).all();

                  if (searchResults.results.length === 0) {
                    result = {
                      content: [{ type: "text", text: `No contexts found matching: "${args.query}"` }]
                    };
                  } else {
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