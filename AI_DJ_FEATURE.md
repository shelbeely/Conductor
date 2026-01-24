# AI DJ Feature

The AI DJ feature adds radio-style hosts that pop in between songs to share commentary, just like listening to a real radio station or music podcast.

## How it works

Instead of interrupting every track, the AI hosts appear automatically every 4-5 songs with short (30-60 second) commentary. They discuss:
- Artist backstories
- Song trivia and production details
- Cultural context
- Fun "did you know?" moments

Think of it as a knowledgeable friend sitting next to you on the couch, not a robot demanding the aux cord.

## Key features

**Automatic activation:**
- Activates when you play radio stations or auto-generated playlists
- No manual triggering needed
- Layers commentary on top of your queue without hijacking it

**Smart timing:**
- Speaks every 4-5 songs (not after every track)
- Short interjections (30-60 seconds)
- Doesn't interrupt the music flow

**Co-host format:**
- Two AI hosts (Host 1 and Host 2) talk to each other
- Male voice (Echo) and female voice (Shimmer)
- Conversational back-and-forth, not scripted announcements

**Self-aware and honest:**
- Introduce themselves as AI the first time
- Openly warn they might be wrong sometimes
- "We're AI, so take what we say with a grain of salt"

**Radio DJ energy:**
- Conversational rather than robotic
- Natural reactions ("Oh man, this track!")
- Fun banter between hosts
- One interesting fact per commentary

## Configuration

Enable/disable in your `.env` file:

```bash
# Enable TTS first
TTS_ENABLED=true
TTS_PROVIDER=openai

# AI DJ Feature
AI_DJ_ENABLED=true
AI_DJ_FREQUENCY=4  # Songs between commentary (default: 4)
```

## Commands

Control the AI DJ during playback:

```
enable dj          # Turn on AI DJ hosts
disable dj         # Turn off AI DJ hosts
turn off dj        # Same as disable
activate dj        # Same as enable
```

## When it activates

The AI DJ works best with:
- **Radio stations** - Perfect for continuous listening
- **Auto-generated playlists** - Adds context to AI-curated mixes
- **Long listening sessions** - Commentary every few songs keeps it fresh

It stays quiet during:
- Manual "Beyond the Beat" requests (different feature)
- Single track playback
- When explicitly disabled

## Example commentary

**First time introduction:**
```
Host 1: Hey there! We're your AI co-hosts popping in to share some music knowledge.
Host 2: Yep, we're AI-generated, so we might get things wrong sometimes, but we'll keep it interesting!
Host 1: We'll chime in every few songs with fun facts and trivia.
Host 2: Alright, let's talk about this track...
```

**Regular commentary:**
```
Host 1: Man, "Paranoid Android" by Radiohead - what a journey this song is!
Host 2: Right? It's actually three different songs stitched together. Thom Yorke called it "three different songs that couldn't work on their own."
Host 1: And that title? Straight from the Hitchhiker's Guide to the Galaxy character.
Host 2: Classic 90s alt-rock at its finest.
```

## UI indicators

When AI DJ is active, you'll see:
- 🎙️ Icon in the status bar
- "AI DJ hosts active - they'll pop in every 4-5 songs"
- Subtle notification when commentary starts: "🎙️ AI DJs chiming in..."

## Technical details

### How DJ audio is generated

The AI DJ feature uses a multi-step process to create natural-sounding radio commentary:

**Step 1: Content generation (AI)**
- AI analyzes the current track using metadata from MusicBrainz
- Generates a conversational dialogue script between two hosts
- Each line is tagged with the speaker (Host 1 or Host 2)
- Commentary is kept short (30-60 seconds total)

**Step 2: Text-to-speech conversion (TTS)**
- Each line of dialogue is sent to the configured TTS provider
- Different voices are used for different hosts:
  - Host 1 = Echo (male voice)
  - Host 2 = Shimmer (female voice)
- Audio files are generated in MP3 or WAV format
- Files are cached to avoid regenerating the same commentary

**Step 3: Audio playback**
- Generated audio files are queued for playback
- System audio player (aplay, mpg123, etc.) plays each file sequentially
- Playback happens between songs, not during them
- Seamless transitions create a natural conversation flow

**Step 4: Caching**
- Commentary is cached by track ID to save costs and time
- Cache persists across sessions
- Old cache files are automatically cleaned up after 7 days

### TTS provider options

Conductor supports multiple TTS providers for generating DJ audio. Each has different trade-offs:

#### OpenAI TTS (Recommended for cloud)

**Best for:** High-quality voices, fast synthesis, dialogue format

**Configuration:**
```bash
TTS_PROVIDER=openai
TTS_ENABLED=true
# Uses same OPENAI_API_KEY or OPENROUTER_API_KEY as AI provider
```

**Available voices:**
- `alloy` - Neutral, clear voice
- `echo` - Male voice (used for Host 1)
- `fable` - Expressive, warm voice
- `onyx` - Deep, authoritative voice
- `nova` - Energetic female voice
- `shimmer` - Female voice (used for Host 2)

**Pros:**
- Very natural sounding
- Fast synthesis (200-500ms)
- Multiple voice options perfect for dialogue
- Same API as your AI provider (if using OpenRouter)

**Cons:**
- Requires internet connection
- Costs ~$15 per 1M characters (~16 hours of audio)
- Audio sent to cloud (privacy consideration)

**Pricing:** $15 per 1M characters. For reference:
- 100 DJ commentary sessions ≈ 50,000 characters ≈ $0.75
- Average user might spend $1-3/month on DJ audio

#### Piper TTS (Recommended for local/privacy)

**Best for:** Offline use, privacy, zero cost

**Configuration:**
```bash
TTS_PROVIDER=piper
TTS_ENABLED=true
PIPER_PATH=/usr/local/bin/piper
PIPER_MODEL_PATH=/usr/local/share/piper/voices/en_US-lessac-medium.onnx
```

**Installation:**
```bash
# Download Piper
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz
tar -xzf piper_amd64.tar.gz

# Download voice models
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
```

**Available voices:** 50+ languages and voices on [Piper Voices](https://huggingface.co/rhasspy/piper-voices)

**Pros:**
- Completely free and open source
- No internet required
- Fast synthesis (100-300ms)
- Private - nothing sent to cloud
- Multiple language and voice options

**Cons:**
- Voice quality slightly below premium cloud options
- Requires local disk space (50-100MB per voice model)
- CPU usage during synthesis
- Single voice per model (harder to do true dialogue)

**Note:** Piper uses a single voice per model, so DJ dialogue will use the same voice for both hosts. For true multi-voice dialogue, use OpenAI TTS.

#### ElevenLabs TTS (Premium quality)

**Best for:** Highest quality, most expressive voices

**Configuration:**
```bash
TTS_PROVIDER=elevenlabs
TTS_ENABLED=true
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_VOICE_ID=default
```

**Pros:**
- Best quality TTS available
- Very expressive and natural
- Voice cloning capabilities
- Great for storytelling

**Cons:**
- More expensive than OpenAI
- Higher latency (300-800ms)
- Free tier limited to 10k characters/month
- Requires separate API key

**Pricing:** Free tier 10k chars/month, paid plans start at $5/month

**Status:** ✅ Implemented

#### Google Cloud TTS

**Best for:** Multi-language support, generous free tier

**Configuration:**
```bash
TTS_PROVIDER=google
TTS_ENABLED=true
GOOGLE_API_KEY=your_api_key
GOOGLE_TTS_VOICE=en-US-Neural2-D
GOOGLE_TTS_LANGUAGE=en-US
```

**Available voices:** 220+ voices in 40+ languages

**Pros:**
- Generous free tier (1M chars/month)
- 220+ voices in 40+ languages
- WaveNet and Neural2 voices very high quality
- SSML support for fine control

**Cons:**
- Requires Google Cloud setup
- More complex authentication
- Privacy concerns (Google)

**Pricing:** Free tier 1M chars/month, then $4-16 per 1M chars

**Status:** ✅ Implemented

#### Qwen3 TTS (Alibaba Cloud DashScope)

**Best for:** Multi-language support, Chinese language, voice cloning with custom voices

**Configuration:**
```bash
TTS_PROVIDER=qwen
TTS_ENABLED=true
DASHSCOPE_API_KEY=your_api_key
QWEN_TTS_VOICE=Cherry
QWEN_TTS_MODEL=qwen3-tts-flash
QWEN_TTS_VOICE_CLONE_MODEL=qwen3-tts-vc-realtime-2025-11-27
```

**Voice Cloning Setup:**
```bash
# Map custom cloned voices to DJ hosts
QWEN_CUSTOM_VOICES='{"Host 1": "my_custom_male_voice", "Host 2": "my_custom_female_voice"}'
```

**Available preset voices:** Cherry (female), Ethan (male), and others in 10+ languages

**Voice Cloning Features:**
- **Quick enrollment**: Clone any voice with just 3-20 seconds of audio
- **Multiple custom voices**: Support unlimited custom voice IDs for different speakers
- **High quality**: Preserves speaker characteristics and acoustic environment
- **Multi-language**: Cloned voices work across all 10+ supported languages
- **Voice design**: Create voices by text description (age, gender, tone, character)
- **🆕 Auto-generate multiple DJ voices**: Create multiple host voices from a single audio sample

**How to clone a voice:**
1. Record 10-60 seconds of high-quality audio (WAV, MP3, M4A)
2. Use the `enrollVoice()` API to register the voice with a custom ID
3. Configure `QWEN_CUSTOM_VOICES` to map speakers to custom voice IDs
4. DJ hosts will automatically use your custom voices

**🆕 Auto-generate multiple DJ voices from one sample:**
The easiest way to create multiple DJ hosts with different voices from a single audio clip:

```typescript
// Upload one audio sample and automatically generate multiple DJ voices
const qwen = new QwenTTS(config);
const result = await qwen.generateDJVoicesFromSample(
  '/path/to/single-audio-sample.wav',
  'en',  // language
  2      // number of hosts (default: 2, max: 5)
);

// Returns voices like:
// [
//   { hostName: 'Host 1', voiceId: 'dj_host_1_...', description: 'Energetic male host...' },
//   { hostName: 'Host 2', voiceId: 'dj_host_2_...', description: 'Friendly female host...' }
// ]

// Voices are automatically mapped and ready to use!
```

**How auto-generation works:**
1. **Upload one audio sample** (3-20 seconds of any voice)
2. **AI generates variations** using voice design technology
3. **Multiple distinct voices** created with different characteristics:
   - Host 1: Energetic male with warm conversational style
   - Host 2: Friendly female with upbeat engaging style
   - Host 3: Mature male with smooth professional delivery
   - Host 4: Young female with cheerful dynamic energy
   - Host 5: Casual male with relaxed friendly style
4. **Automatically configured** for DJ dialogue
5. **Ready to use** - no additional configuration needed

**Benefits of auto-generation:**
- ✅ One audio sample creates multiple distinct voices
- ✅ No need to record separate samples for each host
- ✅ Voices are automatically diverse (different genders, tones, styles)
- ✅ Voices maintain quality and naturalness
- ✅ Instant setup for multi-host DJ dialogue

**Example workflow:**
```typescript
// Traditional method: Manual voice enrollment
const qwen = new QwenTTS(config);
await qwen.enrollVoice(
  '/path/to/audio.wav',
  'my_custom_male_voice',
  'en',
  'John Doe voice clone'
);

// List enrolled voices
const voices = await qwen.listCustomVoices();

// Configure for DJ use
qwen.setCustomVoice('Host 1', 'my_custom_male_voice');
qwen.setCustomVoice('Host 2', 'my_custom_female_voice');
```

**Pros:**
- Supports 10+ languages including Chinese, English, Japanese
- High quality neural voices
- Fast synthesis (97ms latency claimed)
- **Advanced voice cloning with 3-20 second samples**
- **Multiple custom voices support for dialogue**
- Voice design via text descriptions
- Open-source models available for local deployment

**Cons:**
- Requires Alibaba Cloud account
- Less known than OpenAI/Google
- Documentation primarily in Chinese
- API availability may vary by region

**Pricing:** Pay-as-you-go pricing, competitive with other cloud providers

**Status:** ✅ Implemented (including voice cloning)

### Choosing a TTS provider

**For most users:** Start with **Piper** (free, private, works offline)

**For best quality dialogue:** Use **OpenAI TTS** (great voices, affordable)

**For maximum privacy:** Use **Piper** with **Ollama** (100% local, zero network)

**For professional use:** Consider **ElevenLabs** (highest quality, most expressive)

**For multi-language support:** Use **Google Cloud TTS** (220+ voices, 40+ languages)

**For Chinese language:** Use **Qwen3 TTS** (native Chinese support, voice cloning)

### Voice assignment

**OpenAI voices for dialogue:**
- Host 1 = Echo (male voice)
- Host 2 = Shimmer (female voice)

**Why these voices?**
- Echo has a warm, conversational male tone perfect for a DJ
- Shimmer has an energetic female voice that complements Echo
- Together they create a natural back-and-forth conversation

**Customization:**
You can change the voices used for each host by modifying the voice assignment in the code, but Echo and Shimmer are the default and recommended pairing for DJ dialogue.

### Audio handling

**Pre-generation and caching:**
- Commentary is generated before playback starts
- Audio files are cached by track ID
- Prevents regeneration for repeated plays
- Reduces API costs and latency

**Queue management:**
- Audio is queued in the background
- Doesn't block music playback
- Each voice segment plays sequentially
- Seamless transitions between speakers

**Fallback behavior:**
- If TTS fails, DJ silently skips that commentary
- Music playback continues uninterrupted
- Error logged but not shown to user (to avoid disruption)

**Audio format:**
- OpenAI generates MP3 files
- Piper generates WAV files
- Format is automatically detected by audio player

### Frequency

**Default behavior:**
- DJ commentary every 4 songs
- Configurable via `AI_DJ_FREQUENCY` environment variable
- Tracks counter resets when commentary plays

**Examples:**
```bash
AI_DJ_FREQUENCY=3   # More frequent (every 3 songs)
AI_DJ_FREQUENCY=6   # Less frequent (every 6 songs)
AI_DJ_FREQUENCY=10  # Rare (every 10 songs)
```

## Comparison: AI DJ vs Beyond the Beat

| Feature | AI DJ | Beyond the Beat |
|---------|-------|-----------------|
| Trigger | Automatic every 4-5 songs | Manual command |
| Length | 30-60 seconds | 2-3 minutes |
| Format | Short DJ commentary | Deep dive discussion |
| Use case | Background listening | Focused learning |
| Frequency | Every 4-5 tracks | On demand per track |

Both features can be used together - AI DJ for casual listening, Beyond the Beat when you want to learn more about a specific track.

## Privacy and performance

**Network usage:**
- Requires AI API calls (OpenRouter, Ollama, or Anthropic)
- TTS synthesis (OpenAI or local Piper)
- MusicBrainz metadata (optional enrichment)

**Local option:**
- Use Ollama for AI (runs locally)
- Use Piper for TTS (runs locally)
- Zero network usage, completely private

**Caching:**
- Commentary is cached per track
- Prevents regeneration for repeated plays
- Reduces API costs and latency

## Troubleshooting

**AI DJ not speaking:**
- Check `TTS_ENABLED=true` in .env
- Verify TTS provider is configured
- Ensure audio player is available (aplay, mpg123, etc.)
- Check `AI_DJ_ENABLED=true`

**Commentary too frequent:**
- Increase `AI_DJ_FREQUENCY` (e.g., 6 or 8)
- Default is 4 songs between commentary

**Want to disable temporarily:**
- Type `disable dj` in the command input
- Re-enable with `enable dj`

**AI DJ interrupting manually:**
- This shouldn't happen - it only triggers on track changes
- If it does, try `disable dj` then `enable dj` to reset

## Future enhancements

Potential improvements being considered:
- Custom host personalities
- User-configurable commentary length
- Learning from your listening habits
- Multiple language support
- Genre-specific hosts
