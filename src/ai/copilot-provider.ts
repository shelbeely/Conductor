/**
 * GitHub Copilot SDK Provider
 * Uses GitHub Copilot as an AI backend for natural language commands
 * 
 * Requires: @github/copilot-sdk
 * Documentation: https://github.com/github/copilot-sdk
 */

import { CopilotSDK, Message } from '@github/copilot-sdk';
import { AIProvider, AIProviderConfig, AIMessage, AIResponse, ModelInfo, tools } from './agent';
import { zodToJsonSchema } from 'zod-to-json-schema';

const JSON_SCHEMA_OPTIONS = {
  target: 'openApi3' as const,
  $refStrategy: 'none' as const,
};

/**
 * GitHub Copilot Provider
 * Uses GitHub Copilot SDK for AI-powered music control
 */
export class CopilotProvider extends AIProvider {
  private sdk: CopilotSDK;
  private model: string;
  private githubToken: string;

  constructor(config: AIProviderConfig) {
    super(config);
    
    this.githubToken = config.apiKey || process.env.GITHUB_TOKEN || '';
    this.model = config.model || 'gpt-4o';

    if (!this.githubToken) {
      throw new Error('GitHub token is required for Copilot SDK. Set GITHUB_TOKEN environment variable.');
    }

    // Initialize Copilot SDK
    this.sdk = new CopilotSDK({
      token: this.githubToken,
    });
  }

  async processCommand(
    userMessage: string,
    context: AIMessage[]
  ): Promise<AIResponse> {
    // Convert context to Copilot SDK format
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are a music player assistant powered by GitHub Copilot. You help users control their music playback through natural language commands.

You have access to tools for searching, playing, queueing music, and controlling playback.

When users ask to play something, search for it first, then add it to the queue or play it.

IMPORTANT - Apply humanizer principles to avoid AI writing patterns:
- NO inflated language ("pivotal," "testament to," "showcases," "underscores")
- NO promotional words ("vibrant," "stunning," "groundbreaking," "remarkable")
- NO vague attributions ("experts say," "observers note," "it's worth noting")
- NO superficial -ing phrases ("highlighting," "showcasing," "demonstrating")
- NO empty claims about "legacy" or "impact" without substance
- Use varied sentence length - mix short and long
- Use "I" when it fits conversational tone
- Real reactions, not neutral reporting
- Specific facts instead of vague claims

Be concise, friendly, and genuinely helpful in your responses.`,
      },
      ...context.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    try {
      // Create completion with tools
      const completion = await this.sdk.chat.completions.create({
        model: this.model,
        messages,
        tools: tools.map(t => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: zodToJsonSchema(t.schema, JSON_SCHEMA_OPTIONS),
          },
        })),
      });

      const choice = completion.choices[0];
      const message = choice.message;

      return {
        message: message.content || '',
        toolCalls: message.tool_calls?.map(tc => ({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        })),
      };
    } catch (error) {
      throw new Error(`Copilot SDK request failed: ${error}`);
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    // GitHub Copilot SDK supported models
    return [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable model, best for complex tasks',
        contextLength: 128000,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Faster and more cost-effective',
        contextLength: 128000,
      },
      {
        id: 'o1-preview',
        name: 'O1 Preview',
        description: 'Reasoning model for complex problems',
        contextLength: 128000,
      },
      {
        id: 'o1-mini',
        name: 'O1 Mini',
        description: 'Faster reasoning model',
        contextLength: 128000,
      },
      {
        id: 'claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Anthropic model via Copilot',
        contextLength: 200000,
      },
    ];
  }

  setModel(modelId: string): void {
    const availableModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'o1-preview',
      'o1-mini',
      'claude-3.5-sonnet',
    ];

    if (!availableModels.includes(modelId)) {
      throw new Error(
        `Model "${modelId}" not supported. Available: ${availableModels.join(', ')}`
      );
    }

    this.model = modelId;
  }

  getCurrentModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'copilot';
  }
}
