/**
 * Qwen3 TTS Provider
 * Cloud text-to-speech using Alibaba Cloud DashScope Qwen3 TTS API
 * Supports voice cloning and custom voices
 */

import { TTSConfig, TTSResult } from './types';
import fs from 'fs';
import path from 'path';

export class QwenTTS {
  private config: TTSConfig;
  private apiKey: string;
  private voice: string;
  private model: string;
  private customVoices: Record<string, string>;
  private voiceCloneModel: string;

  constructor(config: TTSConfig) {
    this.config = config;
    this.apiKey = config.qwenApiKey || process.env.DASHSCOPE_API_KEY || '';
    this.voice = config.qwenVoice || process.env.QWEN_TTS_VOICE || 'Cherry';
    this.model = config.qwenModel || process.env.QWEN_TTS_MODEL || 'qwen3-tts-flash';
    this.customVoices = config.qwenCustomVoices || {};
    this.voiceCloneModel = config.qwenVoiceCloneModel || process.env.QWEN_TTS_VOICE_CLONE_MODEL || 'qwen3-tts-vc-realtime-2025-11-27';

    if (!this.apiKey) {
      throw new Error('Qwen/DashScope API key not configured');
    }
  }

  /**
   * Enroll a custom voice for cloning
   * @param audioFilePath Path to audio file (WAV, MP3, M4A, 10-60 seconds)
   * @param customVoiceId Unique identifier for this voice
   * @param language Language code (e.g., 'en', 'zh', 'ja')
   * @param description Optional description for the voice
   */
  async enrollVoice(
    audioFilePath: string,
    customVoiceId: string,
    language: string = 'en',
    description?: string
  ): Promise<{ success: boolean; voiceId?: string; error?: string }> {
    try {
      // Read audio file
      const audioBuffer = fs.readFileSync(audioFilePath);
      const audioBase64 = audioBuffer.toString('base64');
      
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/voice-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-voice-enrollment',
          input: {
            audio: audioBase64,
          },
          parameters: {
            custom_voice_id: customVoiceId,
            target_model: this.voiceCloneModel,
            language: language,
            description: description || `Custom voice ${customVoiceId}`,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Voice enrollment failed: ${error}`,
        };
      }

      const data = await response.json();
      
      if (data.output && data.output.custom_voice_id) {
        // Store the custom voice ID for future use
        this.customVoices[customVoiceId] = data.output.custom_voice_id;
        
        return {
          success: true,
          voiceId: data.output.custom_voice_id,
        };
      }

      return {
        success: false,
        error: 'No voice ID returned from enrollment',
      };
    } catch (error) {
      return {
        success: false,
        error: `Voice enrollment failed: ${error}`,
      };
    }
  }

  /**
   * Get list of enrolled custom voices
   */
  async listCustomVoices(): Promise<{ success: boolean; voices?: string[]; error?: string }> {
    try {
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/voice-enrollment/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Failed to list voices: ${error}`,
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        voices: data.voices || [],
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list voices: ${error}`,
      };
    }
  }

  /**
   * Synthesize speech with optional custom voice
   */
  async synthesize(text: string, voice?: string, isCustomVoice: boolean = false): Promise<TTSResult> {
    try {
      const selectedVoice = voice || this.voice;
      
      // Build parameters based on whether it's a custom voice
      const parameters: any = {
        format: 'mp3',
        sample_rate: 24000,
      };

      if (isCustomVoice) {
        // Use custom voice ID for cloned voices
        parameters.custom_voice_id = selectedVoice;
      } else {
        // Use preset voice name
        parameters.voice = selectedVoice;
      }
      
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
          parameters: parameters,
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

  /**
   * Synthesize dialogue with support for custom voices
   */
  async synthesizeDialogue(lines: Array<{ speaker: string; text: string }>): Promise<TTSResult[]> {
    // Map speakers to Qwen voices (preset or custom)
    // First check custom voices, then fall back to preset voices
    const presetVoiceMap: Record<string, string> = {
      'Host 1': 'Ethan',  // Male voice
      'Host 2': 'Cherry', // Female voice
    };

    const results: TTSResult[] = [];

    for (const line of lines) {
      let voice: string;
      let isCustomVoice = false;

      // Check if speaker has a custom voice enrolled
      if (this.customVoices[line.speaker]) {
        voice = this.customVoices[line.speaker];
        isCustomVoice = true;
      } else if (presetVoiceMap[line.speaker]) {
        // Use preset voice
        voice = presetVoiceMap[line.speaker];
      } else {
        // Default voice
        voice = this.voice;
      }

      const result = await this.synthesize(line.text, voice, isCustomVoice);
      results.push(result);
      
      // Small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Set custom voice mapping for a speaker
   */
  setCustomVoice(speakerName: string, customVoiceId: string): void {
    this.customVoices[speakerName] = customVoiceId;
  }

  /**
   * Get custom voice ID for a speaker
   */
  getCustomVoice(speakerName: string): string | undefined {
    return this.customVoices[speakerName];
  }

  /**
   * Get all custom voice mappings
   */
  getCustomVoices(): Record<string, string> {
    return { ...this.customVoices };
  }
}
