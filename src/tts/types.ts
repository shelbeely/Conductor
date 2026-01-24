/**
 * TTS Module Types
 */

export type TTSProvider = 'piper' | 'openai' | 'elevenlabs' | 'google' | 'qwen' | 'bark';

export type DJVoicePersona = 
  | 'Midnight FM'
  | 'Morning Drive'
  | 'Classic Rock FM'
  | 'College Radio Chaos'
  | 'Top 40 Pop Host'
  | 'Underground Electronic'
  | 'Public Radio Narrator'
  | 'Old-School AM Talk'
  | 'Soft Indie Host'
  | 'Futuristic AI DJ'
  | 'Late-Night Confessional'
  | 'Sports Radio Energy'
  | 'Retro 90s Alt DJ'
  | 'Luxury Lounge Host'
  | 'Queer Community Radio'
  | 'No-Nonsense News Break'
  | 'DIY Punk Radio'
  | 'Ambient Soundscape Guide'
  | 'Global Beats Curator'
  | 'After-Hours Chillhop'
  | 'Velvet Soul Crooner'
  | 'Indie Whisper Poet'
  | 'Arena Rock Frontperson'
  | 'Lo-Fi Bedroom Pop'
  | 'Alternative Cool Minimalist'
  | 'Neo-Soul Groove Host'
  | 'Electronic Pop Futurist'
  | 'Folk Storyteller'
  | 'Grunge-Era Radio Cool'
  | 'Experimental Art-Pop Host';

export interface VoicePersonaConfig {
  name: DJVoicePersona;
  description: string;
  voicePrompt: string;
  pacing: 'slow' | 'medium' | 'fast';
  pitch: 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high';
  emotionalTone: string;
  broadcastStyle: string;
  characteristics: string[];
}

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
  djVoicePersona?: DJVoicePersona;  // Selected DJ voice persona
  
  // Bark settings (local TTS with non-verbal sounds)
  barkPythonPath?: string;  // Path to Python interpreter with Bark installed
  barkModelPath?: string;   // Path to Bark model directory (optional)
  barkVoice?: string;       // Voice preset (e.g., 'v2/en_speaker_6')
  barkEnableNonVerbal?: boolean;  // Enable automatic non-verbal sound injection
  
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
