/**
 * Qwen3 TTS Provider
 * Cloud text-to-speech using Alibaba Cloud DashScope Qwen3 TTS API
 */

import { TTSConfig, TTSResult } from './types';
import fs from 'fs';
import path from 'path';

export class QwenTTS {
  private config: TTSConfig;
  private apiKey: string;
  private voice: string;
  private model: string;

  constructor(config: TTSConfig) {
    this.config = config;
    this.apiKey = config.qwenApiKey || process.env.DASHSCOPE_API_KEY || '';
    this.voice = config.qwenVoice || process.env.QWEN_TTS_VOICE || 'Cherry';
    this.model = config.qwenModel || process.env.QWEN_TTS_MODEL || 'qwen3-tts-flash';

    if (!this.apiKey) {
      throw new Error('Qwen/DashScope API key not configured');
    }
  }

  async synthesize(text: string, voice?: string): Promise<TTSResult> {
    try {
      const selectedVoice = voice || this.voice;
      
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/synthesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: {
            text: text,
          },
          parameters: {
            voice: selectedVoice,
            format: 'mp3',
            sample_rate: 24000,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Qwen TTS API error: ${error}`,
        };
      }

      const data = await response.json();
      
      if (!data.output || !data.output.audio_url) {
        return {
          success: false,
          error: 'No audio URL returned from Qwen TTS',
        };
      }

      // Download the audio from the URL
      const audioUrl = data.output.audio_url;
      const audioResponse = await fetch(audioUrl);
      
      if (!audioResponse.ok) {
        return {
          success: false,
          error: 'Failed to download audio from Qwen TTS',
        };
      }

      const buffer = await audioResponse.arrayBuffer();
      const outputPath = path.join('/tmp', `qwen-tts-${Date.now()}.mp3`);
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
        error: `Qwen TTS request failed: ${error}`,
      };
    }
  }

  async synthesizeDialogue(lines: Array<{ speaker: string; text: string }>): Promise<TTSResult[]> {
    // Map speakers to Qwen voices
    // Available voices: Cherry, Ethan, etc.
    const voiceMap: Record<string, string> = {
      'Host 1': 'Ethan',  // Male voice
      'Host 2': 'Cherry', // Female voice
    };

    const results: TTSResult[] = [];

    for (const line of lines) {
      const voice = voiceMap[line.speaker] || this.voice;
      const result = await this.synthesize(line.text, voice);
      results.push(result);
      
      // Small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}
