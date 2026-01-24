/**
 * Bark TTS Provider
 * Local text-to-speech using Bark with non-verbal sounds support
 * Bark is a transformer-based text-to-audio model that can generate highly realistic,
 * multilingual speech as well as other audio - including music, background noise and simple sound effects.
 */

import { TTSConfig, TTSResult, DJVoicePersona } from './types';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export class BarkTTS {
  private config: TTSConfig;
  private pythonPath: string;
  private modelPath: string;
  private voice: string;
  private currentPersona: DJVoicePersona | null = null;

  // Bark speaker presets (v2 voices)
  private static readonly VOICE_PRESETS = {
    'announcer': 'v2/en_speaker_6',  // Announcer-style voice
    'male_conversational': 'v2/en_speaker_9',  // Conversational male
    'female_conversational': 'v2/en_speaker_3',  // Conversational female
    'male_narrator': 'v2/en_speaker_0',  // Narrator male
    'female_narrator': 'v2/en_speaker_1',  // Narrator female
    'male_expressive': 'v2/en_speaker_5',  // Expressive male
    'female_expressive': 'v2/en_speaker_2',  // Expressive female
    'male_calm': 'v2/en_speaker_4',  // Calm male
    'female_calm': 'v2/en_speaker_7',  // Calm female
    'male_energetic': 'v2/en_speaker_8',  // Energetic male
  };

  // Persona to voice preset mapping
  private static readonly PERSONA_VOICE_MAP: Record<DJVoicePersona, string> = {
    'Midnight FM': 'male_calm',
    'Morning Drive': 'female_energetic',
    'Classic Rock FM': 'announcer',
    'College Radio Chaos': 'male_conversational',
    'Top 40 Pop Host': 'female_expressive',
    'Underground Electronic': 'male_narrator',
    'Public Radio Narrator': 'female_narrator',
    'Old-School AM Talk': 'announcer',
    'Soft Indie Host': 'female_calm',
    'Futuristic AI DJ': 'male_narrator',
    'Late-Night Confessional': 'male_calm',
    'Sports Radio Energy': 'male_energetic',
    'Retro 90s Alt DJ': 'male_conversational',
    'Luxury Lounge Host': 'male_calm',
    'Queer Community Radio': 'female_conversational',
    'No-Nonsense News Break': 'announcer',
    'DIY Punk Radio': 'male_expressive',
    'Ambient Soundscape Guide': 'female_calm',
    'Global Beats Curator': 'female_narrator',
    'After-Hours Chillhop': 'male_calm',
    'Velvet Soul Crooner': 'male_calm',
    'Indie Whisper Poet': 'female_calm',
    'Arena Rock Frontperson': 'male_energetic',
    'Lo-Fi Bedroom Pop': 'female_calm',
    'Alternative Cool Minimalist': 'male_narrator',
    'Neo-Soul Groove Host': 'male_conversational',
    'Electronic Pop Futurist': 'female_narrator',
    'Folk Storyteller': 'female_narrator',
    'Grunge-Era Radio Cool': 'male_conversational',
    'Experimental Art-Pop Host': 'female_expressive',
  };

  constructor(config: TTSConfig) {
    this.config = config;
    this.pythonPath = config.barkPythonPath || process.env.BARK_PYTHON_PATH || 'python3';
    this.modelPath = config.barkModelPath || process.env.BARK_MODEL_PATH || '';
    this.voice = config.barkVoice || process.env.BARK_VOICE || 'v2/en_speaker_6';
  }

  /**
   * Set current DJ voice persona
   */
  setPersona(persona: DJVoicePersona): void {
    this.currentPersona = persona;
  }

  /**
   * Get current persona
   */
  getCurrentPersona(): DJVoicePersona | null {
    return this.currentPersona;
  }

  /**
   * Get voice preset for a persona
   */
  private getVoiceForPersona(persona: DJVoicePersona): string {
    const voicePreset = BarkTTS.PERSONA_VOICE_MAP[persona];
    return BarkTTS.VOICE_PRESETS[voicePreset] || this.voice;
  }

  /**
   * Synthesize text with optional non-verbal sounds
   * Bark supports special tokens for non-verbal sounds:
   * - [laughter] - laughing
   * - [laughs] - brief laugh
   * - [sighs] - sighing
   * - [music] - background music
   * - [gasps] - gasping
   * - [clears throat] - throat clearing
   * - ... - hesitation/pause
   */
  async synthesize(text: string, voice?: string): Promise<TTSResult> {
    try {
      const selectedVoice = voice || 
        (this.currentPersona ? this.getVoiceForPersona(this.currentPersona) : this.voice);
      
      const outputPath = path.join('/tmp', `bark-${Date.now()}.wav`);

      // Create a Python script to call Bark
      const scriptPath = path.join('/tmp', `bark-script-${Date.now()}.py`);
      const pythonScript = `
import sys
try:
    from bark import SAMPLE_RATE, generate_audio, preload_models
    from scipy.io.wavfile import write as write_wav
    import numpy as np
    
    # Preload models
    preload_models()
    
    # Generate audio
    text_prompt = """${text.replace(/"/g, '\\"')}"""
    voice_preset = "${selectedVoice}"
    
    audio_array = generate_audio(text_prompt, history_prompt=voice_preset)
    
    # Save audio
    write_wav("${outputPath}", SAMPLE_RATE, audio_array)
    
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;

      fs.writeFileSync(scriptPath, pythonScript);

      return new Promise((resolve) => {
        const child = spawn(this.pythonPath, [scriptPath]);

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          // Clean up script
          try {
            fs.unlinkSync(scriptPath);
          } catch (err) {
            // Ignore cleanup errors
          }

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
              error: `Bark synthesis failed: ${stderr || stdout}`,
            });
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: `Bark synthesis error: ${error}`,
      };
    }
  }

  /**
   * Synthesize dialogue with multiple speakers
   * Supports non-verbal sounds in the text
   */
  async synthesizeDialogue(lines: Array<{ speaker: string; text: string }>): Promise<TTSResult[]> {
    const results: TTSResult[] = [];

    // Map speakers to different voices
    const speakerVoices: Record<string, string> = {
      'Host 1': 'v2/en_speaker_9',  // Male conversational
      'Host 2': 'v2/en_speaker_3',  // Female conversational
      'Host 3': 'v2/en_speaker_5',  // Male expressive
      'Host 4': 'v2/en_speaker_2',  // Female expressive
      'Host 5': 'v2/en_speaker_8',  // Male energetic
    };

    for (const line of lines) {
      const voice = speakerVoices[line.speaker] || 'v2/en_speaker_6';
      const result = await this.synthesize(line.text, voice);
      results.push(result);
    }

    return results;
  }

  /**
   * Synthesize with current persona
   */
  async synthesizeWithPersona(text: string): Promise<TTSResult> {
    if (!this.currentPersona) {
      return {
        success: false,
        error: 'No persona set. Call setPersona() first.',
      };
    }

    const voice = this.getVoiceForPersona(this.currentPersona);
    return this.synthesize(text, voice);
  }

  /**
   * Add non-verbal sounds to text
   * Helper method to enhance DJ commentary with natural sounds
   */
  addNonVerbalSounds(text: string, sounds: Array<'laughter' | 'laughs' | 'sighs' | 'gasps' | 'clears_throat'>): string {
    const soundMap = {
      'laughter': '[laughter]',
      'laughs': '[laughs]',
      'sighs': '[sighs]',
      'gasps': '[gasps]',
      'clears_throat': '[clears throat]',
    };

    let enhanced = text;
    
    // Add sounds at appropriate points (after sentences, exclamations)
    sounds.forEach(sound => {
      const token = soundMap[sound];
      // Find good insertion points (after sentences or exclamations)
      const sentences = enhanced.split(/([.!?])\s+/);
      if (sentences.length > 2) {
        const insertIndex = Math.floor(Math.random() * (sentences.length - 1));
        sentences.splice(insertIndex, 0, ` ${token} `);
        enhanced = sentences.join('');
      }
    });

    return enhanced;
  }
}
