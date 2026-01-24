# AI Text-to-Speech Recommendations for Conductor

This document covers recommended TTS solutions for adding voice features to Conductor.

## Use cases for TTS in Conductor

1. **Voice announcements** - Announce track changes, playlist updates, queue status
2. **Track story narration (Beyond the Beat)** - Podcast-style discussions with two AI hosts about tracks
3. **Command feedback** - Spoken confirmation of user commands
4. **Accessibility** - Full voice-driven interface for visually impaired users
5. **Ambient mode** - Background narration about the music you're listening to

## Beyond the Beat: Podcast-Style Feature

**NEW:** The "Beyond the Beat" feature now generates conversations between two radio hosts or podcasters discussing tracks. This creates a natural, engaging experience similar to listening to a music podcast.

**How it works:**
- AI generates a dialogue script between "Host 1" (male voice - Echo) and "Host 2" (female voice - Shimmer)
- Natural back-and-forth conversation about the song's meaning, production, history, and impact
- Each line is synthesized with the appropriate voice
- Audio is pre-generated and cached before playback starts
- Seamless transitions between speakers create an authentic podcast experience

## Recommended solutions

### 1. Local TTS (Best for privacy and offline use)

#### Piper TTS (Recommended)

**Why:** Fast, high-quality, runs locally, no API needed.

- **Quality:** Very natural voices
- **Speed:** Real-time synthesis on modest hardware
- **Cost:** Free and open source
- **Privacy:** Completely local
- **Languages:** 50+ languages with multiple voices
- **Integration:** Simple command-line interface

**Installation:**
```bash
# Download Piper
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz
tar -xzf piper_amd64.tar.gz

# Download a voice model
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
```

**Usage:**
```bash
echo "Now playing Bohemian Rhapsody by Queen" | ./piper --model en_US-lessac-medium.onnx --output_file output.wav
aplay output.wav
```

**Pros:**
- No API keys needed
- Works offline
- Low latency (100-300ms)
- Multiple voice options
- No ongoing costs

**Cons:**
- Needs local disk space for models (50-100MB per voice)
- CPU usage during synthesis
- Voices not as expressive as premium cloud options

#### eSpeak-NG (Fallback option)

**Why:** Lightweight, available in most Linux repos.

```bash
sudo apt install espeak-ng
echo "Now playing Bohemian Rhapsody" | espeak-ng
```

**Pros:**
- Tiny footprint
- Already installed on many systems
- Extremely fast

**Cons:**
- Robotic voice quality
- Limited expressiveness

### 2. Cloud TTS (Best for quality)

#### OpenAI TTS API (Recommended for cloud)

**Why:** High quality, same provider as your AI, good pricing.

- **Quality:** Very natural, 6 voice options
- **Speed:** 200-500ms latency
- **Cost:** $15 per 1M characters (~16 hours of audio)
- **Integration:** Simple REST API
- **Formats:** MP3, Opus, AAC, FLAC

**Example:**
```typescript
import fs from 'fs';

async function speak(text: string) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    }),
  });
  
  const buffer = await response.arrayBuffer();
  fs.writeFileSync('speech.mp3', Buffer.from(buffer));
  // Play with mpg123 or similar
}
```

**Voices:** alloy, echo, fable, onyx, nova, shimmer

**Pros:**
- High quality and natural
- Fast synthesis
- Consistent with existing OpenAI integration
- Multiple voice personalities

**Cons:**
- Requires API key and internet
- Costs money (though cheap)
- Privacy concerns (audio sent to cloud)

#### ElevenLabs (Premium option)

**Why:** Best quality available, very expressive.

- **Quality:** Most natural TTS on the market
- **Speed:** 300-800ms latency
- **Cost:** Free tier: 10k chars/month, Paid: $5+/month
- **Features:** Voice cloning, emotion control

**Pros:**
- Extremely natural and expressive
- Great for storytelling (Beyond the Beat narration)
- Custom voice creation

**Cons:**
- More expensive
- Higher latency
- Overkill for simple announcements

#### Google Cloud TTS

**Why:** Good balance of quality and features.

- **Quality:** WaveNet voices are very good
- **Speed:** 200-400ms latency
- **Cost:** Free tier: 1M chars/month, then $4-16 per 1M chars
- **Languages:** 220+ voices in 40+ languages

**Pros:**
- Generous free tier
- Excellent language support
- SSML support for fine control

**Cons:**
- Requires Google Cloud setup
- More complex authentication

#### Qwen3 TTS (Alibaba Cloud)

**Why:** High-quality Chinese cloud provider with voice cloning support.

- **Quality:** Natural Chinese and English voices
- **Speed:** Fast cloud synthesis
- **Cost:** Pay per use on Alibaba Cloud DashScope
- **Features:** Voice cloning, custom voices, multiple models
- **Models:** qwen3-tts-flash (fast), qwen3-tts-turbo (balanced)

**Voice cloning:**
Qwen3 supports custom voice cloning through the `qwen3-tts-vc-realtime-2025-11-27` model, allowing you to create personalized AI DJ host voices.

**Configuration:**
```bash
DASHSCOPE_API_KEY=your_api_key_here
QWEN_TTS_VOICE=Cherry  # Cherry, Ethan, etc.
QWEN_TTS_MODEL=qwen3-tts-flash
QWEN_CUSTOM_VOICES='{"Host 1": "custom_voice_id_1", "Host 2": "custom_voice_id_2"}'
```

**Pros:**
- Custom voice cloning
- Multiple voice options
- Fast synthesis
- Good quality

**Cons:**
- Requires Alibaba Cloud account
- China-based service (may have latency for non-Chinese users)
- Documentation primarily in Chinese

#### Bark TTS (Local with emotional sounds)

**Why:** Open-source local TTS with support for non-verbal sounds perfect for AI DJ hosts.

- **Quality:** Natural voices with emotional expression
- **Speed:** Slower than Piper (CPU-dependent)
- **Cost:** Free and open source
- **Features:** Non-verbal sounds like [laughter], [sighs], [music]
- **Privacy:** Completely local

**Special feature - Non-verbal sounds:**
Bark supports special tokens that add human-like sounds:
- `[laughter]`, `[laughs]` - Natural laughter
- `[sighs]` - Sighing sounds
- `[music]` - Musical notes
- `[gasps]` - Gasping sounds
- `[clears throat]` - Throat clearing
- `...` - Hesitation/pause

**Installation:**
```bash
pip install git+https://github.com/suno-ai/bark.git scipy
```

**Configuration:**
```bash
BARK_PYTHON_PATH=/usr/bin/python3
BARK_VOICE=v2/en_speaker_6  # v2/en_speaker_0 through v2/en_speaker_9
BARK_ENABLE_NONVERBAL=true  # Automatically adds natural sounds
```

**Pros:**
- Free and open source
- Runs completely offline
- Non-verbal sounds add personality (perfect for AI DJ)
- Multiple voice presets
- No API key needed

**Cons:**
- Slower synthesis (3-5x slower than Piper)
- Requires more RAM (~2GB for models)
- CPU-intensive
- Takes longer to generate audio

**Perfect for:** AI DJ hosts that need personality and natural conversational sounds.

### 3. Hybrid approach (Recommended)

Use both local and cloud TTS:

```typescript
class TTSManager {
  private useCloud: boolean;
  
  async speak(text: string, priority: 'low' | 'high' = 'low') {
    if (priority === 'low' || !this.useCloud) {
      // Use Piper for simple announcements
      return this.piperSpeak(text);
    } else {
      // Use OpenAI TTS for track stories and longer content
      return this.openaiSpeak(text);
    }
  }
}
```

## Implementation recommendation for Conductor

### Phase 1: Basic announcements with Piper

Start with Piper for track change announcements:

```typescript
class TTSAnnouncer {
  private piperPath = '/path/to/piper';
  private modelPath = '/path/to/model.onnx';
  
  async announceTrack(track: TrackInfo) {
    const text = `Now playing ${track.title} by ${track.artist}`;
    await this.speak(text);
  }
  
  private async speak(text: string) {
    const child = spawn(this.piperPath, [
      '--model', this.modelPath,
      '--output_file', '/tmp/conductor-tts.wav'
    ]);
    
    child.stdin.write(text);
    child.stdin.end();
    
    await new Promise(resolve => child.on('close', resolve));
    
    // Play with aplay, mpg123, or sox
    spawn('aplay', ['/tmp/conductor-tts.wav']);
  }
}
```

### Phase 2: Beyond the Beat narration with OpenAI TTS

For longer content like track stories:

```typescript
async function narrateTrackStory(story: string) {
  if (!process.env.OPENAI_API_KEY) {
    // Fall back to Piper or skip
    return;
  }
  
  // Split into sentences for streaming
  const sentences = story.split(/[.!?]+/).filter(s => s.trim());
  
  for (const sentence of sentences) {
    const audio = await generateSpeech(sentence);
    await playSpeech(audio);
  }
}
```

### Phase 3: Voice commands (optional)

Add speech-to-text for full voice control:

- **Whisper (local):** OpenAI's Whisper for offline STT
- **Whisper API (cloud):** Same model as a service
- **Vosk (local):** Lightweight alternative

## Configuration example

Add to `.env`:

```bash
# TTS Configuration
TTS_ENABLED=true
TTS_PROVIDER=piper  # piper, openai, elevenlabs, google
TTS_ANNOUNCE_TRACKS=true
TTS_NARRATE_STORIES=false

# Piper settings
PIPER_PATH=/usr/local/bin/piper
PIPER_MODEL_PATH=/usr/local/share/piper/voices/en_US-lessac-medium.onnx

# Cloud TTS settings (if using OpenAI)
OPENAI_TTS_VOICE=alloy  # alloy, echo, fable, onyx, nova, shimmer
OPENAI_TTS_SPEED=1.0

# ElevenLabs settings (if using)
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=default
```

## Performance considerations

### CPU usage

- **Piper:** ~5-10% CPU per synthesis
- **Cloud TTS:** Minimal CPU, network bandwidth only

### Latency

- **Local (Piper):** 100-300ms from text to audio file
- **Cloud:** 200-800ms including network round-trip

### Disk space

- **Piper model:** 50-100MB per voice
- **Audio cache:** 1-5MB per minute of synthesized audio

## My recommendation

**Start with Piper for simplicity:**

1. Install Piper and one good English voice
2. Add basic track announcements ("Now playing...")
3. Add command feedback ("Playlist generated")
4. Make it optional via config flag

**Later, add OpenAI TTS for Beyond the Beat:**

1. Use OpenAI TTS for narrating track stories
2. Chunks of 1-2 sentences at a time
3. Cache generated audio per track
4. Falls back to Piper if API unavailable

**Why this approach:**

- Piper works offline and costs nothing
- OpenAI TTS only used for premium features (stories)
- Users without API keys still get basic TTS
- Privacy-conscious users can disable cloud TTS
- Total cost: $0-5/month for most users

## Code structure

```
src/
├── tts/
│   ├── manager.ts       # TTS abstraction layer
│   ├── piper.ts         # Piper integration
│   ├── openai.ts        # OpenAI TTS integration
│   └── types.ts         # Shared types
└── App.tsx              # Add TTS hooks
```

## Next steps

1. Add Piper as optional dependency in setup docs
2. Create TTS configuration section
3. Implement basic announcements first
4. Add "Beyond the Beat" narration as premium feature
5. Document voice options and let users choose

Let me know if you want me to implement any of these options!
