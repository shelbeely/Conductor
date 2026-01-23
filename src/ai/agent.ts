/**
 * AI Agent Module
 * Handles natural language commands with support for multiple AI providers
 * - Remote: OpenRouter, Anthropic, GitHub Copilot SDK
 * - Local: Ollama
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { CopilotProvider } from './copilot-provider';

// JSON Schema conversion options for OpenAPI compatibility
const JSON_SCHEMA_OPTIONS = {
  target: 'openApi3' as const,
  $refStrategy: 'none' as const,
};

// Tool schemas for music operations
export const SearchMusicSchema = z.object({
  query: z.string().describe('Search query for artist, album, or track'),
  type: z.enum(['artist', 'album', 'title', 'any']).describe('Type of search'),
});

export const PlayMusicSchema = z.object({
  query: z.string().optional().describe('What to play - can be artist, album, or track'),
  position: z.number().optional().describe('Position in queue to play'),
});

export const QueueMusicSchema = z.object({
  query: z.string().describe('Music to add to queue'),
  position: z.enum(['end', 'next']).default('end').describe('Where to add in queue'),
});

export const ControlPlaybackSchema = z.object({
  action: z.enum(['play', 'pause', 'stop', 'next', 'previous', 'toggle']).describe('Playback action'),
});

export const SetVolumeSchema = z.object({
  volume: z.number().min(0).max(100).describe('Volume level 0-100'),
});

export const ToggleSettingSchema = z.object({
  setting: z.enum(['repeat', 'random', 'single', 'consume']).describe('Setting to toggle'),
});

export const GetQueueSchema = z.object({
  limit: z.number().optional().describe('Maximum number of items to return'),
});

export const ClearQueueSchema = z.object({
  confirm: z.boolean().default(true).describe('Confirm clearing the queue'),
});

export const GeneratePlaylistSchema = z.object({
  criteria: z.string().describe('Playlist criteria: mood, genre, energy level, theme, or activity'),
  targetLength: z.number().optional().describe('Desired number of tracks (default: 20)'),
  shuffleResults: z.boolean().optional().describe('Shuffle the generated playlist'),
});

export const GetTrackStorySchema = z.object({
  track: z.string().optional().describe('Track title (defaults to current track)'),
  artist: z.string().optional().describe('Artist name (defaults to current artist)'),
  aspectFocus: z.enum(['all', 'meaning', 'production', 'history', 'cultural-impact']).optional()
    .describe('Focus on specific aspect of the story'),
});

// Tool definitions
export const tools = [
  {
    name: 'search_music',
    description: 'Search for music in the MPD library by artist, album, or track name',
    schema: SearchMusicSchema,
  },
  {
    name: 'play_music',
    description: 'Play music immediately, either from a search or a specific queue position',
    schema: PlayMusicSchema,
  },
  {
    name: 'queue_music',
    description: 'Add music to the playback queue',
    schema: QueueMusicSchema,
  },
  {
    name: 'control_playback',
    description: 'Control playback: play, pause, stop, next, previous, or toggle play/pause',
    schema: ControlPlaybackSchema,
  },
  {
    name: 'set_volume',
    description: 'Set the playback volume level',
    schema: SetVolumeSchema,
  },
  {
    name: 'toggle_setting',
    description: 'Toggle playback settings like repeat, random, single, or consume mode',
    schema: ToggleSettingSchema,
  },
  {
    name: 'get_queue',
    description: 'Get the current playback queue',
    schema: GetQueueSchema,
  },
  {
    name: 'clear_queue',
    description: 'Clear the entire playback queue',
    schema: ClearQueueSchema,
  },
  {
    name: 'generate_playlist',
    description: 'Generate an AI-powered playlist based on mood, genre, energy level, theme, or activity. Examples: "upbeat workout music", "relaxing jazz", "90s nostalgia", "focus music"',
    schema: GeneratePlaylistSchema,
  },
  {
    name: 'get_track_story',
    description: 'Get the story behind a track - song meaning, production details, artist background, cultural impact. Like YouTube\'s Beyond the Beat feature.',
    schema: GetTrackStorySchema,
  },
];

// AI Provider configuration
export interface AIProviderConfig {
  provider: 'openrouter' | 'anthropic' | 'ollama' | 'copilot';
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolCall {
  name: string;
  arguments: any;
}

export interface AIResponse {
  message: string;
  toolCalls?: ToolCall[];
}

/**
 * Base AI Provider Interface
 */
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

export abstract class AIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract processCommand(
    userMessage: string,
    context: AIMessage[]
  ): Promise<AIResponse>;

  abstract listModels(): Promise<ModelInfo[]>;
  
  abstract setModel(modelId: string): void;
}

/**
 * OpenRouter Provider
 * Uses OpenRouter API for remote model access
 */
export class OpenRouterProvider extends AIProvider {
  private apiKey: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.model = config.model || 'anthropic/claude-3.5-sonnet';
    
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }
  }

  async processCommand(
    userMessage: string,
    context: AIMessage[]
  ): Promise<AIResponse> {
    const messages = [
      {
        role: 'system',
        content: `You are a music player assistant. You help users control their music playback through natural language commands.
You have access to tools for searching, playing, queueing music, and controlling playback.
When users ask to play something, search for it first, then add it to the queue or play it.
Be concise and friendly in your responses.`,
      },
      ...context,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/shelbeely/Conductor',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          tools: tools.map(t => ({
            type: 'function',
            function: {
              name: t.name,
              description: t.description,
              parameters: zodToJsonSchema(t.schema, JSON_SCHEMA_OPTIONS),
            },
          })),
        }),
      });

      const data = await response.json() as any;
      
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${JSON.stringify(data)}`);
      }

      const choice = data.choices?.[0];
      const message = choice?.message;

      return {
        message: message?.content || '',
        toolCalls: message?.tool_calls?.map((tc: any) => ({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        })),
      };
    } catch (error) {
      throw new Error(`OpenRouter request failed: ${error}`);
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const models = data.data || [];

      return models.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description,
        contextLength: m.context_length,
        pricing: {
          prompt: m.pricing?.prompt,
          completion: m.pricing?.completion,
        },
      }));
    } catch (error) {
      throw new Error(`Failed to list OpenRouter models: ${error}`);
    }
  }

  setModel(modelId: string): void {
    this.model = modelId;
  }

  getCurrentModel(): string {
    return this.model;
  }
}

/**
 * Ollama Provider
 * Uses local Ollama instance for privacy and offline use
 */
export class OllamaProvider extends AIProvider {
  private baseURL: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    super(config);
    this.baseURL = config.baseURL || 'http://localhost:11434';
    this.model = config.model || 'llama3.2';
  }

  async processCommand(
    userMessage: string,
    context: AIMessage[]
  ): Promise<AIResponse> {
    const systemPrompt = `You are a music player assistant. You help users control their music playback through natural language commands.
You have access to these tools:
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

When users ask to play something, you should call the search_music tool first, then play_music or queue_music.
Respond with tool calls in JSON format: {"tool": "tool_name", "args": {...}}
Be concise and friendly.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...context,
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const content = data.message?.content || '';

      // Parse tool calls from response
      const toolCalls = this.parseToolCalls(content);

      return {
        message: content,
        toolCalls,
      };
    } catch (error) {
      throw new Error(`Ollama request failed: ${error}`);
    }
  }

  private parseToolCalls(content: string): ToolCall[] | undefined {
    // Try to extract JSON tool calls from the response
    const jsonMatch = content.match(/\{[\s\S]*"tool"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return [{
          name: parsed.tool,
          arguments: parsed.args || {},
        }];
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Ollama models: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const models = data.models || [];

      return models.map((m: any) => ({
        id: m.name,
        name: m.name,
        description: `Size: ${this.formatBytes(m.size || 0)}`,
        contextLength: undefined,
      }));
    } catch (error) {
      throw new Error(`Failed to list Ollama models: ${error}`);
    }
  }

  setModel(modelId: string): void {
    this.model = modelId;
  }

  getCurrentModel(): string {
    return this.model;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Anthropic Provider (fallback option)
 */
export class AnthropicProvider extends AIProvider {
  private apiKey: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    super(config);
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }
  }

  async processCommand(
    userMessage: string,
    context: AIMessage[]
  ): Promise<AIResponse> {
    // Implementation similar to OpenRouter but using Anthropic's API
    // Simplified for now
    throw new Error('Anthropic provider not fully implemented. Use OpenRouter or Ollama.');
  }

  async listModels(): Promise<ModelInfo[]> {
    // Anthropic has a fixed set of models
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Most capable Claude model',
        contextLength: 200000,
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Powerful model for complex tasks',
        contextLength: 200000,
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance',
        contextLength: 200000,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fast and cost-effective',
        contextLength: 200000,
      },
    ];
  }

  setModel(modelId: string): void {
    this.model = modelId;
  }

  getCurrentModel(): string {
    return this.model;
  }
}

/**
 * AI Agent Manager
 * Manages the AI provider and handles command processing
 */
export class AIAgent {
  private provider: AIProvider;
  private conversationHistory: AIMessage[] = [];

  constructor(config: AIProviderConfig) {
    switch (config.provider) {
      case 'openrouter':
        this.provider = new OpenRouterProvider(config);
        break;
      case 'ollama':
        this.provider = new OllamaProvider(config);
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider(config);
        break;
      case 'copilot':
        this.provider = new CopilotProvider(config);
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  async processCommand(userMessage: string): Promise<AIResponse> {
    const response = await this.provider.processCommand(
      userMessage,
      this.conversationHistory
    );

    // Update conversation history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    if (response.message) {
      this.conversationHistory.push({
        role: 'assistant',
        content: response.message,
      });
    }

    // Keep history manageable (last 10 messages)
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }

    return response;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  async listAvailableModels(): Promise<ModelInfo[]> {
    return await this.provider.listModels();
  }

  setModel(modelId: string): void {
    this.provider.setModel(modelId);
  }

  getCurrentModel(): string {
    return (this.provider as any).getCurrentModel?.() || 'unknown';
  }

  getProvider(): string {
    if (this.provider instanceof OpenRouterProvider) return 'openrouter';
    if (this.provider instanceof OllamaProvider) return 'ollama';
    if (this.provider instanceof AnthropicProvider) return 'anthropic';
    if (this.provider instanceof CopilotProvider) return 'copilot';
    return 'unknown';
  }
}
