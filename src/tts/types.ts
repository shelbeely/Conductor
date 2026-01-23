/**
 * TTS Module Types
 */

export type TTSProvider = 'piper' | 'openai' | 'elevenlabs' | 'google' | 'qwen';

export interface TTSConfig {
  provider: TTSProvider;
  enabled: boolean;
  
  // Piper settings
  piperPath?: string;
  piperModelPath?: string;
  
  // OpenAI settings
  openaiApiKey?: string;
  openaiVoice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  openaiSpeed?: number;
  
  // ElevenLabs settings
  elevenlabsApiKey?: string;
  elevenlabsVoiceId?: string;
  
  // Google settings
  googleApiKey?: string;
  googleVoice?: string;
  googleLanguageCode?: string;
  
  // Qwen settings
  qwenApiKey?: string;
  qwenVoice?: string;
  qwenModel?: string;
  qwenCustomVoices?: Record<string, string>;  // Map speaker names to custom voice IDs
  qwenVoiceCloneModel?: string;  // Model for voice cloning
  
  // Audio playback
  audioPlayer?: 'aplay' | 'mpg123' | 'sox' | 'ffplay';
}

export interface TTSAudio {
  filepath: string;
  duration?: number;
  format: 'wav' | 'mp3' | 'opus';
}

export interface TTSResult {
  success: boolean;
  audio?: TTSAudio;
  error?: string;
}
