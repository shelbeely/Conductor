/**
 * TTS Manager
 * Abstraction layer for text-to-speech providers
 */

import { TTSConfig, TTSResult, TTSProvider } from './types';
import { PiperTTS } from './piper';
import { OpenAITTS } from './openai';
import { ElevenLabsTTS } from './elevenlabs';
import { GoogleTTS } from './google';
import { QwenTTS } from './qwen';
import { BarkTTS } from './bark';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export class TTSManager {
  private config: TTSConfig;
  private provider: PiperTTS | OpenAITTS | ElevenLabsTTS | GoogleTTS | QwenTTS | BarkTTS | null = null;
  private cacheDir: string;
  private audioQueue: string[] = [];
  private isPlaying: boolean = false;

  constructor(config: TTSConfig) {
    this.config = config;
    this.cacheDir = process.env.TTS_CACHE_DIR || '/tmp/conductor-tts';
    
    // Create cache directory
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    // Initialize provider
    this.initializeProvider();
  }

  private initializeProvider(): void {
    if (!this.config.enabled) return;

    try {
      switch (this.config.provider) {
        case 'piper':
          this.provider = new PiperTTS(this.config);
          break;
        case 'openai':
          this.provider = new OpenAITTS(this.config);
          break;
        case 'elevenlabs':
          this.provider = new ElevenLabsTTS(this.config);
          break;
        case 'google':
          this.provider = new GoogleTTS(this.config);
          break;
        case 'qwen':
          this.provider = new QwenTTS(this.config);
          break;
        case 'bark':
          this.provider = new BarkTTS(this.config);
          break;
        default:
          console.warn(`TTS provider ${this.config.provider} not yet implemented`);
      }
    } catch (error) {
      console.error('Failed to initialize TTS provider:', error);
    }
  }

  /**
   * Generate speech audio file from text
   */
  async generateSpeech(text: string, cacheKey?: string): Promise<TTSResult> {
    if (!this.config.enabled || !this.provider) {
      return { success: false, error: 'TTS not enabled or provider not available' };
    }

    // Check cache first
    if (cacheKey) {
      const cached = this.getCachedAudio(cacheKey);
      if (cached) {
        return { success: true, audio: cached };
      }
    }

    try {
      const result = await this.provider.synthesize(text);
      
      // Cache if key provided
      if (result.success && result.audio && cacheKey) {
        this.cacheAudio(cacheKey, result.audio.filepath);
      }

      return result;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Generate speech and add to playback queue
   */
  async queueSpeech(text: string, cacheKey?: string): Promise<void> {
    const result = await this.generateSpeech(text, cacheKey);
    
    if (result.success && result.audio) {
      this.audioQueue.push(result.audio.filepath);
      
      // Start playback if not already playing
      if (!this.isPlaying) {
        this.playNext();
      }
    }
  }

  /**
   * Generate speech for long text by splitting into chunks
   */
  async generateLongSpeech(text: string, cacheKey?: string): Promise<TTSResult[]> {
    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const results: TTSResult[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;

      const chunkKey = cacheKey ? `${cacheKey}_chunk_${i}` : undefined;
      const result = await this.generateSpeech(sentence, chunkKey);
      results.push(result);

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Generate dialogue-style speech (for podcast/radio host format)
   */
  async generateDialogue(dialogue: Array<{ speaker: string; text: string }>, cacheKey?: string): Promise<TTSResult[]> {
    if (!this.config.enabled || !this.provider) {
      return [];
    }

    // Check if provider supports dialogue (all new providers do)
    if (this.provider instanceof OpenAITTS || 
        this.provider instanceof ElevenLabsTTS || 
        this.provider instanceof GoogleTTS || 
        this.provider instanceof QwenTTS) {
      const results = await (this.provider as any).synthesizeDialogue(dialogue);
      
      // Cache results if key provided
      if (cacheKey) {
        for (let i = 0; i < results.length; i++) {
          if (results[i].success && results[i].audio) {
            const lineKey = `${cacheKey}_line_${i}`;
            this.cacheAudio(lineKey, results[i].audio!.filepath);
          }
        }
      }
      
      return results;
    } else {
      // Fallback: generate each line separately (for Piper)
      const results: TTSResult[] = [];
      for (let i = 0; i < dialogue.length; i++) {
        const line = dialogue[i];
        const lineKey = cacheKey ? `${cacheKey}_line_${i}` : undefined;
        const result = await this.generateSpeech(line.text, lineKey);
        results.push(result);
      }
      return results;
    }
  }

  /**
   * Queue dialogue for playback
   */
  async queueDialogue(dialogue: Array<{ speaker: string; text: string }>, cacheKey?: string): Promise<void> {
    const results = await this.generateDialogue(dialogue, cacheKey);
    
    for (const result of results) {
      if (result.success && result.audio) {
        this.audioQueue.push(result.audio.filepath);
      }
    }

    // Start playback if not already playing
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Queue long text for playback
   */
  async queueLongSpeech(text: string, cacheKey?: string): Promise<void> {
    const results = await this.generateLongSpeech(text, cacheKey);
    
    for (const result of results) {
      if (result.success && result.audio) {
        this.audioQueue.push(result.audio.filepath);
      }
    }

    // Start playback if not already playing
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Play next audio in queue
   */
  private async playNext(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const filepath = this.audioQueue.shift()!;

    try {
      await this.playAudio(filepath);
    } catch (error) {
      console.error('Error playing audio:', error);
    }

    // Play next
    this.playNext();
  }

  /**
   * Play audio file
   */
  private playAudio(filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const player = this.config.audioPlayer || this.detectAudioPlayer();
      
      if (!player) {
        reject(new Error('No audio player available'));
        return;
      }

      const child = spawn(player, [filepath]);
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Audio player exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Detect available audio player
   */
  private detectAudioPlayer(): string | null {
    const players = ['aplay', 'mpg123', 'ffplay', 'sox'];
    
    for (const player of players) {
      try {
        const result = spawn('which', [player]);
        if (result) return player;
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Get cached audio
   */
  private getCachedAudio(key: string): TTSResult['audio'] | null {
    const extensions = ['wav', 'mp3', 'opus'];
    
    for (const ext of extensions) {
      const filepath = path.join(this.cacheDir, `${key}.${ext}`);
      if (fs.existsSync(filepath)) {
        return {
          filepath,
          format: ext as any,
        };
      }
    }

    return null;
  }

  /**
   * Cache audio file
   */
  private cacheAudio(key: string, sourcePath: string): void {
    try {
      const ext = path.extname(sourcePath).substring(1);
      const targetPath = path.join(this.cacheDir, `${key}.${ext}`);
      fs.copyFileSync(sourcePath, targetPath);
    } catch (error) {
      console.error('Failed to cache audio:', error);
    }
  }

  /**
   * Clear audio queue
   */
  clearQueue(): void {
    this.audioQueue = [];
  }

  /**
   * Stop current playback
   */
  stop(): void {
    this.isPlaying = false;
    this.audioQueue = [];
  }

  /**
   * Clean up old cache files
   */
  cleanCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const now = Date.now();

      for (const file of files) {
        const filepath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filepath);
        }
      }
    } catch (error) {
      console.error('Failed to clean cache:', error);
    }
  }

  /**
   * Check if TTS is available
   */
  isAvailable(): boolean {
    return this.config.enabled && this.provider !== null;
  }
}
