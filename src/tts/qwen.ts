/**
 * Qwen3 TTS Provider
 * Cloud text-to-speech using Alibaba Cloud DashScope Qwen3 TTS API
 * Supports voice cloning and custom voices
 */

import { TTSConfig, TTSResult, DJVoicePersona, VoicePersonaConfig } from './types';
import fs from 'fs';
import path from 'path';

// Voice persona configurations for AI Radio DJ
const VOICE_PERSONAS: Record<DJVoicePersona, VoicePersonaConfig> = {
  'Midnight FM': {
    name: 'Midnight FM',
    description: 'Low, warm, intimate late-night radio voice',
    voicePrompt: 'deep warm intimate voice, slow pacing, soft consonants, relaxed delivery, cozy late-night radio DJ tone, calm and reflective, feels like 1:47 AM conversation',
    pacing: 'slow',
    pitch: 'low',
    emotionalTone: 'calm, reflective, cozy',
    broadcastStyle: 'intimate late-night radio',
    characteristics: ['warm', 'intimate', 'slow pacing', 'soft consonants', 'relaxed']
  },
  'Morning Drive': {
    name: 'Morning Drive',
    description: 'Bright, upbeat, high-energy commuter radio host',
    voicePrompt: 'bright energetic upbeat voice, faster pacing, crisp articulation, smile in voice, wake-up energy without yelling, cheerful encouraging tone',
    pacing: 'fast',
    pitch: 'medium-high',
    emotionalTone: 'cheerful, encouraging, energetic',
    broadcastStyle: 'morning commuter radio',
    characteristics: ['bright', 'upbeat', 'fast pacing', 'crisp', 'energetic']
  },
  'Classic Rock FM': {
    name: 'Classic Rock FM',
    description: 'Slightly gravelly, confident, experienced broadcaster',
    voicePrompt: 'confident experienced voice with slight gravel, medium pacing, strong emphasis on band names, seasoned but not old, nostalgic cool tone',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'confident, nostalgic, cool',
    broadcastStyle: 'classic rock radio',
    characteristics: ['gravelly', 'confident', 'experienced', 'cool']
  },
  'College Radio Chaos': {
    name: 'College Radio Chaos',
    description: 'Casual, slightly messy, authentic indie DJ',
    voicePrompt: 'casual authentic indie voice, natural pauses, occasional rambles, human imperfections, quirky earnest playful tone, sounds like vinyl and coffee',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'quirky, earnest, playful',
    broadcastStyle: 'indie college radio',
    characteristics: ['casual', 'messy', 'authentic', 'quirky']
  },
  'Top 40 Pop Host': {
    name: 'Top 40 Pop Host',
    description: 'Polished, glossy, radio-ready pop presentation',
    voicePrompt: 'polished glossy commercial voice, clean delivery, rhythmic cadence, mainstream appeal, excited friendly hype tone, radio-ready pop',
    pacing: 'fast',
    pitch: 'medium-high',
    emotionalTone: 'excited, friendly, hype-adjacent',
    broadcastStyle: 'mainstream pop radio',
    characteristics: ['polished', 'glossy', 'rhythmic', 'commercial']
  },
  'Underground Electronic': {
    name: 'Underground Electronic',
    description: 'Cool, minimal, slightly detached club DJ voice',
    voicePrompt: 'cool minimal detached voice, lower affect, intentional pacing, subtle confidence, warehouse club vibe at 2 AM, restrained stylish mysterious',
    pacing: 'medium',
    pitch: 'medium-low',
    emotionalTone: 'restrained, stylish, mysterious',
    broadcastStyle: 'underground electronic club',
    characteristics: ['cool', 'minimal', 'detached', 'mysterious']
  },
  'Public Radio Narrator': {
    name: 'Public Radio Narrator',
    description: 'Calm, articulate, thoughtful, neutral-but-warm',
    voicePrompt: 'calm articulate thoughtful voice, slower pacing, precise pronunciation, informative neutral-warm tone, trustworthy intelligent, public radio style',
    pacing: 'slow',
    pitch: 'medium',
    emotionalTone: 'composed, curious, grounded',
    broadcastStyle: 'public radio',
    characteristics: ['calm', 'articulate', 'thoughtful', 'trustworthy']
  },
  'Old-School AM Talk': {
    name: 'Old-School AM Talk',
    description: 'Assertive, expressive, slightly dramatic delivery',
    voicePrompt: 'assertive expressive voice, slightly dramatic delivery, clear emphasis, strong opinions implied, classic talk radio style, confident animated commanding',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'confident, animated, commanding',
    broadcastStyle: 'classic AM talk radio',
    characteristics: ['assertive', 'expressive', 'dramatic', 'commanding']
  },
  'Soft Indie Host': {
    name: 'Soft Indie Host',
    description: 'Gentle, breathy, emotionally present voice',
    voicePrompt: 'gentle breathy emotionally present voice, slight vulnerability, careful phrasing, intimate tender tone, perfect for indie folk lo-fi, sincere warm',
    pacing: 'slow',
    pitch: 'medium',
    emotionalTone: 'tender, sincere, warm',
    broadcastStyle: 'indie folk radio',
    characteristics: ['gentle', 'breathy', 'vulnerable', 'intimate']
  },
  'Futuristic AI DJ': {
    name: 'Futuristic AI DJ',
    description: 'Smooth, controlled, subtly synthetic but pleasant',
    voicePrompt: 'smooth controlled voice, subtly synthetic but pleasant, even pacing, clean tone, minimal emotional spikes, intentional modern sleek, calm precise quietly confident',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'calm, precise, quietly confident',
    broadcastStyle: 'futuristic electronic',
    characteristics: ['smooth', 'controlled', 'synthetic', 'sleek']
  },
  'Late-Night Confessional': {
    name: 'Late-Night Confessional',
    description: 'Soft, close-mic'd, emotionally intimate voice',
    voicePrompt: 'soft intimate close-mic voice, very slow pacing, audible breaths, gentle inflection, feels like secrets shared after midnight, vulnerable sincere reassuring tone',
    pacing: 'slow',
    pitch: 'medium-low',
    emotionalTone: 'vulnerable, sincere, reassuring',
    broadcastStyle: 'intimate confessional',
    characteristics: ['soft', 'intimate', 'breathy', 'vulnerable']
  },
  'Sports Radio Energy': {
    name: 'Sports Radio Energy',
    description: 'Confident, fast-paced, slightly aggressive but controlled',
    voicePrompt: 'confident fast-paced voice, slightly aggressive but controlled, clear emphasis, punchy rhythm, assertive delivery, sounds opinionated, hyped competitive animated',
    pacing: 'fast',
    pitch: 'medium-high',
    emotionalTone: 'hyped, competitive, animated',
    broadcastStyle: 'sports radio',
    characteristics: ['confident', 'fast', 'aggressive', 'punchy']
  },
  'Retro 90s Alt DJ': {
    name: 'Retro 90s Alt DJ',
    description: 'Dry, ironic, slightly detached Gen-X cadence',
    voicePrompt: 'dry ironic detached Gen-X voice, medium pacing, understated delivery, minimal hype, feels like flannel and distortion pedals, cool sarcastic understated',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'cool, sarcastic, understated',
    broadcastStyle: '90s alternative radio',
    characteristics: ['dry', 'ironic', 'detached', 'understated']
  },
  'Luxury Lounge Host': {
    name: 'Luxury Lounge Host',
    description: 'Smooth, velvety, sophisticated presentation',
    voicePrompt: 'smooth velvety sophisticated voice, slow-medium pacing, elegant phrasing, relaxed confidence, feels expensive and candlelit, smooth refined sensual non-sexual',
    pacing: 'slow',
    pitch: 'medium-low',
    emotionalTone: 'smooth, refined, sensual',
    broadcastStyle: 'luxury lounge',
    characteristics: ['smooth', 'velvety', 'sophisticated', 'elegant']
  },
  'Queer Community Radio': {
    name: 'Queer Community Radio',
    description: 'Warm, affirming, conversational voice',
    voicePrompt: 'warm affirming conversational voice, natural pacing, emotionally intelligent delivery, welcoming safe human-first, supportive joyful grounded',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'supportive, joyful, grounded',
    broadcastStyle: 'community radio',
    characteristics: ['warm', 'affirming', 'welcoming', 'supportive']
  },
  'No-Nonsense News Break': {
    name: 'No-Nonsense News Break',
    description: 'Neutral, clipped, efficient broadcast voice',
    voicePrompt: 'neutral clipped efficient broadcast voice, fast clarity, minimal emotion, information-first delivery, perfect for headlines and alerts, restrained serious focused',
    pacing: 'fast',
    pitch: 'medium',
    emotionalTone: 'restrained, serious, focused',
    broadcastStyle: 'news broadcast',
    characteristics: ['neutral', 'clipped', 'efficient', 'serious']
  },
  'DIY Punk Radio': {
    name: 'DIY Punk Radio',
    description: 'Raw, energetic, imperfect delivery encouraged',
    voicePrompt: 'raw energetic voice with imperfections, faster pacing, expressive emphasis, casual grit, feels like basement show and photocopied flyers, rebellious enthusiastic scrappy',
    pacing: 'fast',
    pitch: 'medium-high',
    emotionalTone: 'rebellious, enthusiastic, scrappy',
    broadcastStyle: 'DIY punk radio',
    characteristics: ['raw', 'energetic', 'imperfect', 'gritty']
  },
  'Ambient Soundscape Guide': {
    name: 'Ambient Soundscape Guide',
    description: 'Soft, slow, almost whispered narration',
    voicePrompt: 'soft slow almost whispered voice, long pauses, flowing rhythm, low vocal intensity, blends into music, calm meditative airy',
    pacing: 'slow',
    pitch: 'low',
    emotionalTone: 'calm, meditative, airy',
    broadcastStyle: 'ambient soundscape',
    characteristics: ['soft', 'whispered', 'flowing', 'meditative']
  },
  'Global Beats Curator': {
    name: 'Global Beats Curator',
    description: 'Confident, rhythmic, culturally curious tone',
    voicePrompt: 'confident rhythmic culturally curious voice, medium pacing, careful pronunciation of names and places, intentional respectful worldly, engaged vibrant thoughtful',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'engaged, vibrant, thoughtful',
    broadcastStyle: 'world music curation',
    characteristics: ['confident', 'rhythmic', 'curious', 'worldly']
  },
  'After-Hours Chillhop': {
    name: 'After-Hours Chillhop',
    description: 'Low-energy, relaxed, slightly sleepy voice',
    voicePrompt: 'low-energy relaxed slightly sleepy voice, slow pacing, soft articulation, minimal emphasis, feels like city lights through bus window, mellow cozy introspective',
    pacing: 'slow',
    pitch: 'low',
    emotionalTone: 'mellow, cozy, introspective',
    broadcastStyle: 'chillhop after-hours',
    characteristics: ['low-energy', 'relaxed', 'sleepy', 'mellow']
  },
  'Velvet Soul Crooner': {
    name: 'Velvet Soul Crooner',
    description: 'Smooth, rounded tone with emotional warmth inspired by classic soul',
    voicePrompt: 'smooth rounded emotionally warm voice inspired by classic soul R&B vocalists, slow-medium pacing, expressive vowels, gentle emphasis, heartfelt without melodrama, romantic earnest soothing',
    pacing: 'slow',
    pitch: 'medium-low',
    emotionalTone: 'romantic, earnest, soothing',
    broadcastStyle: 'soul & R&B inspired',
    characteristics: ['smooth', 'warm', 'expressive', 'heartfelt']
  },
  'Indie Whisper Poet': {
    name: 'Indie Whisper Poet',
    description: 'Soft, airy delivery with introspective energy like indie singer-songwriters',
    voicePrompt: 'soft airy introspective voice inspired by modern indie singer-songwriters, slight breathiness, careful phrasing, intimate mic presence, personal not performative, tender thoughtful melancholic',
    pacing: 'slow',
    pitch: 'medium',
    emotionalTone: 'tender, thoughtful, melancholic',
    broadcastStyle: 'indie songwriter inspired',
    characteristics: ['soft', 'airy', 'introspective', 'intimate']
  },
  'Arena Rock Frontperson': {
    name: 'Arena Rock Frontperson',
    description: 'Confident, expansive tone with stadium rock energy without shouting',
    voicePrompt: 'confident expansive voice inspired by stadium rock frontpersons, strong projection, energized rhythm, bold phrasing without shouting, commanding but friendly, triumphant hyped charismatic',
    pacing: 'medium',
    pitch: 'medium-high',
    emotionalTone: 'triumphant, hyped, charismatic',
    broadcastStyle: 'arena rock inspired',
    characteristics: ['confident', 'expansive', 'bold', 'charismatic']
  },
  'Lo-Fi Bedroom Pop': {
    name: 'Lo-Fi Bedroom Pop',
    description: 'Relaxed, casual delivery with subtle emotional color like DIY bedroom producers',
    voicePrompt: 'relaxed casual voice inspired by DIY bedroom producers, natural pauses, conversational tone, low pressure, feels homemade in best way, chill sincere understated',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'chill, sincere, understated',
    broadcastStyle: 'bedroom pop inspired',
    characteristics: ['relaxed', 'casual', 'conversational', 'homemade']
  },
  'Alternative Cool Minimalist': {
    name: 'Alternative Cool Minimalist',
    description: 'Flat affect by design, understated alt & post-punk inspired restraint',
    voicePrompt: 'flat affect voice inspired by understated alt post-punk singers, intentional restraint, even pacing, minimal inflection, confident calm, aloof but compelling, cool detached controlled',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'cool, detached, controlled',
    broadcastStyle: 'alt minimalist inspired',
    characteristics: ['flat', 'restrained', 'minimal', 'aloof']
  },
  'Neo-Soul Groove Host': {
    name: 'Neo-Soul Groove Host',
    description: 'Rhythmic speech with warm tone, modern soul & groove artists inspired',
    voicePrompt: 'rhythmic warm voice inspired by modern soul groove artists, subtle musicality, cadence matters more than volume, voice rides the beat, smooth confident grounded',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'smooth, confident, grounded',
    broadcastStyle: 'neo-soul inspired',
    characteristics: ['rhythmic', 'warm', 'musical', 'groove']
  },
  'Electronic Pop Futurist': {
    name: 'Electronic Pop Futurist',
    description: 'Clean, precise delivery with modern edge from experimental pop & synth artists',
    voicePrompt: 'clean precise voice inspired by experimental pop synth artists, modern edge, balanced warmth and polish, lightly stylized, forward-looking not robotic, poised sleek playful',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'poised, sleek, playful',
    broadcastStyle: 'electronic pop inspired',
    characteristics: ['clean', 'precise', 'modern', 'stylized']
  },
  'Folk Storyteller': {
    name: 'Folk Storyteller',
    description: 'Natural, narrative-focused delivery like acoustic folk musicians',
    voicePrompt: 'natural narrative-focused voice inspired by acoustic folk musicians, gentle pacing, clear diction, emotional honesty, feels like telling stories by fire, warm reflective grounded',
    pacing: 'slow',
    pitch: 'medium',
    emotionalTone: 'warm, reflective, grounded',
    broadcastStyle: 'folk storytelling inspired',
    characteristics: ['natural', 'narrative', 'gentle', 'honest']
  },
  'Grunge-Era Radio Cool': {
    name: 'Grunge-Era Radio Cool',
    description: 'Slight grit in tone with 90s alternative energy and unforced confidence',
    voicePrompt: 'slightly gritty voice inspired by 90s alternative grunge era, relaxed pacing, unforced confidence, anti-hype in cool way, raw casual authentic',
    pacing: 'medium',
    pitch: 'medium-low',
    emotionalTone: 'raw, casual, authentic',
    broadcastStyle: 'grunge-era inspired',
    characteristics: ['gritty', 'relaxed', 'confident', 'anti-hype']
  },
  'Experimental Art-Pop Host': {
    name: 'Experimental Art-Pop Host',
    description: 'Expressive, dynamic delivery inspired by boundary-pushing art-pop musicians',
    voicePrompt: 'expressive dynamic voice inspired by experimental art-pop musicians, intentionally unconventional delivery, plays with pacing and emphasis creatively, artistic not chaotic, curious bold expressive',
    pacing: 'medium',
    pitch: 'medium',
    emotionalTone: 'curious, bold, expressive',
    broadcastStyle: 'art-pop inspired',
    characteristics: ['expressive', 'dynamic', 'unconventional', 'artistic']
  }
};

export class QwenTTS {
  private config: TTSConfig;
  private apiKey: string;
  private voice: string;
  private model: string;
  private customVoices: Record<string, string>;
  private voiceCloneModel: string;
  private currentPersona?: DJVoicePersona;

  constructor(config: TTSConfig) {
    this.config = config;
    this.apiKey = config.qwenApiKey || process.env.DASHSCOPE_API_KEY || '';
    this.voice = config.qwenVoice || process.env.QWEN_TTS_VOICE || 'Cherry';
    this.model = config.qwenModel || process.env.QWEN_TTS_MODEL || 'qwen3-tts-flash';
    this.customVoices = config.qwenCustomVoices || {};
    this.voiceCloneModel = config.qwenVoiceCloneModel || process.env.QWEN_TTS_VOICE_CLONE_MODEL || 'qwen3-tts-vc-realtime-2025-11-27';
    this.currentPersona = config.djVoicePersona || (process.env.DJ_VOICE_PERSONA as DJVoicePersona);

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
   * Auto-generate multiple DJ voices from a single audio sample
   * Uses voice design to create variations for different hosts
   * @param audioFilePath Path to source audio file (3-20 seconds)
   * @param language Language code (e.g., 'en', 'zh', 'ja')
   * @param numHosts Number of host voices to generate (default: 2)
   */
  async generateDJVoicesFromSample(
    audioFilePath: string,
    language: string = 'en',
    numHosts: number = 2
  ): Promise<{ 
    success: boolean; 
    voices?: Array<{ hostName: string; voiceId: string; description: string }>; 
    error?: string 
  }> {
    try {
      // Voice design prompts for different DJ personalities
      const voiceDesigns = [
        {
          hostName: 'Host 1',
          prompt: 'energetic male DJ voice, warm and conversational, medium pitch, enthusiastic tone',
          description: 'Energetic male host with warm conversational style'
        },
        {
          hostName: 'Host 2',
          prompt: 'friendly female DJ voice, upbeat and engaging, clear articulation, bright tone',
          description: 'Friendly female host with upbeat engaging style'
        },
        {
          hostName: 'Host 3',
          prompt: 'mature male voice, deep and authoritative, smooth delivery, professional tone',
          description: 'Mature male host with smooth professional delivery'
        },
        {
          hostName: 'Host 4',
          prompt: 'young female voice, cheerful and dynamic, higher pitch, energetic personality',
          description: 'Young female host with cheerful dynamic energy'
        },
        {
          hostName: 'Host 5',
          prompt: 'casual male voice, relaxed and friendly, conversational style, medium-low pitch',
          description: 'Casual male host with relaxed friendly style'
        }
      ];

      // Limit to requested number of hosts
      const selectedDesigns = voiceDesigns.slice(0, Math.min(numHosts, voiceDesigns.length));
      
      // Read the source audio file
      const audioBuffer = fs.readFileSync(audioFilePath);
      const audioBase64 = audioBuffer.toString('base64');

      const generatedVoices: Array<{ hostName: string; voiceId: string; description: string }> = [];

      // Generate each voice variation
      for (const design of selectedDesigns) {
        const customVoiceId = `dj_${design.hostName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        
        try {
          // Use voice design API to create a new voice based on the sample and design prompt
          const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/voice-design', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: 'qwen3-tts-voice-design',
              input: {
                audio: audioBase64,
                voice_prompt: design.prompt,
              },
              parameters: {
                custom_voice_id: customVoiceId,
                target_model: this.voiceCloneModel,
                language: language,
                description: design.description,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const voiceId = data.output?.custom_voice_id || customVoiceId;
            
            // Store the generated voice
            this.customVoices[design.hostName] = voiceId;
            
            generatedVoices.push({
              hostName: design.hostName,
              voiceId: voiceId,
              description: design.description,
            });
          } else {
            console.warn(`Failed to generate voice for ${design.hostName}: ${await response.text()}`);
          }
          
          // Delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn(`Error generating voice for ${design.hostName}:`, error);
        }
      }

      if (generatedVoices.length === 0) {
        return {
          success: false,
          error: 'Failed to generate any DJ voices',
        };
      }

      return {
        success: true,
        voices: generatedVoices,
      };
    } catch (error) {
      return {
        success: false,
        error: `Auto-generation failed: ${error}`,
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

  /**
   * Generate a DJ voice based on a persona
   * @param audioFilePath Path to source audio file (optional, for voice cloning base)
   * @param persona The DJ voice persona to generate
   * @param language Language code (default: 'en')
   */
  async generatePersonaVoice(
    audioFilePath: string | null,
    persona: DJVoicePersona,
    language: string = 'en'
  ): Promise<{ success: boolean; voiceId?: string; persona?: VoicePersonaConfig; error?: string }> {
    try {
      const personaConfig = VOICE_PERSONAS[persona];
      if (!personaConfig) {
        return {
          success: false,
          error: `Unknown persona: ${persona}`,
        };
      }

      const customVoiceId = `persona_${persona.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      
      let audioBase64: string | undefined;
      if (audioFilePath) {
        const audioBuffer = fs.readFileSync(audioFilePath);
        audioBase64 = audioBuffer.toString('base64');
      }

      // Use voice design API to create persona voice
      const requestBody: any = {
        model: 'qwen3-tts-voice-design',
        input: {
          voice_prompt: personaConfig.voicePrompt,
        },
        parameters: {
          custom_voice_id: customVoiceId,
          target_model: this.voiceCloneModel,
          language: language,
          description: personaConfig.description,
        },
      };

      // If audio sample provided, use it as reference
      if (audioBase64) {
        requestBody.input.audio = audioBase64;
      }

      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/voice-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Persona voice generation failed: ${error}`,
        };
      }

      const data = await response.json();
      const voiceId = data.output?.custom_voice_id || customVoiceId;

      // Store the persona voice
      this.customVoices[persona] = voiceId;
      this.currentPersona = persona;

      return {
        success: true,
        voiceId: voiceId,
        persona: personaConfig,
      };
    } catch (error) {
      return {
        success: false,
        error: `Persona voice generation failed: ${error}`,
      };
    }
  }

  /**
   * Set the current DJ voice persona
   */
  setPersona(persona: DJVoicePersona): void {
    if (VOICE_PERSONAS[persona]) {
      this.currentPersona = persona;
    } else {
      throw new Error(`Unknown persona: ${persona}`);
    }
  }

  /**
   * Get the current DJ voice persona
   */
  getCurrentPersona(): DJVoicePersona | undefined {
    return this.currentPersona;
  }

  /**
   * Get configuration for a specific persona
   */
  getPersonaConfig(persona: DJVoicePersona): VoicePersonaConfig | undefined {
    return VOICE_PERSONAS[persona];
  }

  /**
   * Get all available DJ voice personas
   */
  getAllPersonas(): VoicePersonaConfig[] {
    return Object.values(VOICE_PERSONAS);
  }

  /**
   * Synthesize speech using the current persona voice
   * Falls back to preset/custom voice if persona not configured
   */
  async synthesizeWithPersona(text: string): Promise<TTSResult> {
    if (this.currentPersona && this.customVoices[this.currentPersona]) {
      // Use persona voice
      return this.synthesize(text, this.customVoices[this.currentPersona], true);
    }
    // Fall back to default voice
    return this.synthesize(text);
  }
}

