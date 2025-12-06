import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GeminiClient, toGeminiTools } from '@/lib/gemini-client';
import { TOOLS, getFilteredToolsAsOpenAI } from '@/lib/tools/registry';
import { ToolExecutor } from '@/lib/tools/executor';
import { checkTokenQuota, recordTokenUsage, recordToolCall } from '@/lib/usage';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================
// CHAT API - Streaming with Tool Calling
// ============================================

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { 
      message, 
      history = [], 
      workspace = 'software-dev',
      projectId,
      enableTools = true,
      enableCodeExecution = true,
    } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check quota
    const quotaCheck = await checkTokenQuota(userId, 1000);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ 
        error: 'Quota exceeded', 
        message: quotaCheck.reason 
      }, { status: 429 });
    }

    // Get user's plan for tool filtering
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: { include: { plan: true } } },
    });
    const planName = user?.subscription?.plan?.name || 'free';

    // Initialize Gemini client
    const gemini = new GeminiClient();

    // Get available tools for this workspace/plan
    const availableTools = enableTools 
      ? getFilteredToolsAsOpenAI(workspace, planName)
      : [];

    // Convert to Gemini format
    const geminiTools = availableTools.length > 0 
      ? toGeminiTools(availableTools.map((t: any) => ({
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        })))
      : [];

    // Build system prompt based on workspace
    const systemPrompt = getSystemPrompt(workspace);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Initialize tool executor
          const executor = new ToolExecutor({
            userId,
            projectId,
            workspace,
            planName,
            accessToken: session.user.googleAccessToken,
          });

          // Run agent loop
          const result = await gemini.runAgent({
            task: message,
            systemPrompt,
            tools: geminiTools,
            enableCodeExecution,
            maxIterations: 10,
            
            executeFunction: async (name, args) => {
              // Execute tool
              const result = await executor.execute(name, args);
              return result.success ? result.result : { error: result.error };
            },

            onThinking: (text) => {
              // Stream thinking text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`));
            },

            onToolCall: (name, args) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_call', tool: name, args })}\n\n`));
            },

            onToolResult: (name, result) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_result', tool: name, result })}\n\n`));
            },

            onCodeExecution: (code, output) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'code_execution', code, output })}\n\n`));
            },
          });

          // Record usage
          const estimatedTokens = (message.length + result.result.length) / 4;
          await recordTokenUsage(userId, Math.round(estimatedTokens), 'gemini-2.0-flash');

          // Send final result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'done', 
            content: result.result,
            iterations: result.iterations,
            toolCalls: result.toolCalls.length,
            codeExecutions: result.codeExecutions.length,
          })}\n\n`));

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
// SIMPLE CHAT (Non-streaming)
// ============================================

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, workspace = 'software-dev' } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check quota
    const quotaCheck = await checkTokenQuota(session.user.id, 500);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 429 });
    }

    // Simple chat without tools (uses lite model)
    const gemini = new GeminiClient();
    const response = await gemini.chat(message, {
      systemPrompt: getSystemPrompt(workspace),
      model: 'gemini-2.0-flash-lite', // Fast for simple chat
    });

    // Record usage
    const estimatedTokens = (message.length + response.length) / 4;
    await recordTokenUsage(session.user.id, Math.round(estimatedTokens), 'gemini-2.0-flash-lite');

    return NextResponse.json({ response });

  } catch (error: any) {
    console.error('Simple chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// SYSTEM PROMPTS
// ============================================

function getSystemPrompt(workspace: string): string {
  const prompts: Record<string, string> = {
    'cybersecurity': `You are an expert cybersecurity AI assistant. You help with:
- Vulnerability assessment and penetration testing (authorized only)
- Security scanning and analysis
- Social engineering awareness training
- OWASP Top 10 and security best practices
- Security report generation

Always ensure proper authorization before any security testing.
Use available tools to scan, analyze, and generate reports.
When executing code, prefer Python for security scripts.`,

    'software-dev': `You are an expert software development AI assistant. You help with:
- Writing clean, efficient code
- Debugging and fixing issues
- Code review and best practices
- Creating and managing files
- Running and testing code

Use available tools to create files, execute code, and manage projects.
When you need to test or run code, use the code execution capability.`,

    'book-writing': `You are an expert writing AI assistant helping with book creation. You help with:
- Story development and plotting
- Character creation
- Writing and editing prose
- Research and fact-checking
- Organizing chapters

Help create compelling narratives while respecting the author's voice.`,

    'data-analysis': `You are an expert data analysis AI assistant. You help with:
- Analyzing datasets (CSV, JSON, etc.)
- Statistical analysis and insights
- Creating visualizations
- Data cleaning and transformation
- Generating reports

Use Python code execution for data analysis tasks.
Libraries available: pandas, numpy, matplotlib (simulated).`,

    'research': `You are an expert research AI assistant. You help with:
- Finding and summarizing information
- Literature reviews
- Data analysis
- Citation and references
- Report writing

Use web search and other tools to gather accurate information.`,

    'content-marketing': `You are an expert content marketing AI assistant. You help with:
- SEO-optimized content creation
- Social media strategy
- Email marketing campaigns
- Content calendar planning
- Analytics and reporting

Create engaging, conversion-focused content.`,

    'healthcare': `You are a healthcare documentation AI assistant. You help with:
- Medical documentation
- Research summaries
- Patient education materials
- Healthcare compliance

IMPORTANT: You do NOT provide medical diagnoses or treatment advice.
Always recommend consulting healthcare professionals for medical decisions.`,

    'legal': `You are a legal documentation AI assistant. You help with:
- Document drafting and review
- Legal research
- Contract analysis
- Compliance documentation

IMPORTANT: You do NOT provide legal advice.
Always recommend consulting qualified legal professionals.`,
  };

  return prompts[workspace] || prompts['software-dev'];
}
