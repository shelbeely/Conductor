/**
 * Piper TTS Provider
 * Local text-to-speech using Piper
 */

import { TTSConfig, TTSResult } from './types';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export class PiperTTS {
  private config: TTSConfig;
  private piperPath: string;
  private modelPath: string;

  constructor(config: TTSConfig) {
    this.config = config;
    this.piperPath = config.piperPath || process.env.PIPER_PATH || 'piper';
    this.modelPath = config.piperModelPath || process.env.PIPER_MODEL_PATH || '';

    if (!this.modelPath) {
      throw new Error('Piper model path not configured');
    }
  }

  async synthesize(text: string): Promise<TTSResult> {
    const outputPath = path.join('/tmp', `piper-${Date.now()}.wav`);

    return new Promise((resolve) => {
      const child = spawn(this.piperPath, [
        '--model', this.modelPath,
        '--output_file', outputPath
      ]);

      let stderr = '';

      child.stdin.write(text);
      child.stdin.end();

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve({
            success: true,
            audio: {
              filepath: outputPath,
              format: 'wav',
            },
          });
        } else {
          resolve({
            success: false,
            error: `Piper failed: ${stderr}`,
          });
        }
      });

      child.on('error', (err) => {
        resolve({
          success: false,
          error: `Piper spawn error: ${err}`,
        });
      });
    });
  }
}
