/**
 * Google Cloud TTS Provider
 * Cloud text-to-speech using Google Cloud Text-to-Speech API
 */

import { TTSConfig, TTSResult } from './types';
import fs from 'fs';
import path from 'path';

export class GoogleTTS {
  private config: TTSConfig;
  private apiKey: string;
  private voice: string;
  private languageCode: string;

  constructor(config: TTSConfig) {
    this.config = config;
    this.apiKey = config.googleApiKey || process.env.GOOGLE_API_KEY || '';
    this.voice = config.googleVoice || process.env.GOOGLE_TTS_VOICE || 'en-US-Neural2-D';
    this.languageCode = config.googleLanguageCode || process.env.GOOGLE_TTS_LANGUAGE || 'en-US';

    if (!this.apiKey) {
      throw new Error('Google API key not configured');
    }
  }

  async synthesize(text: string, voice?: string, ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL'): Promise<TTSResult> {
    try {
      const selectedVoice = voice || this.voice;
      
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: this.languageCode,
            name: selectedVoice,
            ssmlGender: ssmlGender || 'NEUTRAL',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 1.0,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Google TTS API error: ${error}`,
        };
      }

      const data = await response.json();
      
      if (!data.audioContent) {
        return {
          success: false,
          error: 'No audio content returned from Google TTS',
        };
      }

      // Google returns base64 encoded audio
      const buffer = Buffer.from(data.audioContent, 'base64');
      const outputPath = path.join('/tmp', `google-tts-${Date.now()}.mp3`);
      fs.writeFileSync(outputPath, buffer);

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
        error: `Google TTS request failed: ${error}`,
      };
    }
  }

  async synthesizeDialogue(lines: Array<{ speaker: string; text: string }>): Promise<TTSResult[]> {
    // Map speakers to Google voices
    const voiceMap: Record<string, { name: string; gender: 'MALE' | 'FEMALE' }> = {
      'Host 1': { name: 'en-US-Neural2-D', gender: 'MALE' },   // Male voice
      'Host 2': { name: 'en-US-Neural2-F', gender: 'FEMALE' }, // Female voice
    };

    const results: TTSResult[] = [];

    for (const line of lines) {
      const voiceConfig = voiceMap[line.speaker] || { name: this.voice, gender: 'NEUTRAL' as const };
      const result = await this.synthesize(line.text, voiceConfig.name, voiceConfig.gender);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}
