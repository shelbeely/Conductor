/**
 * OpenAI TTS Provider
 * Cloud text-to-speech using OpenAI API
 */

import { TTSConfig, TTSResult } from './types';
import fs from 'fs';
import path from 'path';

export class OpenAITTS {
  private config: TTSConfig;
  private apiKey: string;
  private voice: string;
  private speed: number;

  constructor(config: TTSConfig) {
    this.config = config;
    this.apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || '';
    this.voice = config.openaiVoice || 'alloy';
    this.speed = config.openaiSpeed || 1.0;

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }

  async synthesize(text: string): Promise<TTSResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: this.voice,
          input: text,
          speed: this.speed,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `OpenAI TTS API error: ${error}`,
        };
      }

      const buffer = await response.arrayBuffer();
      const outputPath = path.join('/tmp', `openai-tts-${Date.now()}.mp3`);
      fs.writeFileSync(outputPath, Buffer.from(buffer));

      return {
        success: true,
        audio: {
          filepath: outputPath,
          format: 'mp3',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `OpenAI TTS request failed: ${error}`,
      };
    }
  }
}
