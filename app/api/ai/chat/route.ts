import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GLM-4 API Configuration
const GLM_API_BASE = process.env.GLM_API_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
const GLM_API_KEY = process.env.GLM_API_KEY;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  workspace?: string;
  stream?: boolean;
  enableThinking?: boolean;
  tools?: string[];
}

// Tool definitions for GLM-4
const toolDefinitions = {
  search_web: {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for information',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Number of results' },
        },
        required: ['query'],
      },
    },
  },
  create_file: {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a new file with content',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'File content' },
        },
        required: ['path', 'content'],
      },
    },
  },
  execute_code: {
    type: 'function',
    function: {
      name: 'execute_code',
      description: 'Execute code in a sandbox environment',
      parameters: {
        type: 'object',
        properties: {
          language: { type: 'string', description: 'Programming language' },
          code: { type: 'string', description: 'Code to execute' },
        },
        required: ['language', 'code'],
      },
    },
  },
  security_scan: {
    type: 'function',
    function: {
      name: 'security_scan',
      description: 'Perform security scan on a target',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Target URL or IP' },
          scan_type: { type: 'string', enum: ['quick', 'full', 'owasp'], description: 'Type of scan' },
        },
        required: ['target'],
      },
    },
  },
  generate_report: {
    type: 'function',
    function: {
      name: 'generate_report',
      description: 'Generate a security or analysis report in markdown',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Report type' },
          data: { type: 'object', description: 'Report data' },
          format: { type: 'string', enum: ['md', 'pdf', 'html'], description: 'Output format' },
        },
        required: ['type', 'data'],
      },
    },
  },
  analyze_code: {
    type: 'function',
    function: {
      name: 'analyze_code',
      description: 'Analyze code for security vulnerabilities',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Code to analyze' },
          language: { type: 'string', description: 'Programming language' },
        },
        required: ['code'],
      },
    },
  },
};

// Workspace-specific system prompts
const workspacePrompts: Record<string, string> = {
  cybersecurity: `You are an expert cybersecurity professional specializing in:
- Offensive security (red team, penetration testing)
- Defensive security (blue team, SOC, incident response)
- Malware analysis and reverse engineering
- Web application security (OWASP Top 10)
- Network security and forensics

You follow ethical hacking principles. Always provide educational context.
Reference MITRE ATT&CK when discussing attack techniques.
Include remediation recommendations for vulnerabilities.
Generate detailed .md reports for findings.`,

  'software-dev': `You are an expert full-stack software developer proficient in:
- Frontend: React, Next.js, Vue, Angular
- Backend: Node.js, Python, Go, Rust
- Databases: PostgreSQL, MongoDB, Redis
- DevOps: Docker, Kubernetes, CI/CD
- Cloud: AWS, GCP, Azure

Write clean, secure, and well-documented code.
Follow best practices and design patterns.
Consider performance and scalability.`,

  'book-writing': `You are a professional author and editor helping with:
- Fiction and non-fiction writing
- Story structure and plot development
- Character development
- Editing and proofreading
- Publishing guidance

Provide constructive feedback and creative suggestions.
Help maintain consistent voice and style.`,
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { messages, workspace, stream = true, enableThinking = true, tools = [] } = body;

    // Build system prompt
    const systemPrompt = workspacePrompts[workspace || 'software-dev'] || workspacePrompts['software-dev'];

    // Prepare messages with system prompt
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // Get enabled tools
    const enabledTools = tools
      .filter(t => toolDefinitions[t as keyof typeof toolDefinitions])
      .map(t => toolDefinitions[t as keyof typeof toolDefinitions]);

    // Call GLM-4 API
    const response = await fetch(`${GLM_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4-plus',
        messages: fullMessages,
        stream,
        temperature: 0.7,
        max_tokens: 4096,
        tools: enabledTools.length > 0 ? enabledTools : undefined,
        tool_choice: enabledTools.length > 0 ? 'auto' : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GLM API error:', error);
      return NextResponse.json({ error: 'AI API error' }, { status: 500 });
    }

    if (stream) {
      // Return streaming response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) return;

          let thinkingBuffer = '';
          let isThinking = false;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

              for (const line of lines) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  
                  // Handle thinking content (if model supports it)
                  if (enableThinking && parsed.choices?.[0]?.delta?.reasoning_content) {
                    const thinking = parsed.choices[0].delta.reasoning_content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ thinking })}\n\n`));
                  }

                  // Handle tool calls
                  if (parsed.choices?.[0]?.delta?.tool_calls) {
                    const toolCalls = parsed.choices[0].delta.tool_calls;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      tool_calls: toolCalls,
                      status: 'tool_calling'
                    })}\n\n`));
                  }

                  // Handle regular content
                  if (parsed.choices?.[0]?.delta?.content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                  }

                  // Send status updates
                  if (parsed.choices?.[0]?.finish_reason) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      status: 'completed',
                      finish_reason: parsed.choices[0].finish_reason
                    })}\n\n`));
                  }

                } catch (e) {
                  // Pass through unparsed data
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              }
            }
          } finally {
            reader.releaseLock();
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Return non-streaming response
      const data = await response.json();
      return NextResponse.json(data);
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
