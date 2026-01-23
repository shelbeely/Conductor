/**
 * ElevenLabs TTS Provider
 * Cloud text-to-speech using ElevenLabs API
 */

import { TTSConfig, TTSResult } from './types';
import fs from 'fs';
import path from 'path';

export class ElevenLabsTTS {
  private config: TTSConfig;
  private apiKey: string;
  private voiceId: string;

  constructor(config: TTSConfig) {
    this.config = config;
    this.apiKey = config.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || '';
    this.voiceId = config.elevenlabsVoiceId || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Default: Adam voice

    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }
  }

  async synthesize(text: string, voiceId?: string): Promise<TTSResult> {
    try {
      const selectedVoiceId = voiceId || this.voiceId;
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `ElevenLabs TTS API error: ${error}`,
        };
      }

      const buffer = await response.arrayBuffer();
      const outputPath = path.join('/tmp', `elevenlabs-tts-${Date.now()}.mp3`);
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
        error: `ElevenLabs TTS request failed: ${error}`,
      };
    }
  }

  async synthesizeDialogue(lines: Array<{ speaker: string; text: string }>): Promise<TTSResult[]> {
    // Map speakers to voice IDs
    const voiceMap: Record<string, string> = {
      'Host 1': 'pNInz6obpgDQGcFmaJgB',  // Adam - male voice
      'Host 2': '21m00Tcm4TlvDq8ikWAM',  // Rachel - female voice
    };

    const results: TTSResult[] = [];

    for (const line of lines) {
      const voiceId = voiceMap[line.speaker] || this.voiceId;
      const result = await this.synthesize(line.text, voiceId);
      results.push(result);
      
      // Small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}
