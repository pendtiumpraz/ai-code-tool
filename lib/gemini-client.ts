// ============================================
// GEMINI CLIENT - Multi-Model with Fallback
// gemini-2.0-flash-exp, gemini-2.0-flash, gemini-2.0-flash-lite
// ============================================

export type GeminiModel = 
  | 'gemini-2.0-flash-exp'      // Most powerful, code execution
  | 'gemini-2.0-flash'          // Balanced
  | 'gemini-2.0-flash-lite';    // Fast, lightweight

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export type GeminiPart = 
  | { text: string }
  | { functionCall: { name: string; args: Record<string, any> } }
  | { functionResponse: { name: string; response: Record<string, any> } }
  | { executableCode: { language: string; code: string } }
  | { codeExecutionResult: { outcome: string; output?: string } };

export interface GeminiTool {
  functionDeclarations?: FunctionDeclaration[];
  codeExecution?: {};  // Enable code execution
}

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface GeminiRequest {
  contents: GeminiMessage[];
  tools?: GeminiTool[];
  toolConfig?: {
    functionCallingConfig?: {
      mode: 'AUTO' | 'ANY' | 'NONE';
      allowedFunctionNames?: string[];
    };
  };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  systemInstruction?: {
    parts: { text: string }[];
  };
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: GeminiPart[];
      role: string;
    };
    finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ============================================
// MODEL CONFIGURATION
// ============================================

export const GEMINI_MODELS = {
  'gemini-2.0-flash-exp': {
    name: 'Gemini 2.0 Flash Exp',
    description: 'Most powerful - tool calling + code execution',
    supportsTools: true,
    supportsCodeExecution: true,
    rateLimit: 10,  // RPM
    priority: 1,    // Highest priority for complex tasks
  },
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    description: 'Balanced - tool calling support',
    supportsTools: true,
    supportsCodeExecution: false,
    rateLimit: 15,
    priority: 2,
  },
  'gemini-2.0-flash-lite': {
    name: 'Gemini 2.0 Flash Lite',
    description: 'Fast & light - simple tasks',
    supportsTools: false,
    supportsCodeExecution: false,
    rateLimit: 30,
    priority: 3,  // For simple chat only
  },
} as const;

// ============================================
// GEMINI CLIENT CLASS
// ============================================

export class GeminiClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: GeminiModel;
  
  // Rate limit tracking
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(options?: {
    apiKey?: string;
    model?: GeminiModel;
  }) {
    this.apiKey = options?.apiKey || process.env.GOOGLE_AI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.defaultModel = options?.model || 'gemini-2.0-flash-exp';

    if (!this.apiKey) {
      console.warn('GOOGLE_AI_API_KEY is not set. API calls will fail.');
    }
  }

  // ============================================
  // SMART MODEL SELECTION
  // ============================================

  selectModel(options: {
    needsTools?: boolean;
    needsCodeExecution?: boolean;
    preferFast?: boolean;
  }): GeminiModel {
    const { needsTools, needsCodeExecution, preferFast } = options;

    // Code execution → must use exp
    if (needsCodeExecution) {
      return 'gemini-2.0-flash-exp';
    }

    // Tool calling → exp or flash
    if (needsTools) {
      if (!this.isRateLimited('gemini-2.0-flash-exp')) {
        return 'gemini-2.0-flash-exp';
      }
      return 'gemini-2.0-flash';
    }

    // Simple/fast tasks → lite
    if (preferFast) {
      return 'gemini-2.0-flash-lite';
    }

    // Default: try exp first, then fallback
    if (!this.isRateLimited('gemini-2.0-flash-exp')) {
      return 'gemini-2.0-flash-exp';
    }
    if (!this.isRateLimited('gemini-2.0-flash')) {
      return 'gemini-2.0-flash';
    }
    return 'gemini-2.0-flash-lite';
  }

  // ============================================
  // RATE LIMIT CHECK
  // ============================================

  private isRateLimited(model: GeminiModel): boolean {
    const now = Date.now();
    const tracking = this.requestCounts.get(model);
    
    if (!tracking || now > tracking.resetTime) {
      return false;
    }

    const modelConfig = GEMINI_MODELS[model];
    return tracking.count >= modelConfig.rateLimit;
  }

  private trackRequest(model: GeminiModel): void {
    const now = Date.now();
    const tracking = this.requestCounts.get(model);
    
    if (!tracking || now > tracking.resetTime) {
      // Reset for new minute
      this.requestCounts.set(model, {
        count: 1,
        resetTime: now + 60000, // 1 minute
      });
    } else {
      tracking.count++;
    }
  }

  // ============================================
  // GENERATE CONTENT
  // ============================================

  async generate(
    request: GeminiRequest,
    model?: GeminiModel
  ): Promise<GeminiResponse> {
    const selectedModel = model || this.defaultModel;
    
    const url = `${this.baseUrl}/models/${selectedModel}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      
      // Rate limited? Try fallback
      if (response.status === 429) {
        this.trackRequest(selectedModel); // Mark as limited
        const fallback = this.getFallbackModel(selectedModel);
        if (fallback && fallback !== selectedModel) {
          console.log(`Rate limited on ${selectedModel}, falling back to ${fallback}`);
          return this.generate(request, fallback);
        }
      }
      
      throw new GeminiError(`Gemini API error: ${response.status} - ${error}`, response.status);
    }

    this.trackRequest(selectedModel);
    return response.json();
  }

  // ============================================
  // GENERATE WITH AUTO-FALLBACK
  // ============================================

  async generateWithFallback(
    request: GeminiRequest,
    options?: {
      needsTools?: boolean;
      needsCodeExecution?: boolean;
      preferFast?: boolean;
    }
  ): Promise<{ response: GeminiResponse; model: GeminiModel }> {
    const model = this.selectModel(options || {});
    
    // Remove tools if model doesn't support them
    const modelConfig = GEMINI_MODELS[model];
    let adjustedRequest = { ...request };
    
    if (!modelConfig.supportsTools && request.tools) {
      // Remove tool-related config for lite model
      const { tools, toolConfig, ...rest } = request;
      adjustedRequest = rest as GeminiRequest;
    }

    const response = await this.generate(adjustedRequest, model);
    return { response, model };
  }

  private getFallbackModel(current: GeminiModel): GeminiModel | null {
    const fallbackOrder: GeminiModel[] = [
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ];
    
    const currentIndex = fallbackOrder.indexOf(current);
    if (currentIndex < fallbackOrder.length - 1) {
      return fallbackOrder[currentIndex + 1];
    }
    return null;
  }

  // ============================================
  // SIMPLE CHAT
  // ============================================

  async chat(
    message: string,
    options?: {
      systemPrompt?: string;
      history?: GeminiMessage[];
      model?: GeminiModel;
      temperature?: number;
    }
  ): Promise<string> {
    const request: GeminiRequest = {
      contents: [
        ...(options?.history || []),
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: 4096,
      },
    };

    if (options?.systemPrompt) {
      request.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    // Use lite for simple chat
    const model = options?.model || 'gemini-2.0-flash-lite';
    const response = await this.generate(request, model);

    return this.extractText(response);
  }

  // ============================================
  // CHAT WITH TOOLS (Function Calling)
  // ============================================

  async chatWithTools(
    message: string,
    tools: FunctionDeclaration[],
    options?: {
      systemPrompt?: string;
      history?: GeminiMessage[];
      model?: GeminiModel;
    }
  ): Promise<{
    text?: string;
    functionCalls?: { name: string; args: Record<string, any> }[];
    model: GeminiModel;
  }> {
    const request: GeminiRequest = {
      contents: [
        ...(options?.history || []),
        { role: 'user', parts: [{ text: message }] },
      ],
      tools: [{ functionDeclarations: tools }],
      toolConfig: {
        functionCallingConfig: { mode: 'AUTO' },
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    };

    if (options?.systemPrompt) {
      request.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    // Must use exp or flash for tools
    const model = options?.model || 'gemini-2.0-flash-exp';
    const { response, model: usedModel } = await this.generateWithFallback(request, {
      needsTools: true,
    });

    const parts = response.candidates[0]?.content?.parts || [];
    const functionCalls: { name: string; args: Record<string, any> }[] = [];
    let text = '';

    for (const part of parts) {
      if ('text' in part) {
        text += part.text;
      } else if ('functionCall' in part) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args,
        });
      }
    }

    return { text: text || undefined, functionCalls: functionCalls.length > 0 ? functionCalls : undefined, model: usedModel };
  }

  // ============================================
  // CHAT WITH CODE EXECUTION
  // ============================================

  async chatWithCodeExecution(
    message: string,
    options?: {
      systemPrompt?: string;
      history?: GeminiMessage[];
    }
  ): Promise<{
    text: string;
    codeExecutions?: { code: string; output: string; outcome: string }[];
  }> {
    const request: GeminiRequest = {
      contents: [
        ...(options?.history || []),
        { role: 'user', parts: [{ text: message }] },
      ],
      tools: [{ codeExecution: {} }],  // Enable code execution
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    };

    if (options?.systemPrompt) {
      request.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    // Code execution ONLY works on exp
    const response = await this.generate(request, 'gemini-2.0-flash-exp');
    
    const parts = response.candidates[0]?.content?.parts || [];
    const codeExecutions: { code: string; output: string; outcome: string }[] = [];
    let text = '';
    let currentCode = '';

    for (const part of parts) {
      if ('text' in part) {
        text += part.text;
      } else if ('executableCode' in part) {
        currentCode = part.executableCode.code;
      } else if ('codeExecutionResult' in part) {
        codeExecutions.push({
          code: currentCode,
          output: part.codeExecutionResult.output || '',
          outcome: part.codeExecutionResult.outcome,
        });
        currentCode = '';
      }
    }

    return { 
      text, 
      codeExecutions: codeExecutions.length > 0 ? codeExecutions : undefined 
    };
  }

  // ============================================
  // AGENTIC LOOP WITH TOOLS + CODE EXECUTION
  // ============================================

  async runAgent(options: {
    task: string;
    systemPrompt: string;
    tools: FunctionDeclaration[];
    executeFunction: (name: string, args: Record<string, any>) => Promise<any>;
    enableCodeExecution?: boolean;
    maxIterations?: number;
    onThinking?: (text: string) => void;
    onToolCall?: (name: string, args: any) => void;
    onToolResult?: (name: string, result: any) => void;
    onCodeExecution?: (code: string, output: string) => void;
  }): Promise<{
    result: string;
    iterations: number;
    toolCalls: { name: string; args: any; result: any }[];
    codeExecutions: { code: string; output: string }[];
  }> {
    const {
      task,
      systemPrompt,
      tools,
      executeFunction,
      enableCodeExecution = true,
      maxIterations = 10,
      onThinking,
      onToolCall,
      onToolResult,
      onCodeExecution,
    } = options;

    const history: GeminiMessage[] = [];
    const toolCallHistory: { name: string; args: any; result: any }[] = [];
    const codeExecutionHistory: { code: string; output: string }[] = [];
    let iterations = 0;

    // Initial user message
    history.push({ role: 'user', parts: [{ text: task }] });

    while (iterations < maxIterations) {
      iterations++;

      // Build request
      const request: GeminiRequest = {
        contents: history,
        tools: [
          { functionDeclarations: tools },
          ...(enableCodeExecution ? [{ codeExecution: {} }] : []),
        ],
        toolConfig: {
          functionCallingConfig: { mode: 'AUTO' },
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
      };

      // Call API (always use exp for agentic)
      const response = await this.generate(request, 'gemini-2.0-flash-exp');
      const parts = response.candidates[0]?.content?.parts || [];
      const finishReason = response.candidates[0]?.finishReason;

      // Process response parts
      const responseParts: GeminiPart[] = [];
      let hasToolCall = false;
      let responseText = '';

      for (const part of parts) {
        if ('text' in part) {
          responseText += part.text;
          responseParts.push(part);
          onThinking?.(part.text);
        } else if ('functionCall' in part) {
          hasToolCall = true;
          const { name, args } = part.functionCall;
          
          onToolCall?.(name, args);

          // Execute the function
          const result = await executeFunction(name, args);
          
          onToolResult?.(name, result);
          toolCallHistory.push({ name, args, result });

          // Add function call and response to history
          responseParts.push(part);
          responseParts.push({
            functionResponse: { name, response: { result } },
          });
        } else if ('executableCode' in part) {
          responseParts.push(part);
        } else if ('codeExecutionResult' in part) {
          const lastCodePart = responseParts.find(p => 'executableCode' in p);
          const code = lastCodePart && 'executableCode' in lastCodePart 
            ? lastCodePart.executableCode.code 
            : '';
          const output = part.codeExecutionResult.output || '';
          
          codeExecutionHistory.push({ code, output });
          onCodeExecution?.(code, output);
          responseParts.push(part);
        }
      }

      // Add assistant response to history
      history.push({ role: 'model', parts: responseParts });

      // Check if we should continue
      if (finishReason === 'STOP' && !hasToolCall) {
        // Done!
        return {
          result: responseText,
          iterations,
          toolCalls: toolCallHistory,
          codeExecutions: codeExecutionHistory,
        };
      }

      // If there were tool calls, continue the loop
      // The function responses are already added to history
    }

    // Max iterations reached
    return {
      result: 'Max iterations reached',
      iterations,
      toolCalls: toolCallHistory,
      codeExecutions: codeExecutionHistory,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private extractText(response: GeminiResponse): string {
    const parts = response.candidates[0]?.content?.parts || [];
    return parts
      .filter((p): p is { text: string } => 'text' in p)
      .map(p => p.text)
      .join('');
  }
}

// ============================================
// ERROR CLASS
// ============================================

export class GeminiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
  }
}

// ============================================
// DEFAULT INSTANCE
// ============================================

export const gemini = new GeminiClient();

// ============================================
// HELPER: Convert tools to Gemini format
// ============================================

export function toGeminiTools(tools: Array<{
  name: string;
  description: string;
  parameters: Record<string, any>;
}>): FunctionDeclaration[] {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.parameters.properties || tool.parameters,
      required: tool.parameters.required || [],
    },
  }));
}

export default GeminiClient;
