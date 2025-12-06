import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

// ============================================
// CHAT API - Simple Direct Gemini Call
// ============================================

export async function POST(req: NextRequest) {
  try {
    // Auth check
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

    // Build system prompt
    const systemPrompt = getSystemPrompt(workspace);

    // Build conversation
    const contents = [
      ...history.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    // Call Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return NextResponse.json({ error: `Gemini API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send text in chunks for streaming effect
        const chunks = text.match(/.{1,50}/g) || [text];
        chunks.forEach((chunk: string, i: number) => {
          setTimeout(() => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`));
            if (i === chunks.length - 1) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: text })}\n\n`));
              controller.close();
            }
          }, i * 20);
        });
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

    if (!GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 500 });
    }

    const systemPrompt = getSystemPrompt(workspace);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ response: text });

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
