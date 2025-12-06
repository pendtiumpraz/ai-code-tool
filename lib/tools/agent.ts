// ============================================
// AI AGENT - Orchestrates AI + Tool Calling Loop
// ============================================

import { prisma } from '@/lib/prisma';
import { ToolExecutor, ExecutionContext, ToolCallResult } from './executor';
import { getFilteredToolsAsOpenAI, getToolById } from './registry';
import { 
  checkTokenQuota, 
  recordTokenUsage, 
  getUserLimits, 
  getUserUsage 
} from '@/lib/usage';

// ============================================
// TYPES
// ============================================

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;        // For tool messages
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface AgentConfig {
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  maxIterations?: number;
  workspace?: string;
}

export interface AgentRunOptions {
  userId: string;
  projectId?: string;
  taskId?: string;
  messages: Message[];
  config: AgentConfig;
  onThinking?: (content: string) => void;
  onToolCall?: (tool: string, args: any) => void;
  onToolResult?: (tool: string, result: any) => void;
  onToken?: (token: string) => void;
  onComplete?: (response: string, usage: TokenUsage) => void;
  signal?: AbortSignal;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  toolCalls: number;
}

export interface AgentResponse {
  content: string;
  toolCalls: Array<{
    tool: string;
    args: any;
    result: any;
    success: boolean;
  }>;
  usage: TokenUsage;
  iterations: number;
  finishReason: 'complete' | 'max_iterations' | 'quota_exceeded' | 'cancelled' | 'error';
  error?: string;
}

// ============================================
// AI AGENT CLASS
// ============================================

export class AIAgent {
  private executor: ToolExecutor;
  private context: ExecutionContext;
  private config: AgentConfig;
  
  constructor(context: ExecutionContext, config: AgentConfig) {
    this.context = context;
    this.config = config;
    this.executor = new ToolExecutor(context);
  }
  
  // ============================================
  // MAIN RUN LOOP
  // ============================================
  
  async run(options: AgentRunOptions): Promise<AgentResponse> {
    const {
      messages,
      onThinking,
      onToolCall,
      onToolResult,
      onToken,
      onComplete,
      signal,
    } = options;
    
    const maxIterations = this.config.maxIterations || 10;
    let iterations = 0;
    let totalUsage: TokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      toolCalls: 0,
    };
    let toolCallHistory: AgentResponse['toolCalls'] = [];
    
    // Build conversation with system prompt
    const conversation: Message[] = [
      { role: 'system', content: this.config.systemPrompt },
      ...messages,
    ];
    
    // Get available tools for this workspace/plan
    const user = await prisma.user.findUnique({
      where: { id: this.context.userId },
      include: { subscription: { include: { plan: true } } },
    });
    const planName = user?.subscription?.plan.name || 'free';
    const tools = getFilteredToolsAsOpenAI(this.config.workspace, planName);
    
    while (iterations < maxIterations) {
      // Check for cancellation
      if (signal?.aborted) {
        return {
          content: '',
          toolCalls: toolCallHistory,
          usage: totalUsage,
          iterations,
          finishReason: 'cancelled',
        };
      }
      
      // Check token quota before making API call
      const quotaCheck = await checkTokenQuota(this.context.userId, 1000); // Estimate
      if (!quotaCheck.allowed) {
        return {
          content: quotaCheck.reason || 'Quota exceeded',
          toolCalls: toolCallHistory,
          usage: totalUsage,
          iterations,
          finishReason: 'quota_exceeded',
          error: quotaCheck.reason,
        };
      }
      
      iterations++;
      
      try {
        // Call AI model
        const response = await this.callAI(conversation, tools, onToken);
        
        // Update usage
        totalUsage.promptTokens += response.usage.prompt_tokens || 0;
        totalUsage.completionTokens += response.usage.completion_tokens || 0;
        totalUsage.totalTokens += response.usage.total_tokens || 0;
        
        // Record token usage
        await recordTokenUsage(
          this.context.userId,
          response.usage.total_tokens || 0,
          this.config.model
        );
        
        const message = response.choices[0]?.message;
        
        // Check if AI wants to call tools
        if (message.tool_calls && message.tool_calls.length > 0) {
          // Add assistant message with tool calls
          conversation.push({
            role: 'assistant',
            content: message.content || '',
            tool_calls: message.tool_calls,
          });
          
          // Process each tool call
          for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function.name;
            let args: any;
            
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch {
              args = {};
            }
            
            onToolCall?.(toolName, args);
            onThinking?.(`Executing tool: ${toolName}`);
            
            // Execute tool
            const result = await this.executor.execute(toolName, args);
            totalUsage.toolCalls++;
            
            toolCallHistory.push({
              tool: toolName,
              args,
              result: result.result,
              success: result.success,
            });
            
            onToolResult?.(toolName, result);
            
            // Add tool result to conversation
            conversation.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: JSON.stringify(result.success ? result.result : { error: result.error }),
            });
          }
          
          // Continue loop to let AI process tool results
          continue;
        }
        
        // No tool calls - AI is done
        const finalContent = message.content || '';
        
        onComplete?.(finalContent, totalUsage);
        
        return {
          content: finalContent,
          toolCalls: toolCallHistory,
          usage: totalUsage,
          iterations,
          finishReason: 'complete',
        };
        
      } catch (error: any) {
        console.error('Agent error:', error);
        
        return {
          content: '',
          toolCalls: toolCallHistory,
          usage: totalUsage,
          iterations,
          finishReason: 'error',
          error: error.message || 'Unknown error',
        };
      }
    }
    
    // Max iterations reached
    return {
      content: 'Maximum iterations reached. The task may not be complete.',
      toolCalls: toolCallHistory,
      usage: totalUsage,
      iterations,
      finishReason: 'max_iterations',
    };
  }
  
  // ============================================
  // GEMINI API CALL (with fallback)
  // gemini-2.0-flash-exp → gemini-2.0-flash → gemini-2.0-flash-lite
  // ============================================
  
  private async callAI(
    messages: Message[],
    tools: any[],
    onToken?: (token: string) => void
  ): Promise<any> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    // Convert messages to Gemini format
    const geminiContents = this.convertToGeminiFormat(messages);
    
    // Convert tools to Gemini format
    const geminiTools = tools.length > 0 ? [{
      functionDeclarations: tools.map((t: any) => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    }] : undefined;

    // Try models in order: exp → flash → lite
    const models = ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    let lastError: Error | null = null;

    for (const model of models) {
      // Skip lite if we need tools
      if (model === 'gemini-2.0-flash-lite' && tools.length > 0) {
        continue;
      }

      try {
        const response = await this.callGeminiModel(apiKey, model, geminiContents, geminiTools);
        
        // Convert Gemini response to OpenAI-like format for compatibility
        return this.convertFromGeminiFormat(response, model);
      } catch (error: any) {
        lastError = error;
        
        // If rate limited (429), try next model
        if (error.status === 429) {
          console.log(`Rate limited on ${model}, trying fallback...`);
          continue;
        }
        
        // Other errors, throw
        throw error;
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }

  private async callGeminiModel(
    apiKey: string,
    model: string,
    contents: any[],
    tools?: any[]
  ): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: any = {
      contents,
      generationConfig: {
        temperature: this.config.temperature ?? 0.7,
        maxOutputTokens: this.config.maxTokens ?? 4096,
      },
    };

    if (tools) {
      body.tools = tools;
      body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
    }

    // Add code execution for exp model
    if (model === 'gemini-2.0-flash-exp') {
      body.tools = [...(body.tools || []), { codeExecution: {} }];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      const err = new Error(`Gemini API error: ${error}`);
      (err as any).status = response.status;
      throw err;
    }

    return response.json();
  }

  private convertToGeminiFormat(messages: Message[]): any[] {
    const contents: any[] = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        // System messages handled separately in Gemini
        continue;
      }
      
      if (msg.role === 'user') {
        contents.push({
          role: 'user',
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === 'assistant') {
        const parts: any[] = [];
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        if (msg.tool_calls) {
          for (const tc of msg.tool_calls) {
            parts.push({
              functionCall: {
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments),
              },
            });
          }
        }
        contents.push({ role: 'model', parts });
      } else if (msg.role === 'tool') {
        // Add function response
        contents.push({
          role: 'model',
          parts: [{
            functionResponse: {
              name: msg.name,
              response: JSON.parse(msg.content),
            },
          }],
        });
      }
    }
    
    return contents;
  }

  private convertFromGeminiFormat(response: any, model: string): any {
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    
    let content = '';
    const toolCalls: any[] = [];
    
    for (const part of parts) {
      if (part.text) {
        content += part.text;
      } else if (part.functionCall) {
        toolCalls.push({
          id: `call_${Date.now()}_${toolCalls.length}`,
          type: 'function',
          function: {
            name: part.functionCall.name,
            arguments: JSON.stringify(part.functionCall.args),
          },
        });
      }
    }

    return {
      choices: [{
        message: {
          role: 'assistant',
          content: content || null,
          tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        },
        finish_reason: candidate?.finishReason === 'STOP' ? 'stop' : 'tool_calls',
      }],
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
      model,
    };
  }
  
  // ============================================
  // STREAMING SUPPORT
  // ============================================
  
  async *runStream(options: AgentRunOptions): AsyncGenerator<{
    type: 'thinking' | 'token' | 'tool_call' | 'tool_result' | 'done' | 'error';
    data: any;
  }> {
    const {
      messages,
      signal,
    } = options;
    
    const maxIterations = this.config.maxIterations || 10;
    let iterations = 0;
    let totalUsage: TokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      toolCalls: 0,
    };
    let toolCallHistory: AgentResponse['toolCalls'] = [];
    
    const conversation: Message[] = [
      { role: 'system', content: this.config.systemPrompt },
      ...messages,
    ];
    
    const user = await prisma.user.findUnique({
      where: { id: this.context.userId },
      include: { subscription: { include: { plan: true } } },
    });
    const planName = user?.subscription?.plan.name || 'free';
    const tools = getFilteredToolsAsOpenAI(this.config.workspace, planName);
    
    while (iterations < maxIterations) {
      if (signal?.aborted) {
        yield { type: 'done', data: { finishReason: 'cancelled' } };
        return;
      }
      
      const quotaCheck = await checkTokenQuota(this.context.userId, 1000);
      if (!quotaCheck.allowed) {
        yield { type: 'error', data: { error: quotaCheck.reason } };
        return;
      }
      
      iterations++;
      yield { type: 'thinking', data: { iteration: iterations } };
      
      try {
        // For streaming, we'd use SSE here
        const response = await this.callAI(conversation, tools);
        
        totalUsage.promptTokens += response.usage?.prompt_tokens || 0;
        totalUsage.completionTokens += response.usage?.completion_tokens || 0;
        totalUsage.totalTokens += response.usage?.total_tokens || 0;
        
        await recordTokenUsage(
          this.context.userId,
          response.usage?.total_tokens || 0,
          this.config.model
        );
        
        const message = response.choices[0]?.message;
        
        if (message.tool_calls && message.tool_calls.length > 0) {
          conversation.push({
            role: 'assistant',
            content: message.content || '',
            tool_calls: message.tool_calls,
          });
          
          for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function.name;
            let args: any;
            
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch {
              args = {};
            }
            
            yield { type: 'tool_call', data: { tool: toolName, args } };
            
            const result = await this.executor.execute(toolName, args);
            totalUsage.toolCalls++;
            
            toolCallHistory.push({
              tool: toolName,
              args,
              result: result.result,
              success: result.success,
            });
            
            yield { type: 'tool_result', data: { tool: toolName, result } };
            
            conversation.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: JSON.stringify(result.success ? result.result : { error: result.error }),
            });
          }
          
          continue;
        }
        
        // Emit final content as tokens
        const content = message.content || '';
        for (const char of content) {
          yield { type: 'token', data: { token: char } };
        }
        
        yield {
          type: 'done',
          data: {
            content,
            toolCalls: toolCallHistory,
            usage: totalUsage,
            iterations,
            finishReason: 'complete',
          },
        };
        return;
        
      } catch (error: any) {
        yield { type: 'error', data: { error: error.message } };
        return;
      }
    }
    
    yield {
      type: 'done',
      data: {
        finishReason: 'max_iterations',
        toolCalls: toolCallHistory,
        usage: totalUsage,
        iterations,
      },
    };
  }
}

// ============================================
// FACTORY & HELPERS
// ============================================

export function createAgent(
  context: ExecutionContext,
  config: AgentConfig
): AIAgent {
  return new AIAgent(context, config);
}

// Default system prompts for different workspaces
export const WORKSPACE_PROMPTS: Record<string, string> = {
  'cybersecurity': `You are an expert cybersecurity AI assistant specializing in:
- Vulnerability assessment and penetration testing
- Security scanning and analysis
- Social engineering awareness training
- OWASP Top 10 and common vulnerabilities
- Security report generation

You have access to security tools. Always ensure proper authorization before scanning.
Follow ethical guidelines and only work with authorized targets.`,

  'software-dev': `You are an expert software development AI assistant. You can:
- Write, analyze, and debug code
- Create and manage files
- Execute code in a sandboxed environment
- Search for documentation and examples
- Generate tests and documentation

Write clean, efficient, and well-documented code.`,

  'book-writing': `You are an expert writing AI assistant. You help with:
- Story development and plotting
- Character creation and development
- Writing and editing prose
- Research for accuracy
- Organizing chapters and structure

Provide creative suggestions while respecting the author's voice and vision.`,

  'data-analysis': `You are an expert data analysis AI assistant. You can:
- Analyze datasets (CSV, JSON, etc.)
- Create visualizations and charts
- Perform statistical analysis
- Generate insights and reports
- Clean and transform data

Provide clear explanations of your findings.`,

  'research': `You are an expert research AI assistant. You help with:
- Finding and summarizing academic papers
- Literature reviews
- Data collection and analysis
- Citation management
- Report writing

Ensure accuracy and proper attribution in all research.`,

  'content-marketing': `You are an expert content marketing AI assistant. You help with:
- SEO-optimized content creation
- Social media strategy
- Email marketing campaigns
- Analytics and reporting
- Brand voice development

Focus on engaging, conversion-optimized content.`,

  'healthcare': `You are an expert healthcare AI assistant. You help with:
- Medical documentation
- Research summaries
- Patient education materials
- Healthcare compliance

IMPORTANT: You do NOT provide medical diagnoses or treatment advice.
Always recommend consulting healthcare professionals.`,

  'legal': `You are an expert legal AI assistant. You help with:
- Document drafting and review
- Legal research
- Contract analysis
- Compliance documentation

IMPORTANT: You do NOT provide legal advice.
Always recommend consulting qualified legal professionals.`,
};

export function getWorkspacePrompt(workspace: string): string {
  return WORKSPACE_PROMPTS[workspace] || `You are a helpful AI assistant. Use the available tools to help the user with their request.`;
}

export default AIAgent;
