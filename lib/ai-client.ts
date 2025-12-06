// ============================================
// Z.AI CLIENT - GLM-4.6 Integration
// ============================================

export interface ZAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ZAIToolCall[];
}

export interface ZAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ZAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ZAICompletionRequest {
  model: string;
  messages: ZAIMessage[];
  tools?: ZAITool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface ZAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ZAIMessage;
    finish_reason: 'stop' | 'tool_calls' | 'length';
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ZAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: Partial<ZAIMessage>;
    finish_reason: 'stop' | 'tool_calls' | 'length' | null;
  }[];
}

// ============================================
// Z.AI CLIENT CLASS
// ============================================

export class ZAIClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(options?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  }) {
    this.apiKey = options?.apiKey || process.env.ZAI_API_KEY || '';
    this.baseUrl = options?.baseUrl || process.env.ZAI_API_BASE_URL || 'https://api.z.ai/v1';
    this.defaultModel = options?.model || 'glm-4.6';

    if (!this.apiKey) {
      console.warn('ZAI_API_KEY is not set. API calls will fail.');
    }
  }

  // ============================================
  // CHAT COMPLETIONS
  // ============================================

  async createCompletion(request: ZAICompletionRequest): Promise<ZAICompletionResponse> {
    const { model, ...rest } = request;
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model || this.defaultModel,
        ...rest,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ZAIError(`Z.AI API error: ${response.status} - ${error}`, response.status);
    }

    return response.json();
  }

  // ============================================
  // STREAMING COMPLETIONS
  // ============================================

  async *createCompletionStream(
    request: ZAICompletionRequest
  ): AsyncGenerator<ZAIStreamChunk> {
    const { model, ...rest } = request;
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model || this.defaultModel,
        ...rest,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ZAIError(`Z.AI API error: ${response.status} - ${error}`, response.status);
    }

    if (!response.body) {
      throw new ZAIError('No response body', 500);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            yield json as ZAIStreamChunk;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ============================================
  // SIMPLE CHAT METHOD
  // ============================================

  async chat(
    messages: ZAIMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      tools?: ZAITool[];
    }
  ): Promise<string> {
    const response = await this.createCompletion({
      model: options?.model || this.defaultModel,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      tools: options?.tools,
    });

    return response.choices[0]?.message.content || '';
  }

  // ============================================
  // CHAT WITH TOOL CALLING
  // ============================================

  async chatWithTools(
    messages: ZAIMessage[],
    tools: ZAITool[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{
    content: string;
    toolCalls?: ZAIToolCall[];
    usage: ZAICompletionResponse['usage'];
  }> {
    const response = await this.createCompletion({
      model: options?.model || this.defaultModel,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
    });

    const message = response.choices[0]?.message;

    return {
      content: message.content || '',
      toolCalls: message.tool_calls,
      usage: response.usage,
    };
  }
}

// ============================================
// ERROR CLASS
// ============================================

export class ZAIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ZAIError';
    this.status = status;
  }
}

// ============================================
// DEFAULT INSTANCE
// ============================================

export const zai = new ZAIClient();

// ============================================
// HELPER: Convert tools to Z.AI format
// ============================================

export function toZAITools(tools: Array<{
  name: string;
  description: string;
  parameters: Record<string, any>;
}>): ZAITool[] {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.properties || tool.parameters,
        required: tool.parameters.required || [],
      },
    },
  }));
}

export default ZAIClient;
