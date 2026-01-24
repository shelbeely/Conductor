# Project summary: Conductor

## What was built

Conductor is a TUI (Terminal User Interface) music player for Linux that combines:

1. MPD control with full Music Player Daemon integration
2. AI-powered commands via OpenRouter, Ollama, Anthropic, or GitHub Copilot SDK
3. MusicBrainz integration for artist/album information
4. Synced lyrics display via LRCLib
5. AI DJ hosts with TTS for radio-style commentary
6. Ink-based TUI with album art support (Überzug++)
7. Modular code structure

## Key features implemented

### Core functionality
- MPD connection and playback control (play, pause, stop, next, previous)
- Queue management (add, remove, clear, view)
- Music library search
- Volume control and playback settings (repeat, random)
- Real-time status monitoring
- Automatic reconnection

### AI integration
- Multi-provider support (OpenRouter, Ollama, Anthropic, GitHub Copilot SDK)
- Natural language command processing
- Structured tool calling with Zod schemas
- Conversation history and context
- Dynamic model selection and switching
- AI-powered playlist generation
- 8+ predefined tool schemas for music operations

### Metadata and enrichment
- MusicBrainz API integration
- Artist/album/release information
- Cover art fetching from Cover Art Archive
- In-memory caching
- Rate limiting (1 req/sec)

### Album art display
- Überzug++ integration for terminal image display
- ASCII art fallback for unsupported terminals
- Image downloading and caching
- Automatic cleanup

### User interface (Ink/React)
- Now Playing view with enriched metadata
- Queue display with current position indicator
- Synced lyrics display with real-time highlighting (LRCLib integration)
- Audio visualizer (animated)
- Command input with history navigation
- Keyboard shortcuts (L for lyrics toggle)
- Clean, responsive layout

### Text-to-Speech and AI DJ
- AI DJ hosts with radio-style commentary between songs
- Multiple TTS providers (OpenAI, Piper, Bark, ElevenLabs, Google, Qwen3)
- Bark TTS with non-verbal sounds ([laughter], [sighs], etc.)
- Qwen3 TTS with voice cloning support
- 30 unique DJ voice personas
- "Beyond the Beat" podcast-style track stories
- Configurable DJ frequency and personalities

### Development and documentation
- TypeScript configuration
- bun.js support (with npm fallback)
- Comprehensive README
- Detailed setup guide (SETUP.md)
- Contributing guidelines
- Architecture documentation
- MIT License
- Example configuration file

## Technology stack

Runtime: bun.js (or Node.js 18+)
UI: Ink (React for CLI)
MPD Client: mpc-js
AI Providers: OpenRouter, Ollama, Anthropic, GitHub Copilot SDK
Metadata: MusicBrainz API
Lyrics: LRCLib API
TTS: OpenAI, Piper, Bark, ElevenLabs, Google Cloud, Qwen3
Album Art: Überzug++
Type Safety: TypeScript
Validation: Zod
Build: TypeScript Compiler

## Project statistics

Source Files: 20+ TypeScript/TSX files
Modules: 9 (MPD, AI, Metadata, Lyrics, Art, TTS, UI, App, Setup)
UI Components: 8+ (NowPlaying, Queue, Lyrics, Visualizer, CommandInput, TrackStory, Assistant, SetupWizard)
AI Tools: 10+ predefined schemas
TTS Providers: 6 (OpenAI, Piper, Bark, ElevenLabs, Google, Qwen3)
Dependencies: 13 runtime, 4 dev dependencies

## File structure

```
Conductor/
├── src/
│   ├── mpd/
│   │   └── client.ts         - MPD connection & control
│   ├── ai/
│   │   ├── agent.ts          - Multi-provider AI agent
│   │   └── copilot-provider.ts - GitHub Copilot SDK integration
│   ├── metadata/
│   │   └── musicbrainz.ts    - MusicBrainz integration
│   ├── lyrics/
│   │   └── lrclib.ts         - LRCLib synced lyrics
│   ├── art/
│   │   └── display.ts        - Überzug++ album art
│   ├── tts/
│   │   ├── manager.ts        - TTS provider management
│   │   ├── openai.ts         - OpenAI TTS
│   │   ├── piper.ts          - Piper local TTS
│   │   ├── bark.ts           - Bark TTS with non-verbal sounds
│   │   ├── elevenlabs.ts     - ElevenLabs premium TTS
│   │   ├── google.ts         - Google Cloud TTS
│   │   ├── qwen.ts           - Qwen3 TTS with voice cloning
│   │   └── types.ts          - TTS type definitions
│   ├── ui/
│   │   ├── NowPlaying.tsx    - Current track display
│   │   ├── Queue.tsx         - Playlist view
│   │   ├── Lyrics.tsx        - Synced lyrics display
│   │   ├── Visualizer.tsx    - Audio visualizer
│   │   ├── CommandInput.tsx  - Natural language input
│   │   ├── TrackStory.tsx    - "Beyond the Beat" stories
│   │   ├── Assistant.tsx     - AI assistant UI
│   │   └── SetupWizard.tsx   - Interactive setup wizard
│   ├── App.tsx               - Main orchestration
│   └── index.tsx             - Entry point
├── ARCHITECTURE.md           - Design documentation
├── CONTRIBUTING.md           - Contribution guide
├── SETUP.md                  - Installation & setup
├── README.md                 - Main documentation
├── LICENSE                   - MIT license
├── .env.example              - Config template
├── .gitignore                - Git ignore rules
├── package.json              - Dependencies & scripts
└── tsconfig.json             - TypeScript config
```

## What works

- Complete TypeScript build pipeline
- Modular, extensible architecture
- Multi-provider AI support (local and remote)
- Full MPD integration via mpc-js
- MusicBrainz metadata enrichment
- Terminal UI with Ink/React
- Graceful fallbacks (ASCII art, connection retry)
- Environment-based configuration
- Comprehensive documentation

## What needs live testing

- MPD Connection: Requires MPD server running
- AI Providers: Requires API keys or Ollama installation
- Album Art: Requires Überzug++ for image display
- Music Playback: Requires music library in MPD

## Installation and usage

### Quick start
```bash
# Install dependencies
bun install  # or npm install

# Configure
cp .env.example .env
# Edit .env with your settings

# Build
bun run build  # or npm run build

# Run
bun start  # or npm start
```

### Requirements
- Linux environment (primary target)
- MPD installed and running
- bun.js >= 1.0.0 or Node.js >= 18.0.0
- (Optional) Ollama for local AI
- (Optional) OpenRouter API key for remote AI
- (Optional) Überzug++ for album art

## Example commands

Once running, try:
- "play some jazz"
- "skip to next track"
- "show me the queue"
- "set volume to 75"
- "enable repeat mode"
- "queue some Miles Davis"

## Future enhancements

Potential additions (not implemented):
- [ ] Playlist management
- [ ] Last.fm scrobbling
- [ ] Lyrics display
- [ ] Multiple MPD servers
- [ ] Plugin system
- [ ] Theme customization
- [ ] Web API for remote control
- [ ] Unit tests
- [ ] Integration tests

## Implementation summary

The project includes:

- Linux-first TUI built with Ink for terminal display
- bun.js runtime configured with npm fallback
- MPD playback and queue control via mpc-js
- Natural language commands via OpenRouter/Ollama
- Structured tool schemas with Zod validation
- MusicBrainz artist/release enrichment and matching
- Überzug++ album art with ASCII fallback
- Track info with metadata display
- Playlist view with navigation
- Animated TUI visualizer
- Clean separation of concerns (UI, MPD, AI, Metadata, Art)

The codebase uses modern TypeScript, clean architectural patterns, and includes comprehensive documentation.
