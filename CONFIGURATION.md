# Configuration Guide

This guide covers every configuration option in Conductor. If you can't find what you're looking for, check the [troubleshooting section](#troubleshooting).

## Configuration System

Conductor uses environment variables for configuration, loaded from:

1. `.env` file in the project root (for development)
2. System environment variables (for production)
3. Default values (hardcoded fallbacks)

Configuration priority (highest to lowest):
```
System environment variables > .env file > defaults
```

Copy `.env.example` to `.env` and modify as needed:
```bash
cp .env.example .env
```

## Environment Variables

### MPD Connection

#### `MPD_HOST`
- **Type:** String
- **Default:** `localhost`
- **Description:** MPD server hostname or IP address
- **Examples:**
  ```bash
  MPD_HOST=localhost        # Local server
  MPD_HOST=192.168.1.100   # Remote server on LAN
  MPD_HOST=music.local     # Local hostname
  ```

#### `MPD_PORT`
- **Type:** Integer
- **Default:** `6600`
- **Description:** MPD server port
- **Examples:**
  ```bash
  MPD_PORT=6600            # Standard port
  MPD_PORT=7700            # Custom port
  ```

### AI Provider Selection

#### `AI_PROVIDER`
- **Type:** String (enum)
- **Options:** `ollama`, `openrouter`, `anthropic`, `copilot`
- **Default:** `ollama`
- **Description:** Which AI provider to use for natural language commands
- **Examples:**
  ```bash
  AI_PROVIDER=ollama       # Local Ollama instance (free, private)
  AI_PROVIDER=openrouter   # OpenRouter API (paid, many models)
  AI_PROVIDER=anthropic    # Direct Anthropic API (paid)
  AI_PROVIDER=copilot      # GitHub Copilot SDK (requires subscription)
  ```

### OpenRouter Configuration

#### `OPENROUTER_API_KEY`
- **Type:** String
- **Required:** Yes (when using OpenRouter)
- **Description:** API key from openrouter.ai
- **How to get:** Sign up at https://openrouter.ai and get your key from the dashboard
- **Example:**
  ```bash
  OPENROUTER_API_KEY=sk-or-v1-1234567890abcdef...
  ```
- **Security:** Never commit this to version control. Keep it in `.env` (which is gitignored)

### Anthropic Configuration

#### `ANTHROPIC_API_KEY`
- **Type:** String
- **Required:** Yes (when using Anthropic)
- **Description:** API key from console.anthropic.com
- **How to get:** Create account at https://console.anthropic.com and generate an API key
- **Example:**
  ```bash
  ANTHROPIC_API_KEY=sk-ant-api03-1234567890abcdef...
  ```
- **Security:** Never commit this to version control

### Ollama Configuration

#### `OLLAMA_BASE_URL`
- **Type:** String (URL)
- **Default:** `http://localhost:11434`
- **Description:** Ollama API endpoint
- **Examples:**
  ```bash
  OLLAMA_BASE_URL=http://localhost:11434      # Default local instance
  OLLAMA_BASE_URL=http://192.168.1.50:11434  # Remote Ollama server
  OLLAMA_BASE_URL=https://ollama.myserver.com # HTTPS endpoint
  ```

### GitHub Copilot SDK Configuration *NEW in v0.2.0*

#### `GITHUB_TOKEN`
- **Type:** String
- **Required:** Yes (when using Copilot provider)
- **Description:** GitHub Personal Access Token with `copilot` scope
- **How to get:**
  1. Go to https://github.com/settings/tokens
  2. Click "Generate new token (classic)"
  3. Select `copilot` scope
  4. Generate and copy the token
- **Example:**
  ```bash
  GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz
  ```
- **Security:** Never commit this to version control. Store in `.env` file
- **Requirements:** Active GitHub Copilot subscription (Individual, Business, or Enterprise)
- **See:** [COPILOT_SDK_SETUP.md](COPILOT_SDK_SETUP.md) for complete setup guide

### Model Selection *NEW in v0.2.0*

#### `AI_MODEL`
- **Type:** String
- **Default:** Provider-dependent (varies by AI provider)
- **Description:** AI model to use for natural language processing
- **Examples:**
  ```bash
  # Ollama models (local)
  AI_MODEL=llama3.2
  AI_MODEL=mistral
  AI_MODEL=codellama
  
  # OpenRouter models (cloud)
  AI_MODEL=anthropic/claude-3.5-sonnet
  AI_MODEL=openai/gpt-4-turbo
  AI_MODEL=google/gemini-pro
  
  # Anthropic models (direct API)
  AI_MODEL=claude-3-opus
  AI_MODEL=claude-3-sonnet
  
  # GitHub Copilot SDK models
  AI_MODEL=gpt-4o
  AI_MODEL=gpt-4o-mini
  AI_MODEL=o1-preview
  AI_MODEL=claude-3.5-sonnet
  ```
- **Notes:**
  - Model names are provider-specific
  - For Ollama, use model names from `ollama list`
  - For OpenRouter, use full model paths from their catalog
  - For Copilot SDK, use supported model IDs (see COPILOT_SDK_SETUP.md)
  - Can be changed at runtime with natural language: "use llama3.2 model"
  - See available models: "show available models"

### Model Selection

#### `AI_MODEL`
- **Type:** String
- **Default:** Provider-specific
  - OpenRouter: `anthropic/claude-3.5-sonnet`
  - Ollama: `llama3.2`
  - Anthropic: `claude-3-5-sonnet-20241022`
- **Description:** Which model to use for command processing
- **Examples:**
  ```bash
  # OpenRouter models
  AI_MODEL=anthropic/claude-3.5-sonnet        # Best quality
  AI_MODEL=anthropic/claude-3-haiku           # Fast and cheap
  AI_MODEL=meta-llama/llama-3.1-70b-instruct  # Good open model
  AI_MODEL=openai/gpt-4o                      # GPT-4 Omni
  
  # Ollama models
  AI_MODEL=llama3.2          # Fast, 3B params
  AI_MODEL=llama3.2:70b      # More capable, needs 40GB+ RAM
  AI_MODEL=mistral           # Alternative, fast
  AI_MODEL=codellama         # Better at structured output
  
  # Anthropic models
  AI_MODEL=claude-3-5-sonnet-20241022  # Latest Sonnet
  AI_MODEL=claude-3-haiku-20240307     # Faster, cheaper
  ```

## MPD Configuration Deep Dive

### Connection Basics

Conductor connects to MPD using TCP. The connection is persistent and automatically reconnects if dropped.

**Reconnection behavior:**
- On disconnect, waits 5 seconds before retrying
- Retries indefinitely until connection succeeds
- User sees "MPD disconnected" in UI during downtime

### Authentication

MPD supports optional password authentication. If your MPD requires a password:

**MPD configuration** (`~/.config/mpd/mpd.conf`):
```conf
password "your_password@read,add,control,admin"
```

**Conductor configuration:**
```bash
# Use password@ prefix in host
MPD_HOST=password@localhost
```

### Timeouts

**Connection timeout:** 5 seconds (hardcoded)
- If MPD doesn't respond within 5 seconds, connection fails and reconnect timer starts

**Command timeout:** 10 seconds (hardcoded)
- Individual commands (play, queue, search) timeout after 10 seconds
- This prevents hanging on unresponsive MPD

**Status polling interval:** 1 second (hardcoded)
- Conductor polls MPD status every second to update UI
- This catches track changes, volume changes, etc.

### Network Modes

**Local connection (most common):**
```bash
MPD_HOST=localhost
MPD_PORT=6600
```

**LAN connection:**
```bash
MPD_HOST=192.168.1.100  # Your server's IP
MPD_PORT=6600
```

Make sure MPD is bound to the right interface:
```conf
# In mpd.conf
bind_to_address "0.0.0.0"  # Listen on all interfaces
# or
bind_to_address "192.168.1.100"  # Specific interface
```

**Unix socket (not currently supported):**
Conductor only supports TCP connections. If you need Unix sockets, open an issue.

## AI Provider Configuration

### OpenRouter (Remote, Paid)

**When to use:**
- You want the best quality AI responses
- You don't mind paying per request (costs vary)
- You need access to many different models
- Your hardware can't run local models

**Setup:**
1. Sign up at https://openrouter.ai
2. Add credits to your account ($5 minimum typically)
3. Generate an API key
4. Set configuration:
   ```bash
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=sk-or-v1-...
   AI_MODEL=anthropic/claude-3.5-sonnet
   ```

**API endpoint:** `https://openrouter.ai/api/v1/chat/completions`

**Request format:** OpenAI-compatible API
- Sends chat messages + tool definitions
- Receives tool calls + text response
- Supports streaming (not used by Conductor)

**Tool support:** Full function calling via OpenAI-compatible tools API

**Error handling:**
- Invalid API key → Error shown in UI
- Rate limits → Error with retry suggestion
- Insufficient credits → Error prompting to add credits

### Ollama (Local, Free)

**When to use:**
- You want privacy (no data leaves your machine)
- You want zero cost
- You have decent hardware (8GB+ RAM for small models, 40GB+ for large)
- You're okay with slightly lower quality than Claude/GPT-4

**Setup:**
1. Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
2. Pull a model: `ollama pull llama3.2`
3. Start server: `ollama serve` (usually auto-started)
4. Set configuration:
   ```bash
   AI_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   AI_MODEL=llama3.2
   ```

**API endpoint:** `http://localhost:11434/api/chat`

**Request format:** Ollama chat API
- Sends chat messages with tool descriptions in system prompt
- Receives text response (not structured function calls)
- Conductor parses JSON tool calls from text

**Tool support:** Partial - relies on model's ability to output JSON
- Works well with instruction-tuned models (llama3.2, mistral)
- May fail with base models
- Tool calls extracted via regex matching

**Error handling:**
- Server not running → Error with instructions to run `ollama serve`
- Model not found → Error suggesting `ollama pull <model>`
- Out of memory → Error visible in Ollama logs, not caught by Conductor

**Performance notes:**
- First request slower (model loads into memory)
- Subsequent requests fast (model stays loaded)
- CPU-only: Very slow, not recommended
- GPU: Fast (RTX 3060+ recommended for 7B models)

### Anthropic (Remote, Paid)

**When to use:**
- You specifically want Claude models
- You already have Anthropic credits
- You want better rate limits than OpenRouter

**Setup:**
1. Sign up at https://console.anthropic.com
2. Add credits
3. Generate API key
4. Set configuration:
   ```bash
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-api03-...
   AI_MODEL=claude-3-5-sonnet-20241022
   ```

**Current status:** Partially implemented
- Basic chat works
- Tool calling may not be fully implemented
- Falls back to OpenRouter if issues occur

**API endpoint:** `https://api.anthropic.com/v1/messages`

## Model Selection Guide

### Which Model Should You Use?

**For best quality (cost: medium-high):**
```bash
AI_PROVIDER=openrouter
AI_MODEL=anthropic/claude-3.5-sonnet
```
- Excellent at understanding music commands
- Reliable tool calling
- Cost: ~$3 per million input tokens, ~$15 per million output tokens

**For best value (cost: low):**
```bash
AI_PROVIDER=openrouter
AI_MODEL=anthropic/claude-3-haiku
```
- Still very good at commands
- Much cheaper than Sonnet
- Cost: ~$0.25 per million input tokens, ~$1.25 per million output tokens

**For free (cost: zero, requires hardware):**
```bash
AI_PROVIDER=ollama
AI_MODEL=llama3.2
```
- Decent at simple commands ("play jazz", "next track")
- May struggle with complex requests
- Requires: 8GB RAM minimum (16GB recommended)

**For complex free (cost: zero, requires good hardware):**
```bash
AI_PROVIDER=ollama
AI_MODEL=llama3.2:70b
```
- Much better understanding
- Near GPT-4 quality on music commands
- Requires: 48GB+ RAM, powerful GPU

### Model Comparison Table

| Model | Provider | Cost/Request | Quality | Speed | Tool Support | Hardware |
|-------|----------|--------------|---------|-------|--------------|----------|
| claude-3.5-sonnet | OpenRouter | ~$0.01 | Excellent | Fast | Excellent | None |
| claude-3-haiku | OpenRouter | ~$0.001 | Very Good | Very Fast | Excellent | None |
| gpt-4o | OpenRouter | ~$0.005 | Excellent | Fast | Excellent | None |
| llama-3.1-70b | OpenRouter | ~$0.001 | Good | Fast | Good | None |
| llama3.2 | Ollama | Free | Good | Medium | Fair | 8GB RAM |
| llama3.2:70b | Ollama | Free | Very Good | Slow | Good | 48GB RAM, GPU |
| mistral | Ollama | Free | Good | Fast | Fair | 8GB RAM |
| codellama | Ollama | Free | Fair | Fast | Good | 8GB RAM |

**Cost estimates** are approximate and based on typical command (~200 input tokens, ~50 output tokens).

### Trade-offs

**OpenRouter advantages:**
- No local setup
- Access to latest models
- Consistent quality
- Fast responses

**OpenRouter disadvantages:**
- Costs money (though often pennies per session)
- Requires internet
- Data sent to third parties

**Ollama advantages:**
- Completely free
- Fully private (data never leaves your machine)
- Works offline
- No rate limits

**Ollama disadvantages:**
- Requires capable hardware
- Takes up disk space (2-40GB per model)
- Quality depends on which model you can run
- First request slower

## Metadata Configuration

### MusicBrainz API

Conductor enriches tracks with metadata from MusicBrainz. This happens automatically when tracks play.

**Endpoint:** `https://musicbrainz.org/ws/2`

**User-Agent:** `Conductor/0.1.0 (https://github.com/shelbeely/Conductor)`
- MusicBrainz requires a user-agent for API access
- This is hardcoded and doesn't need configuration

### Rate Limiting

**MusicBrainz policy:** Maximum 1 request per second
- Conductor enforces this automatically
- No configuration needed

**Implementation:**
- Tracks time between requests
- Waits if less than 1 second since last request
- Transparent to user (slight delay on track changes)

**Effect on UX:**
- If you skip through 10 tracks quickly, metadata appears gradually over 10 seconds
- Queue metadata loads one item per second
- No way to disable this (it's MusicBrainz policy)

### Caching

**Cache type:** In-memory Map
- Keyed by `artist:Artist Name` or `release:Album Title:Artist`
- Lives for duration of Conductor session
- Cleared when app exits

**Cache size:** Unlimited
- No eviction policy
- Assumes typical music libraries won't cause memory issues
- For 1000 cached items: ~5-10MB memory usage

**Cache hits:**
- If the same artist/album is requested again, returns instantly
- No API call made

**Configuring cache:**
Currently not configurable. To disable caching, you'd need to modify the code.

### Cover Art

**Cover Art Archive:** `https://coverartarchive.org`
- Provides album art URLs
- No rate limit (separate from MusicBrainz)
- Automatically queried after album metadata fetched

**Fallback behavior:**
1. Try to fetch cover art URL from Cover Art Archive
2. If found, URL stored in track metadata
3. Album art manager downloads image
4. If any step fails, falls back to ASCII art or no art

## Album Art Configuration

### Überzug++ Setup

**Check availability:**
Conductor automatically detects if Überzug++ is installed on startup using `command -v ueberzug`.

**Installation:**
```bash
# Arch Linux
yay -S ueberzug++

# From source
git clone https://github.com/jstkdng/ueberzugpp.git
cd ueberzugpp
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
cmake --build .
sudo cmake --install .
```

**Requirements:**
- X11 or Wayland display server
- Compatible terminal emulator (kitty, alacritty, wezterm, urxvt)
- Won't work over SSH unless X11 forwarding enabled

### Display Configuration

**Position and size:** Hardcoded in UI components
- Position: Right side of terminal
- Size: Calculated based on terminal dimensions
- Not configurable without code changes

**Image caching:**
- Downloaded images stored in system temp directory (`/tmp` on Linux)
- Filenames: `conductor-cover-<timestamp>.jpg`
- Cleaned up on Conductor exit
- May persist if Conductor crashes (manual cleanup needed)

### Fallback Options

**ASCII art generation:**
If Überzug++ is unavailable or fails:
1. Conductor attempts to generate ASCII art from album cover
2. Uses character density to represent image brightness
3. Displayed in terminal using standard text

**No art mode:**
If ASCII generation fails, album art section shows track text only.

**Forcing fallback:**
No way to force ASCII art if Überzug++ is available. To disable Überzug++, uninstall it or modify the code.

## Text-to-Speech (TTS) Configuration

Conductor supports text-to-speech for the AI DJ feature and "Beyond the Beat" track stories. Multiple TTS providers are available, each with different trade-offs.

### TTS Provider Selection

#### `TTS_ENABLED`
- **Type:** Boolean
- **Default:** `false`
- **Description:** Enable or disable text-to-speech features
- **Examples:**
  ```bash
  TTS_ENABLED=true   # Enable TTS
  TTS_ENABLED=false  # Disable TTS
  ```

#### `TTS_PROVIDER`
- **Type:** String (enum)
- **Options:** `openai`, `piper`, `elevenlabs`, `google`
- **Default:** `openai`
- **Description:** Which TTS provider to use for audio generation
- **Examples:**
  ```bash
  TTS_PROVIDER=openai      # Cloud TTS with high quality voices
  TTS_PROVIDER=piper       # Local TTS, private and free
  TTS_PROVIDER=elevenlabs  # Premium cloud TTS (planned)
  TTS_PROVIDER=google      # Google Cloud TTS (planned)
  ```

### OpenAI TTS Configuration

**Best for:** High-quality dialogue with multiple voices, cloud-based

#### `OPENAI_API_KEY`
- **Type:** String
- **Required:** Yes (when using OpenAI TTS)
- **Description:** OpenAI API key for TTS synthesis
- **Notes:** If using OpenRouter as AI provider, it may use the same `OPENROUTER_API_KEY`
- **Example:**
  ```bash
  OPENAI_API_KEY=sk-...
  ```

#### `OPENAI_TTS_VOICE`
- **Type:** String (enum)
- **Options:** `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
- **Default:** `alloy`
- **Description:** Voice to use for single-voice TTS
- **Voice characteristics:**
  - `alloy` - Neutral, versatile voice
  - `echo` - Warm male voice (used for DJ Host 1)
  - `fable` - British accent, expressive
  - `onyx` - Deep, authoritative male voice
  - `nova` - Energetic female voice
  - `shimmer` - Clear female voice (used for DJ Host 2)
- **Example:**
  ```bash
  OPENAI_TTS_VOICE=echo    # Male DJ voice
  OPENAI_TTS_VOICE=shimmer # Female DJ voice
  ```

#### `OPENAI_TTS_SPEED`
- **Type:** Float
- **Range:** 0.25 to 4.0
- **Default:** 1.0
- **Description:** Speech rate multiplier
- **Examples:**
  ```bash
  OPENAI_TTS_SPEED=1.0   # Normal speed
  OPENAI_TTS_SPEED=1.2   # 20% faster (more energetic)
  OPENAI_TTS_SPEED=0.9   # 10% slower (more deliberate)
  ```

**OpenAI TTS details:**
- **Quality:** Very natural and expressive
- **Latency:** 200-500ms for synthesis
- **Format:** MP3 audio files
- **Cost:** $15 per 1 million characters (~16 hours of audio)
  - 100 DJ commentaries ≈ 50,000 chars ≈ $0.75
  - Average usage: $1-3/month
- **Multi-voice:** Yes - perfect for DJ dialogue with Echo and Shimmer
- **API endpoint:** `https://api.openai.com/v1/audio/speech`

### Piper TTS Configuration

**Best for:** Offline use, privacy, zero cost

#### `PIPER_PATH`
- **Type:** String (path)
- **Default:** `/usr/local/bin/piper` or `piper` (from PATH)
- **Description:** Full path to Piper executable
- **Examples:**
  ```bash
  PIPER_PATH=/usr/local/bin/piper
  PIPER_PATH=/home/user/.local/bin/piper
  PIPER_PATH=piper  # Use from PATH
  ```

#### `PIPER_MODEL_PATH`
- **Type:** String (path)
- **Required:** Yes (when using Piper)
- **Description:** Full path to Piper voice model (.onnx file)
- **Examples:**
  ```bash
  PIPER_MODEL_PATH=/usr/local/share/piper/voices/en_US-lessac-medium.onnx
  PIPER_MODEL_PATH=/home/user/.local/share/piper/en_US-amy-low.onnx
  ```

**Piper installation:**
```bash
# Download Piper binary
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz
tar -xzf piper_amd64.tar.gz
sudo mv piper /usr/local/bin/

# Download voice model (example: US English, medium quality)
mkdir -p ~/.local/share/piper/voices
cd ~/.local/share/piper/voices
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
```

**Available Piper voices:**
- Browse at: https://huggingface.co/rhasspy/piper-voices
- 50+ languages available
- Multiple quality levels (low, medium, high)
- Model sizes: 5-100MB depending on quality

**Piper TTS details:**
- **Quality:** Natural but slightly synthetic
- **Latency:** 100-300ms for synthesis
- **Format:** WAV audio files
- **Cost:** Free and open source
- **Multi-voice:** No - uses single voice per model (DJ dialogue uses same voice for both hosts)
- **Offline:** Yes - fully local, no network needed
- **Privacy:** Complete - nothing sent to cloud

### ElevenLabs TTS Configuration

**Best for:** Premium quality, most expressive voices, voice cloning

#### `ELEVENLABS_API_KEY`
- **Type:** String
- **Required:** Yes (when using ElevenLabs)
- **Description:** ElevenLabs API key for TTS synthesis
- **How to get:** Sign up at https://elevenlabs.io and get your key from the dashboard
- **Example:**
  ```bash
  ELEVENLABS_API_KEY=your_api_key_here
  ```

#### `ELEVENLABS_VOICE_ID`
- **Type:** String
- **Default:** `pNInz6obpgDQGcFmaJgB` (Adam voice)
- **Description:** Voice ID to use for TTS
- **Popular voices:**
  - `pNInz6obpgDQGcFmaJgB` - Adam (male)
  - `21m00Tcm4TlvDq8ikWAM` - Rachel (female)
  - `EXAVITQu4vr4xnSDxMaL` - Bella (female)
  - `ErXwobaYiN019PkySvjV` - Antoni (male)
- **Example:**
  ```bash
  ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Rachel voice
  ```

**ElevenLabs TTS details:**
- **Quality:** Excellent - most natural and expressive
- **Latency:** 300-800ms for synthesis
- **Format:** MP3 audio files
- **Cost:** Free tier 10k chars/month, paid plans from $5/month
- **Multi-voice:** Yes - perfect for DJ dialogue (Adam + Rachel)
- **Offline:** No - requires internet connection
- **Privacy:** Cloud-based (audio sent to ElevenLabs)
- **API endpoint:** `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`

### Google Cloud TTS Configuration

**Best for:** Multi-language support, generous free tier, high quality

#### `GOOGLE_API_KEY`
- **Type:** String
- **Required:** Yes (when using Google Cloud TTS)
- **Description:** Google Cloud API key with Text-to-Speech API enabled
- **How to get:** 
  1. Create project at https://console.cloud.google.com
  2. Enable Text-to-Speech API
  3. Create API key
- **Example:**
  ```bash
  GOOGLE_API_KEY=your_api_key_here
  ```

#### `GOOGLE_TTS_VOICE`
- **Type:** String
- **Default:** `en-US-Neural2-D`
- **Description:** Voice name to use for TTS
- **Popular voices:**
  - `en-US-Neural2-D` - Male voice (used for DJ Host 1)
  - `en-US-Neural2-F` - Female voice (used for DJ Host 2)
  - `en-US-Wavenet-A` - Female voice (WaveNet quality)
  - `en-US-Wavenet-D` - Male voice (WaveNet quality)
- **Example:**
  ```bash
  GOOGLE_TTS_VOICE=en-US-Neural2-D
  ```

#### `GOOGLE_TTS_LANGUAGE`
- **Type:** String
- **Default:** `en-US`
- **Description:** Language code for TTS
- **Examples:**
  ```bash
  GOOGLE_TTS_LANGUAGE=en-US  # US English
  GOOGLE_TTS_LANGUAGE=en-GB  # British English
  GOOGLE_TTS_LANGUAGE=es-ES  # Spanish
  GOOGLE_TTS_LANGUAGE=ja-JP  # Japanese
  ```

**Google Cloud TTS details:**
- **Quality:** Very high - Neural2 and WaveNet voices
- **Latency:** 200-400ms for synthesis
- **Format:** MP3 audio files (base64 encoded in API response)
- **Cost:** Free tier 1M chars/month, then $4-16 per 1M chars
- **Multi-voice:** Yes - 220+ voices in 40+ languages
- **Offline:** No - requires internet connection
- **Privacy:** Cloud-based (audio sent to Google)
- **API endpoint:** `https://texttospeech.googleapis.com/v1/text:synthesize`

### Qwen3 TTS Configuration

**Best for:** Chinese language, multi-language support, voice cloning, open-source option

#### `DASHSCOPE_API_KEY`
- **Type:** String
- **Required:** Yes (when using Qwen3 TTS)
- **Description:** Alibaba Cloud DashScope API key for Qwen3 TTS
- **How to get:** Sign up at https://dashscope.aliyun.com
- **Example:**
  ```bash
  DASHSCOPE_API_KEY=your_api_key_here
  ```

#### `QWEN_TTS_VOICE`
- **Type:** String
- **Default:** `Cherry`
- **Description:** Voice name to use for TTS
- **Available voices:**
  - `Cherry` - Female voice (used for DJ Host 2)
  - `Ethan` - Male voice (used for DJ Host 1)
  - And others depending on language
- **Example:**
  ```bash
  QWEN_TTS_VOICE=Cherry
  ```

#### `QWEN_TTS_MODEL`
- **Type:** String
- **Default:** `qwen3-tts-flash`
- **Description:** Model to use for TTS synthesis
- **Options:**
  - `qwen3-tts-flash` - Fast synthesis, good quality
  - `qwen3-tts-turbo` - Faster synthesis, balanced quality
- **Example:**
  ```bash
  QWEN_TTS_MODEL=qwen3-tts-flash
  ```

#### `QWEN_TTS_VOICE_CLONE_MODEL`
- **Type:** String
- **Default:** `qwen3-tts-vc-realtime-2025-11-27`
- **Description:** Model to use for voice cloning synthesis
- **Example:**
  ```bash
  QWEN_TTS_VOICE_CLONE_MODEL=qwen3-tts-vc-realtime-2025-11-27
  ```

#### `QWEN_CUSTOM_VOICES`
- **Type:** JSON String (Record<string, string>)
- **Default:** `{}`
- **Description:** Map speaker names to custom voice IDs for cloned voices
- **Format:** JSON object mapping speaker names to enrolled custom voice IDs
- **Example:**
  ```bash
  # Map DJ hosts to custom cloned voices
  QWEN_CUSTOM_VOICES='{"Host 1": "my_male_voice_id", "Host 2": "my_female_voice_id"}'
  
  # Or use custom speaker names
  QWEN_CUSTOM_VOICES='{"John": "johns_voice", "Sarah": "sarahs_voice"}'
  ```

**Voice Cloning Workflow:**

**Method 1: Auto-generate multiple DJ voices from one sample (Recommended)**

The easiest way to set up multiple DJ hosts:

1. **Upload one audio sample:**
   - Prepare a single audio file (3-20 seconds, WAV/MP3/M4A, minimum 24kHz)
   - Can be any voice - your own, a friend's, or any reference audio

2. **Generate multiple voices automatically:**
   ```typescript
   const qwen = new QwenTTS(config);
   const result = await qwen.generateDJVoicesFromSample(
     '/path/to/audio.wav',
     'en',  // language
     2      // number of hosts (2-5)
   );
   // Returns: [
   //   { hostName: 'Host 1', voiceId: '...', description: 'Energetic male...' },
   //   { hostName: 'Host 2', voiceId: '...', description: 'Friendly female...' }
   // ]
   ```

3. **Voices are automatically configured:**
   - Each host gets a unique voice with different characteristics
   - Host 1: Energetic male with warm conversational style
   - Host 2: Friendly female with upbeat engaging style
   - Host 3-5: Additional variations if requested
   - All voices are automatically mapped and ready to use

4. **Start using immediately:**
   - No additional configuration needed
   - Voices are already set up for DJ dialogue
   - Supports 2-5 hosts from one audio sample

**Method 2: Manual voice enrollment (Advanced)**

For full control over each voice:

1. **Enroll a custom voice:**
   - Prepare audio sample (10-60 seconds, WAV/MP3/M4A, minimum 24kHz)
   - Call `enrollVoice()` API with audio file path and custom voice ID
   - Voice is registered with Alibaba Cloud DashScope

2. **Configure custom voices:**
   - Set `QWEN_CUSTOM_VOICES` environment variable with speaker-to-voice mapping
   - Or use `setCustomVoice()` method programmatically

3. **Use in dialogue:**
   - When synthesizing dialogue, Qwen TTS checks for custom voices first
   - Falls back to preset voices (Cherry, Ethan) if no custom voice configured
   - Supports unlimited custom voices for different speakers

**Voice Cloning API Methods:**
- `enrollVoice(audioPath, voiceId, language, description)` - Register a new voice
- `generateDJVoicesFromSample(audioPath, language, numHosts)` - 🆕 Auto-generate multiple DJ voices from one sample
- `listCustomVoices()` - Get list of enrolled voices
- `setCustomVoice(speaker, voiceId)` - Map speaker to custom voice
- `getCustomVoice(speaker)` - Get custom voice for speaker
- `getCustomVoices()` - Get all custom voice mappings

**Qwen3 TTS details:**
- **Quality:** High quality neural voices
- **Latency:** Very fast (97ms claimed)
- **Format:** MP3 audio files (downloaded from URL)
- **Cost:** Pay-as-you-go pricing (competitive)
- **Multi-voice:** Yes - multiple voices per language + unlimited custom voices
- **Languages:** 10+ including Chinese, English, Japanese, Korean, etc.
- **Offline:** Cloud by default, but open-source models available for local deployment
- **Privacy:** Cloud-based (audio sent to Alibaba Cloud)
- **Voice cloning:** ✅ Full support with 3-20 second audio samples
- **Voice design:** Create voices via text descriptions
- **🆕 Auto-generation:** Create multiple DJ voices from single audio sample
- **API endpoint:** `https://dashscope.aliyuncs.com/api/v1/services/audio/tts/synthesis`
- **Voice enrollment endpoint:** `https://dashscope.aliyuncs.com/api/v1/services/audio/voice-enrollment`
- **Voice design endpoint:** `https://dashscope.aliyuncs.com/api/v1/services/audio/voice-design`
- **Open source:** Models available at https://github.com/QwenLM/Qwen3-TTS

### Audio Playback Configuration

#### `TTS_AUDIO_PLAYER`
- **Type:** String (enum)
- **Options:** `aplay`, `mpg123`, `ffplay`, `sox`
- **Default:** Auto-detected
- **Description:** Audio player to use for TTS playback
- **Examples:**
  ```bash
  TTS_AUDIO_PLAYER=aplay   # ALSA player (WAV files)
  TTS_AUDIO_PLAYER=mpg123  # MP3 player
  TTS_AUDIO_PLAYER=ffplay  # FFmpeg player (supports all formats)
  TTS_AUDIO_PLAYER=sox     # SoX player
  ```

**Auto-detection:**
If not specified, Conductor tries players in this order:
1. `aplay` (most common on Linux)
2. `mpg123` (good for MP3 files)
3. `ffplay` (most versatile)
4. `sox` (fallback)

**Installing audio players:**
```bash
# Ubuntu/Debian
sudo apt install alsa-utils mpg123 ffmpeg sox

# Fedora
sudo dnf install alsa-utils mpg123 ffmpeg sox

# Arch
sudo pacman -S alsa-utils mpg123 ffmpeg sox
```

#### `TTS_CACHE_DIR`
- **Type:** String (path)
- **Default:** `/tmp/conductor-tts`
- **Description:** Directory for caching generated TTS audio
- **Examples:**
  ```bash
  TTS_CACHE_DIR=/tmp/conductor-tts
  TTS_CACHE_DIR=/var/cache/conductor/tts
  TTS_CACHE_DIR=/home/user/.cache/conductor/tts
  ```

**Cache behavior:**
- Audio files are cached by track ID and commentary type
- Cache persists across sessions
- Old files (>7 days) are automatically cleaned up
- Reduces API costs by reusing previously generated audio
- Cache directory is created automatically if missing

### AI DJ Configuration

The AI DJ feature uses TTS to create radio-style commentary between songs.

#### `AI_DJ_ENABLED`
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable AI DJ hosts that pop in between songs
- **Requires:** `TTS_ENABLED=true`
- **Examples:**
  ```bash
  AI_DJ_ENABLED=true   # DJ hosts active
  AI_DJ_ENABLED=false  # No DJ commentary
  ```

#### `AI_DJ_FREQUENCY`
- **Type:** Integer
- **Default:** `4`
- **Description:** Number of songs between DJ commentary
- **Range:** 1-100 (practical range: 3-10)
- **Examples:**
  ```bash
  AI_DJ_FREQUENCY=3   # More frequent (every 3 songs)
  AI_DJ_FREQUENCY=4   # Default (every 4 songs)
  AI_DJ_FREQUENCY=6   # Less frequent (every 6 songs)
  AI_DJ_FREQUENCY=10  # Rare (every 10 songs)
  ```

### Complete TTS Examples

#### Example 1: OpenAI TTS (Cloud, High Quality)
```bash
# Enable TTS with OpenAI
TTS_ENABLED=true
TTS_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Use default voices (echo for Host 1, shimmer for Host 2)
OPENAI_TTS_VOICE=alloy
OPENAI_TTS_SPEED=1.0

# Enable AI DJ
AI_DJ_ENABLED=true
AI_DJ_FREQUENCY=4

# Audio playback
TTS_AUDIO_PLAYER=mpg123
TTS_CACHE_DIR=/tmp/conductor-tts
```

#### Example 2: Piper TTS (Local, Private, Free)
```bash
# Enable TTS with Piper
TTS_ENABLED=true
TTS_PROVIDER=piper
PIPER_PATH=/usr/local/bin/piper
PIPER_MODEL_PATH=/usr/local/share/piper/voices/en_US-lessac-medium.onnx

# Enable AI DJ
AI_DJ_ENABLED=true
AI_DJ_FREQUENCY=4

# Audio playback
TTS_AUDIO_PLAYER=aplay
TTS_CACHE_DIR=/home/user/.cache/conductor/tts
```

#### Example 3: ElevenLabs TTS (Premium Cloud Quality)
```bash
# Enable TTS with ElevenLabs
TTS_ENABLED=true
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB  # Adam voice

# Enable AI DJ
AI_DJ_ENABLED=true
AI_DJ_FREQUENCY=4

# Audio playback
TTS_AUDIO_PLAYER=mpg123
TTS_CACHE_DIR=/tmp/conductor-tts
```

#### Example 4: Google Cloud TTS (Multi-language)
```bash
# Enable TTS with Google Cloud
TTS_ENABLED=true
TTS_PROVIDER=google
GOOGLE_API_KEY=your_api_key_here
GOOGLE_TTS_VOICE=en-US-Neural2-D
GOOGLE_TTS_LANGUAGE=en-US

# Enable AI DJ
AI_DJ_ENABLED=true
AI_DJ_FREQUENCY=4

# Audio playback
TTS_AUDIO_PLAYER=mpg123
TTS_CACHE_DIR=/tmp/conductor-tts
```

#### Example 5: Qwen3 TTS (Chinese + English)
```bash
# Enable TTS with Qwen3
TTS_ENABLED=true
TTS_PROVIDER=qwen
DASHSCOPE_API_KEY=your_api_key_here
QWEN_TTS_VOICE=Cherry
QWEN_TTS_MODEL=qwen3-tts-flash

# Enable AI DJ
AI_DJ_ENABLED=true
AI_DJ_FREQUENCY=4

# Audio playback
TTS_AUDIO_PLAYER=mpg123
TTS_CACHE_DIR=/tmp/conductor-tts
```

#### Example 6: Qwen3 TTS with Voice Cloning
```bash
# Enable TTS with Qwen3 and custom cloned voices
TTS_ENABLED=true
TTS_PROVIDER=qwen
DASHSCOPE_API_KEY=your_api_key_here

# Configure voice cloning model
QWEN_TTS_VOICE_CLONE_MODEL=qwen3-tts-vc-realtime-2025-11-27

# Map DJ hosts to custom cloned voices
# After enrolling voices via API, set the custom voice IDs here
QWEN_CUSTOM_VOICES='{"Host 1": "johns_voice_id", "Host 2": "sarahs_voice_id"}'

# Fallback to preset voice if custom voice not available
QWEN_TTS_VOICE=Cherry
QWEN_TTS_MODEL=qwen3-tts-flash

# Enable AI DJ
AI_DJ_ENABLED=true
AI_DJ_FREQUENCY=4

# Audio playback
TTS_AUDIO_PLAYER=mpg123
TTS_CACHE_DIR=/tmp/conductor-tts
```

#### Example 7: Qwen3 TTS with Auto-Generated DJ Voices (Easiest Setup)
```bash
# Enable TTS with Qwen3 auto-generation
TTS_ENABLED=true
TTS_PROVIDER=qwen
DASHSCOPE_API_KEY=your_api_key_here

# Voice cloning/design models
QWEN_TTS_VOICE_CLONE_MODEL=qwen3-tts-vc-realtime-2025-11-27
QWEN_TTS_MODEL=qwen3-tts-flash

# Enable AI DJ
AI_DJ_ENABLED=true
AI_DJ_FREQUENCY=4

# Audio playback
TTS_AUDIO_PLAYER=mpg123
TTS_CACHE_DIR=/tmp/conductor-tts

# To auto-generate multiple DJ voices, call via code:
# const qwen = new QwenTTS(config);
# await qwen.generateDJVoicesFromSample('/path/to/audio.wav', 'en', 2);
# Voices are automatically configured - no QWEN_CUSTOM_VOICES needed!
```

#### Example 8: TTS Disabled
```bash
# Disable all TTS features
TTS_ENABLED=false

# AI DJ will be automatically disabled
AI_DJ_ENABLED=false
```

### TTS Provider Comparison

| Feature | OpenAI TTS | Piper TTS | ElevenLabs | Google TTS | Qwen3 TTS |
|---------|-----------|-----------|------------|-----------|-----------|
| **Quality** | Very high | Good | Excellent | Very high | High |
| **Cost** | $15/1M chars | Free | $5+/mo | Free tier 1M | Pay-as-you-go |
| **Latency** | 200-500ms | 100-300ms | 300-800ms | 200-400ms | ~100ms |
| **Offline** | No | Yes | No | No | No (models available) |
| **Multi-voice** | Yes (6 voices) | No (1 per model) | Yes | Yes (220+) | Yes (unlimited custom) |
| **Setup** | API key only | Install + models | API key | Google Cloud | DashScope API |
| **Privacy** | Cloud | Local | Cloud | Cloud | Cloud |
| **Languages** | English focus | 50+ | English focus | 40+ | 10+ (Chinese focus) |
| **Voice cloning** | No | No | Yes | No | **Yes (3-20s samples)** |
| **Custom voices** | No | No | Limited | No | **Unlimited** |
| **Voice design** | No | No | No | No | **Yes (text-based)** |
| **Status** | ✅ Implemented | ✅ Implemented | ✅ Implemented | ✅ Implemented | ✅ Implemented |

### TTS Troubleshooting

**TTS not working:**
1. Check `TTS_ENABLED=true` in configuration
2. Verify TTS provider is correctly configured
3. Test audio player: `aplay /usr/share/sounds/alsa/Front_Center.wav`
4. Check logs for TTS errors

**No audio output:**
1. Verify audio player is installed: `which aplay mpg123 ffplay`
2. Test system audio works
3. Check volume levels
4. Try different `TTS_AUDIO_PLAYER` option

**Piper TTS fails:**
1. Verify Piper is installed: `which piper` or check `PIPER_PATH`
2. Verify model exists: `ls -lh $PIPER_MODEL_PATH`
3. Test Piper directly: `echo "test" | piper --model <model_path> --output_file test.wav`
4. Check model JSON file exists alongside .onnx file

**OpenAI TTS fails:**
1. Verify API key is correct
2. Check internet connection
3. Verify API key has credits (check OpenAI dashboard)
4. Check for rate limiting errors in logs

**AI DJ not speaking:**
1. Ensure `TTS_ENABLED=true` and `AI_DJ_ENABLED=true`
2. Check TTS provider is working
3. Wait for 4 songs to play (default frequency)
4. Check cache directory exists and is writable

**For more TTS information, see:**
- [AI_DJ_FEATURE.md](AI_DJ_FEATURE.md) - Complete AI DJ documentation
- [TTS_RECOMMENDATIONS.md](TTS_RECOMMENDATIONS.md) - Detailed TTS provider guide

## UI Configuration

Currently, UI is not configurable through environment variables.

**Fixed settings:**
- Colors: Defined in UI components
- Layout: Responsive to terminal size
- Update rate: 1 second (matches MPD polling)
- Font: Terminal default

**Future configuration ideas:**
- Theme selection
- Color customization
- Layout variants
- Disable specific UI elements

If you need UI customization, modify the React components in `src/ui/`.

## Logging and Debugging

### Console Logging

**Default behavior:**
- Errors logged to stderr
- Info messages for connection events
- Verbose logs disabled

**Enable verbose logging:**
Currently not configurable. To add debug logging:
```typescript
// In any module
console.log('Debug info:', data);
```

**Where logs appear:**
- stdout: Normal output (UI rendering)
- stderr: Errors and warnings
- Both visible in terminal unless redirected

### Debug Mode

**No built-in debug mode** currently. To debug:

1. **Run with Node inspector:**
   ```bash
   node --inspect dist/index.js
   ```

2. **Enable TypeScript source maps:**
   Already enabled in `tsconfig.json`

3. **Check MPD logs:**
   ```bash
   tail -f ~/.config/mpd/log
   ```

4. **Check Ollama logs:**
   ```bash
   # If using systemd
   journalctl -u ollama -f
   
   # If running manually
   ollama serve  # Logs to stdout
   ```

### Error Messages

**User-facing errors:**
- Displayed at top of UI in red
- Auto-clear on next successful command
- Include actionable information

**Error categories:**
- MPD connection errors: "Failed to connect to MPD at localhost:6600"
- AI errors: "AI provider error: [details]"
- Metadata errors: Silent (metadata enrichment is optional)
- Album art errors: Silent (falls back automatically)

## Performance Tuning

### MPD Polling Rate

**Current:** 1 second (hardcoded in `src/App.tsx`)

**Effect of faster polling:**
- More responsive UI updates
- Higher CPU usage
- More network traffic (if MPD is remote)

**Effect of slower polling:**
- Less responsive (track changes delayed)
- Lower CPU usage
- Less network traffic

**To change:** Edit `src/App.tsx`:
```typescript
// In updatePlayerState interval
}, 1000); // Change this value (in milliseconds)
```

### Metadata Fetching

**Current behavior:** Sequential fetching
- Artist metadata fetched first
- Then album metadata
- Then cover art
- Each waits for previous to complete

**Optimization ideas:**
- Parallel fetching (may violate rate limits)
- Prefetch queue metadata in background
- Persistent cache (database instead of memory)

### UI Re-rendering

**React optimizations in place:**
- Components memoized with `React.memo()`
- Expensive computations wrapped in `useMemo()`
- Event handlers wrapped in `useCallback()`
- Follows [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)

**If UI feels sluggish:**
- Check terminal emulator performance (some are slow at rendering)
- Reduce polling rate
- Disable visualizer (if implemented)

### Memory Usage

**Expected memory usage:**
- Base: ~50-100MB
- With metadata cache (100 items): +5MB
- With Ollama model loaded: +2-8GB (in Ollama process, not Conductor)
- With album art: +10-50MB (temporary image storage)

**If memory usage is high:**
- Restart Conductor to clear cache
- Check for leaked temp files in `/tmp`
- Use smaller Ollama models

## Network Configuration

### Proxy Support

**HTTP/HTTPS proxy:**
Not explicitly supported, but may work through environment variables:
```bash
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1
```

This affects:
- OpenRouter API requests
- Anthropic API requests
- MusicBrainz API requests
- Cover Art Archive requests

Does NOT affect:
- MPD connections (TCP, not HTTP)
- Ollama connections (local HTTP, typically excluded)

**SOCKS proxy:**
Not supported directly. Use a local HTTP proxy that connects via SOCKS (e.g., privoxy).

### Timeouts

**HTTP request timeouts:**
- OpenRouter API: 30 seconds (default Node.js fetch)
- Anthropic API: 30 seconds
- MusicBrainz: 30 seconds
- Cover Art Archive: 30 seconds

**To change:** No configuration currently. Would require code changes.

### Retry Logic

**MPD connection:** Retries indefinitely every 5 seconds
**API requests:** No automatic retry
- OpenRouter failures: Single attempt, error shown
- Anthropic failures: Single attempt, error shown
- MusicBrainz failures: Single attempt, metadata skipped

**Adding retry logic:**
Would require implementing exponential backoff in provider classes.

## Security Configuration

### API Key Protection

**Don't:**
- ❌ Commit `.env` to version control
- ❌ Share API keys in screenshots or logs
- ❌ Use your main API key (create project-specific keys)
- ❌ Set API keys in shell history (source from file)

**Do:**
- ✅ Keep API keys in `.env` file (gitignored by default)
- ✅ Use environment variables in production
- ✅ Rotate keys periodically
- ✅ Use read-only keys where possible
- ✅ Monitor API usage for suspicious activity

**Checking if key is exposed:**
```bash
# Make sure .env is gitignored
git check-ignore .env  # Should output: .env

# Check for keys in commit history
git log --all --full-history --source --all -- '*env*'
```

**If key is exposed:**
1. Revoke key immediately in provider dashboard
2. Generate new key
3. Update `.env` file
4. If committed to GitHub, consider the key permanently compromised

### File Permissions

**Configuration file:**
```bash
chmod 600 .env  # Only you can read/write
```

**Temporary files:**
Album art images in `/tmp` are world-readable by default. If this is a concern:
```bash
# Set restrictive umask before running Conductor
umask 077
```

### Network Security

**MPD authentication:**
If your MPD is exposed to a network, use authentication:
```conf
# In mpd.conf
password "strongpassword@read,add,control,admin"
```

**MPD over network:**
If accessing MPD over untrusted network:
- Use SSH tunnel: `ssh -L 6600:localhost:6600 user@server`
- Configure Conductor to use localhost: `MPD_HOST=localhost MPD_PORT=6600`
- MPD traffic is encrypted through SSH tunnel

**API traffic:**
- OpenRouter: HTTPS (encrypted)
- Anthropic: HTTPS (encrypted)
- MusicBrainz: HTTPS available, HTTP also works
- Ollama: HTTP (but local only, no encryption needed)

### Input Validation

**User commands:**
- Sanitized by AI provider before sending to model
- No direct shell execution from user input
- SQL injection not applicable (no database)

**MPD responses:**
- Type-checked with runtime type guards
- Invalid responses handled gracefully
- Won't crash on malformed MPD data

**API responses:**
- JSON parsing wrapped in try-catch
- Invalid responses logged and ignored
- Won't crash on malformed API data

## Multiple Environment Setups

### Development Environment

**Typical `.env` for development:**
```bash
# Development config
MPD_HOST=localhost
MPD_PORT=6600

# Use local Ollama (no API costs during dev)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.2

# Optional: Enable verbose logging (requires code change)
# NODE_ENV=development
```

**Run in dev mode:**
```bash
bun run dev  # Auto-reload on changes
```

### Staging Environment

**Example staging setup:**
```bash
# Staging config
MPD_HOST=staging.music.local
MPD_PORT=6600

# Use cheaper AI model
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-staging-key...
AI_MODEL=anthropic/claude-3-haiku

# Note: Keep staging keys separate from production
```

### Production Environment

**Example production setup:**
```bash
# Production config
MPD_HOST=music.prod.example.com
MPD_PORT=6600

# Use best AI model
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-prod-key...
AI_MODEL=anthropic/claude-3.5-sonnet

# Or use Anthropic directly
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-prod-key...
# AI_MODEL=claude-3-5-sonnet-20241022
```

**Deployment:**
```bash
# Build
bun run build

# Set environment variables (don't use .env in production)
export MPD_HOST=music.prod.example.com
export AI_PROVIDER=openrouter
export OPENROUTER_API_KEY=...

# Run
bun start
```

**Production checklist:**
- [ ] API keys from environment variables, not `.env` file
- [ ] File permissions locked down (600 for sensitive files)
- [ ] MPD uses authentication if exposed to network
- [ ] Monitor API usage and set spending limits
- [ ] Have fallback AI provider configured
- [ ] Log errors to file for debugging
- [ ] Run as non-root user
- [ ] Consider using systemd service for auto-restart

### Multi-User Setup

**Scenario:** Multiple users on same system, each with their own MPD instance

**User 1 config:**
```bash
MPD_HOST=localhost
MPD_PORT=6600  # Default user port
AI_PROVIDER=ollama
AI_MODEL=llama3.2
```

**User 2 config:**
```bash
MPD_HOST=localhost
MPD_PORT=6601  # Different port
AI_PROVIDER=ollama
AI_MODEL=llama3.2
```

Each user runs their own MPD instance on different ports.

## Configuration Examples

### Example 1: Basic Local Setup

Perfect for: First-time users, no API costs, full privacy

```bash
# .env
MPD_HOST=localhost
MPD_PORT=6600
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.2
```

**Requirements:**
- MPD running locally
- Ollama installed with llama3.2 model
- 8GB+ RAM

**Cost:** Free

### Example 2: Remote MPD + Cloud AI

Perfect for: MPD on home server, want best AI quality

```bash
# .env
MPD_HOST=192.168.1.100
MPD_PORT=6600
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
AI_MODEL=anthropic/claude-3.5-sonnet
```

**Requirements:**
- MPD accessible on LAN
- OpenRouter account with credits
- Internet connection

**Cost:** ~$0.01 per command

### Example 3: All Remote (Minimal Local Setup)

Perfect for: Chromebook, low-end device, SSH into powerful server

```bash
# .env
MPD_HOST=music.example.com
MPD_PORT=6600
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
AI_MODEL=anthropic/claude-3-haiku  # Cheap
```

**Requirements:**
- MPD on remote server
- OpenRouter account
- Internet connection

**Cost:** ~$0.001 per command

### Example 4: Privacy-Focused

Perfect for: No data leaves your machine

```bash
# .env
MPD_HOST=localhost
MPD_PORT=6600
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.2
```

**Optional:** Run MPD with password:
```bash
# In mpd.conf
password "your_password@read,add,control,admin"

# In .env
MPD_HOST=your_password@localhost
```

**Requirements:**
- Everything local
- No internet needed (after initial setup)

**Cost:** Free

### Example 5: Power User Setup

Perfect for: Best of both worlds, local privacy with cloud fallback

```bash
# .env
MPD_HOST=localhost
MPD_PORT=6600

# Primary: Local AI for privacy
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.2:70b  # High-quality local model

# To switch to cloud for complex commands:
# AI_PROVIDER=openrouter
# OPENROUTER_API_KEY=sk-or-v1-...
# AI_MODEL=anthropic/claude-3.5-sonnet
```

**Strategy:**
- Use Ollama for normal day-to-day commands
- Switch to OpenRouter if commands aren't working well
- Change `AI_PROVIDER` in `.env` and restart Conductor

**Requirements:**
- Powerful machine (48GB+ RAM, GPU)
- OpenRouter account for fallback

**Cost:** Free (primary), ~$0.01 per cloud fallback

## Configuration Validation

### Checking Your Configuration

**Run this checklist before starting Conductor:**

1. **Verify MPD is running:**
   ```bash
   mpc status
   # Should show current status, not "error: Connection refused"
   ```

2. **Verify AI provider is available:**
   
   For Ollama:
   ```bash
   curl http://localhost:11434/api/tags
   # Should return list of models
   
   ollama list
   # Check your configured model is in the list
   ```
   
   For OpenRouter:
   ```bash
   curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
        https://openrouter.ai/api/v1/models
   # Should return 200 OK with model list
   ```

3. **Verify environment variables are loaded:**
   ```bash
   # In project directory
   source .env
   echo $AI_PROVIDER
   echo $MPD_HOST
   # Should output your configured values
   ```

### Common Configuration Errors

**Error:** "Failed to connect to MPD"
- **Check:** MPD is running: `systemctl --user status mpd`
- **Check:** Port is correct: `mpc -h localhost -p 6600 status`
- **Check:** Firewall allows connection (if remote)

**Error:** "OpenRouter API key is required"
- **Check:** `.env` file exists and contains `OPENROUTER_API_KEY=...`
- **Check:** No spaces around `=` in `.env`
- **Check:** Key is correct (starts with `sk-or-v1-`)

**Error:** "Ollama request failed"
- **Check:** Ollama is running: `curl http://localhost:11434/api/tags`
- **Check:** Model is installed: `ollama list`
- **Check:** Base URL is correct: `echo $OLLAMA_BASE_URL`

**Error:** "Model not found"
- **Check:** Model name is correct (case-sensitive)
- **Check:** For Ollama: `ollama pull <model-name>`
- **Check:** For OpenRouter: Model exists at https://openrouter.ai/models

**AI responses are gibberish:**
- **Issue:** Model too small or not instruction-tuned
- **Fix:** Use larger model or switch to OpenRouter

**UI not updating:**
- **Check:** MPD connection is active
- **Check:** Music is actually playing: `mpc status`
- **Issue:** May be terminal rendering issue, try different terminal

## Troubleshooting

### Configuration File Not Loading

**Symptom:** Conductor uses defaults despite `.env` file

**Cause:** `.env` file not in correct location or not properly formatted

**Solution:**
```bash
# Check .env location (must be in project root)
ls -la .env

# Check .env format (no spaces around =)
cat .env

# Test loading manually
export $(cat .env | xargs)
echo $AI_PROVIDER
```

### Environment Variable Precedence Issues

**Symptom:** Configuration not matching `.env` file

**Cause:** System environment variables override `.env`

**Solution:**
```bash
# Check for conflicting system variables
env | grep MPD
env | grep AI_

# Unset system variables to use .env
unset MPD_HOST
unset AI_PROVIDER

# Or explicitly set them
export MPD_HOST=localhost
```

### MPD Connection Timeout

**Symptom:** "Failed to connect to MPD" after delay

**Cause:** MPD not running, firewall blocking, or wrong host/port

**Solution:**
```bash
# Test MPD connection directly
telnet localhost 6600
# Should connect and show: OK MPD <version>

# If connection refused, start MPD
systemctl --user start mpd

# If timeout, check firewall
sudo ufw status
# Add rule if needed: sudo ufw allow 6600
```

### AI Provider Authentication Failures

**Symptom:** 401 Unauthorized errors

**Cause:** Invalid or expired API key

**Solution:**
```bash
# Test OpenRouter key
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     https://openrouter.ai/api/v1/auth/key
# Should return key info

# Test Anthropic key
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
     https://api.anthropic.com/v1/messages \
     -d '{"model":"claude-3-haiku-20240307","messages":[{"role":"user","content":"Hi"}],"max_tokens":10}'
# Should return valid response (or quota error if no credits)

# If invalid, regenerate key in provider dashboard
```

### MusicBrainz Rate Limiting

**Symptom:** Metadata stops loading after several tracks

**Cause:** Exceeded 1 request/second limit (shouldn't happen with proper implementation)

**Solution:**
- Wait 60 seconds
- Check console for error messages
- If persistent, file a bug report

### Album Art Not Displaying

**Symptom:** No album art visible

**Diagnostic checklist:**
```bash
# 1. Check if Überzug++ is installed
command -v ueberzug
# Should output: /usr/bin/ueberzug or similar

# 2. Check if running in compatible terminal
echo $TERM
# Good: xterm-256color, screen-256color
# Check terminal docs for image support

# 3. Check if X11/Wayland is available
echo $DISPLAY
# Should output: :0 or :1 (or similar)

# 4. Test Überzug++ directly
echo '{"action":"add","identifier":"test","x":0,"y":0,"path":"/path/to/image.jpg"}' | ueberzug layer --parser json

# 5. Check temp directory permissions
ls -ld /tmp
# Should be writable: drwxrwxrwt
```

**Solution:**
- If Überzug++ missing: Install it or accept ASCII fallback
- If X11 missing: SSH with X11 forwarding or use locally
- If terminal incompatible: Switch to kitty, alacritty, or similar

### Performance Issues

**Symptom:** Conductor feels sluggish or uses too much CPU/memory

**Diagnostic:**
```bash
# Check CPU usage
top -p $(pgrep -f conductor)

# Check memory usage
ps aux | grep conductor

# Check Ollama usage (if applicable)
ps aux | grep ollama
```

**Solutions:**
- High CPU: Reduce polling rate (requires code change)
- High memory: Restart Conductor to clear cache
- Ollama using lots of GPU: Normal for local AI (reduce model size if concerned)

### Getting Help

If you've tried everything and it still doesn't work:

1. **Check existing documentation:**
   - `SETUP.md` for initial setup
   - `TROUBLESHOOTING.md` for common issues
   - `ARCHITECTURE.md` for how things work

2. **Gather diagnostic info:**
   ```bash
   # MPD status
   mpc status
   
   # Conductor environment
   env | grep -E "(MPD|AI_|OLLAMA|OPENROUTER|ANTHROPIC)"
   
   # System info
   uname -a
   bun --version  # or node --version
   ```

3. **Open an issue:**
   - Go to https://github.com/shelbeely/Conductor/issues
   - Include diagnostic info
   - Describe what you expected vs. what happened
   - Include relevant logs/error messages
