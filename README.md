# Conductor

A Linux-first TUI music player built with bun.js and Ink that controls MPD (Music Player Daemon). Use natural language commands via OpenRouter, Ollama, Anthropic, or GitHub Copilot SDK.

## Features

**MPD Control:** Full playback control, queue management, and library browsing

**AI-Powered Commands:** Natural language interface using multiple AI providers
- "play some jazz"
- "skip to next track"
- "show me the queue"
- "set volume to 50"
- "create a relaxing playlist" (NEW in 0.2.0)
- "use llama3.2 model" (NEW in 0.2.0)

**Multiple AI Providers:**
- OpenRouter (100+ models, remote)
- Ollama (local, private)
- Anthropic Claude (remote)
- **GitHub Copilot SDK** (NEW in 0.2.0) - Use your Copilot subscription

**Smart Playlist Generation:** AI creates playlists based on mood, genre, activity, or energy level
- Mood-based: "generate a chill playlist"
- Activity-based: "make a workout playlist"
- Genre-specific: "create a jazz playlist with 30 tracks"

**AI DJ Hosts (NEW in 0.2.0):** Radio-style commentary between songs
- Two AI hosts pop in every 4-5 songs with fun facts and trivia
- Short 30-60 second interjections like a real radio show
- Self-aware AI that admits it might be wrong
- Works automatically with playlists and radio stations

**Dynamic Model Selection:** Switch AI models on the fly
- List available models from your provider
- Change models without restarting
- See current model and provider information

**Terminal Interface:** Built with Ink (React for CLI)
- Now Playing view with track metadata
- Queue viewer with navigation
- Audio visualizer
- Album art display (via Überzug++)

**Metadata Enrichment:** MusicBrainz integration for artist/album info

**Album Art:** Überzug++ support with ASCII art fallback

**Lyrics Display:** Synced lyrics from LRCLib with real-time highlighting
- Press `L` to toggle lyrics view
- Automatic sync with playback position
- Scrolling lyrics display

**Modular Architecture:** Clean separation of concerns (MPD, AI, Metadata, UI)

## Prerequisites

### Required

- bun.js >= 1.0.0 ([install](https://bun.sh))
- MPD (Music Player Daemon) or Mopidy installed and running
- Linux environment (primary target)

### Optional

- Überzug++ for album art display: `sudo apt install ueberzug` or build from source
- Ollama for local AI models: [install guide](https://ollama.ai)
- OpenRouter API key for remote AI models: [get key](https://openrouter.ai)
- GitHub Copilot subscription for Copilot SDK: [see COPILOT_SDK_SETUP.md](COPILOT_SDK_SETUP.md)
- Mopidy for streaming services (YouTube Music, Spotify, etc.) - see [MOPIDY_SETUP.md](MOPIDY_SETUP.md)

## Installation

### Quick Start: Interactive Setup Wizard (Recommended)

For beginners or quick setup, use the interactive wizard that installs everything for you:

```bash
git clone https://github.com/shelbeely/Conductor.git
cd Conductor
bun install

# Run the interactive setup wizard
bun run setup
# Or simply: bun start (wizard shows automatically on first run)
```

The wizard will:
- ✅ Install and configure MPD (Music Player Daemon)
- ✅ Install Ollama (local AI) with model selection
- ✅ Install Bark TTS (for AI DJ hosts with non-verbal sounds) - optional
- ✅ Install Überzug++ (for album art) - optional
- ✅ Create and configure your `.env` file
- ✅ Start services and test everything

**NEW**: The wizard is now built into the main app using Ink! It features:
- 🎨 Beautiful terminal UI with ASCII art and animations
- ♿ ADHD and autism-friendly design with clear visual feedback
- 🔄 Re-run anytime with `bun run setup` to add/remove components
- 📦 Selective installation - choose what you want
- 🗑️ Uninstall support for easy cleanup

**Perfect for**: First-time users, Linux beginners, or anyone who wants a hassle-free setup.

### Manual Installation (Advanced)

For advanced users who prefer manual control:

### 1. Clone and Install

```bash
git clone https://github.com/shelbeely/Conductor.git
cd Conductor
bun install
```

### 2. Setup MPD or Mopidy

**Option A: MPD (traditional)**

If MPD is not already installed:

```bash
# Debian/Ubuntu
sudo apt install mpd mpc

# Arch Linux
sudo pacman -S mpd mpc

# Start MPD
systemctl --user start mpd
```

Configure MPD (edit `~/.config/mpd/mpd.conf`):

```conf
music_directory    "~/Music"
playlist_directory "~/.config/mpd/playlists"
db_file            "~/.config/mpd/database"
log_file           "~/.config/mpd/log"
pid_file           "~/.config/mpd/pid"
state_file         "~/.config/mpd/state"
sticker_file       "~/.config/mpd/sticker.sql"

audio_output {
    type  "pulse"
    name  "My Pulse Output"
}

bind_to_address    "localhost"
port               "6600"
```

Update your music database:

```bash
mpc update
```

**Option B: Mopidy (for streaming services like YouTube Music, Spotify)**

See the complete guide: [MOPIDY_SETUP.md](MOPIDY_SETUP.md)

Quick setup:

```bash
# Install Mopidy and YouTube Music plugin
pip3 install mopidy mopidy-ytmusic

# Setup YouTube Music authentication
mopidy-ytmusic setup

# Start Mopidy
mopidy
```

Conductor works with both MPD and Mopidy - they use the same protocol!

### 3. Configure AI Provider

#### Option A: Local (Ollama - No API Key Needed)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Start Ollama (if not running)
ollama serve
```

Create `.env` file:

```bash
AI_PROVIDER=ollama
AI_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434
```

#### Option B: Remote (OpenRouter)

Get an API key from [OpenRouter](https://openrouter.ai) and create `.env`:

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
AI_MODEL=anthropic/claude-3.5-sonnet
```

### 4. Build and Run

```bash
# Build
bun run build

# Run
bun start

# Or run directly in dev mode
bun run dev
```

## Usage

### Natural Language Commands

Conductor understands natural language. Just type what you want:

**Playback Control:**
- "play" / "pause" / "stop"
- "next track" / "previous song"
- "skip" / "go back"

**Music Search & Queue:**
- "play some jazz"
- "play songs by Miles Davis"
- "add Abbey Road to queue"
- "queue some rock music"

**Volume & Settings:**
- "set volume to 75"
- "turn up the volume"
- "enable repeat mode"
- "toggle random"

**Queue Management:**
- "show queue" / "show me what's playing next"
- "clear queue"

**Lyrics:**
- "show lyrics" / "display lyrics"
- Press `L` key to toggle lyrics display
- Synced lyrics scroll automatically with playback

### Keyboard Shortcuts

- `↑` / `↓`: Navigate command history
- `Enter`: Send command
- `L`: Toggle lyrics display
- `Ctrl+C`: Quit application

### Environment Variables

- `MPD_HOST`: MPD server host (default: localhost)
- `MPD_PORT`: MPD server port (default: 6600)
- `AI_PROVIDER`: AI provider - `ollama`, `openrouter`, or `anthropic`
- `AI_MODEL`: Model to use (provider-specific)
- `OPENROUTER_API_KEY`: OpenRouter API key
- `ANTHROPIC_API_KEY`: Anthropic API key (alternative)
- `OLLAMA_BASE_URL`: Ollama API URL (default: http://localhost:11434)

## Architecture

```
src/
├── mpd/          # MPD client and connection management
│   └── client.ts
├── ai/           # AI agent with multi-provider support
│   └── agent.ts  # OpenRouter, Ollama, Anthropic, GitHub Copilot
├── metadata/     # MusicBrainz integration
│   └── musicbrainz.ts
├── lyrics/       # LRCLib synced lyrics integration
│   └── lrclib.ts
├── art/          # Album art display (Überzug++)
│   └── display.ts
├── tts/          # Text-to-Speech for AI DJ hosts
│   ├── manager.ts
│   ├── bark.ts
│   ├── elevenlabs.ts
│   ├── google.ts
│   ├── openai.ts
│   ├── piper.ts
│   └── qwen.ts
├── ui/           # React/Ink TUI components
│   ├── NowPlaying.tsx
│   ├── Queue.tsx
│   ├── Lyrics.tsx
│   ├── Visualizer.tsx
│   └── CommandInput.tsx
├── App.tsx       # Main application orchestration
└── index.tsx     # Entry point
```

## AI Provider Comparison

| Feature | OpenRouter | Ollama | Anthropic | GitHub Copilot |
|---------|-----------|--------|-----------|----------------|
| Cost | Pay per use | Free | Pay per use | Subscription |
| Privacy | Data sent to API | Fully local | Data sent to API | Data sent to API |
| Setup | API key needed | Install locally | API key needed | GitHub token needed |
| Speed | Fast (cloud) | Depends on hardware | Fast (cloud) | Fast (cloud) |
| Models | Many options | Local models only | Claude only | GPT-4o, o1, Claude |
| Offline | No | Yes | No | No |

## Troubleshooting

### MPD Connection Issues

```bash
# Check if MPD is running
systemctl --user status mpd

# Check MPD logs
tail -f ~/.config/mpd/log

# Test connection
mpc status
```

### Ollama Connection Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# List installed models
ollama list
```

### Überzug++ Not Working

If album art doesn't display:
- Check if Überzug++ is installed: `which ueberzug`
- Try ASCII art fallback (automatic)
- Check terminal emulator compatibility

## Development

```bash
# Install dependencies
bun install

# Run in dev mode (auto-reload)
bun run dev

# Type check
bun run type-check

# Build for production
bun run build
```

### Code Quality

This project follows the [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) for optimal performance. See `.github/copilot-instructions.md` for development guidelines.

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Credits

- Built with [bun.js](https://bun.sh)
- UI with [Ink](https://github.com/vadimdemedes/ink)
- MPD client: [mpc-js](https://github.com/cotko/mpd.js)
- Metadata from [MusicBrainz](https://musicbrainz.org)
- AI via [OpenRouter](https://openrouter.ai) or [Ollama](https://ollama.ai)