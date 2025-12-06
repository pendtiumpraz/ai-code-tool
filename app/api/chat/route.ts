import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ToolExecutor } from '@/lib/tools/executor';
import { getFilteredToolsAsOpenAI } from '@/lib/tools/registry';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ============================================
// AGENTIC CHAT API - Multi-step with Tool Calling
// ============================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message, history = [], workspace = 'software-dev' } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 500 });
    }

    const systemPrompt = getSystemPrompt(workspace);
    const tools = getGeminiTools(workspace);
    
    // Initialize tool executor
    const executor = new ToolExecutor({
      userId: session.user.id,
      workspace,
      planName: 'free',
    });

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Build conversation history
          const contents = [
            ...history.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            { role: 'user', parts: [{ text: message }] }
          ];

          let iterations = 0;
          const maxIterations = 5;

          while (iterations < maxIterations) {
            iterations++;

            // Call Gemini with tools
            const response = await fetch(`${GEMINI_API_URL}?key=${GOOGLE_AI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents,
                tools: [{ functionDeclarations: tools }],
                toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
              }),
            });

            if (!response.ok) {
              const error = await response.text();
              throw new Error(`Gemini API error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            const parts = data.candidates?.[0]?.content?.parts || [];
            const finishReason = data.candidates?.[0]?.finishReason;

            let hasToolCall = false;
            const modelParts: any[] = [];

            for (const part of parts) {
              if (part.text) {
                // Stream text response
                const text = part.text;
                const chunks = text.match(/.{1,100}/g) || [text];
                for (const chunk of chunks) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`));
                  await sleep(10);
                }
                modelParts.push({ text: part.text });
              } else if (part.functionCall) {
                hasToolCall = true;
                const { name, args } = part.functionCall;

                // Notify tool call start
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'tool_call', 
                  tool: name, 
                  args 
                })}\n\n`));

                // Execute the tool
                const result = await executor.execute(name, args);

                // Notify tool result
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'tool_result', 
                  tool: name, 
                  result: result.success ? result.result : { error: result.error }
                })}\n\n`));

                // Add to conversation
                modelParts.push({ functionCall: { name, args } });
                contents.push({ role: 'model', parts: modelParts });
                contents.push({ 
                  role: 'user', 
                  parts: [{ 
                    functionResponse: { 
                      name, 
                      response: { result: result.success ? result.result : { error: result.error } }
                    } 
                  }] 
                });
              }
            }

            // If no tool call, add model response and exit loop
            if (!hasToolCall) {
              if (modelParts.length > 0) {
                contents.push({ role: 'model', parts: modelParts });
              }
              break;
            }
          }

          // Done
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();

        } catch (error: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            error: error.message 
          })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// HELPERS
// ============================================

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getGeminiTools(workspace: string) {
  const tools = getFilteredToolsAsOpenAI(workspace, 'free');
  return tools.map((t: any) => ({
    name: t.function.name,
    description: t.function.description,
    parameters: {
      type: 'object',
      properties: t.function.parameters?.properties || {},
      required: t.function.parameters?.required || [],
    },
  }));
}

function getSystemPrompt(workspace: string): string {
  const prompts: Record<string, string> = {
    'cybersecurity': `You are an expert cybersecurity AI assistant with access to security tools.

When the user asks you to analyze or scan a website:
1. Use the security_scan tool with scan_type="web" and the target URL
2. Analyze the results
3. Provide a summary of findings with recommendations

Available tools:
- security_scan: Scan websites for vulnerabilities (requires target URL and scan_type)
- security_report: Generate detailed security reports

Always be thorough and explain your findings clearly.`,

    'software-dev': `You are an expert software development AI assistant with access to coding tools.

Available tools:
- code_execute: Run code in various languages
- code_analyze: Analyze code for issues
- file_read/file_write: Manage files

Help users write, debug, and improve their code.`,

    'data-analysis': `You are an expert data analysis AI assistant.

Available tools:
- data_analyze: Analyze datasets
- data_visualize: Create visualizations
- code_execute: Run Python for data processing

Help users understand and visualize their data.`,

    'research': `You are an expert research AI assistant.

Available tools:
- web_search: Search the web for information
- web_scrape: Extract content from websites
- ai_summarize: Summarize long texts

Help users find and synthesize information.`,
  };

  return prompts[workspace] || prompts['software-dev'];
}

// ============================================
// SIMPLE CHAT (Non-streaming)
// ============================================

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, workspace = 'software-dev' } = await req.json();

    if (!message || !GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'Missing message or API key' }, { status: 400 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: getSystemPrompt(workspace) }] },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ response: text });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
