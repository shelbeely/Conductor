# Changelog

All notable changes to Conductor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

**Lyrics Display:**
- Integrated LRCLib API for synced lyrics
- Real-time lyrics scrolling with playback position
- Highlighted current line for sing-along
- Keyboard shortcut (L key) to toggle lyrics view
- Natural language commands: "show lyrics", "hide lyrics"
- Automatic fallback to plain text lyrics when synced lyrics unavailable
- Lyrics caching for improved performance

**GitHub Copilot SDK Integration:**
- Added GitHub Copilot SDK as fourth AI provider option
- Support for GPT-4o, GPT-4o-mini, o1-preview, o1-mini, and Claude models via Copilot
- Requires GitHub token with 'copilot' scope
- See COPILOT_SDK_SETUP.md for configuration details

**AI DJ Hosts Feature:**
- Radio-style AI hosts that provide commentary between songs
- Two-host conversation format (Host 1 and Host 2)
- Automatic activation every 4-5 songs (configurable)
- Self-aware AI that admits it might be wrong
- 30 unique DJ voice personas to choose from
- Natural language commands: "enable dj", "disable dj"
- TTS integration with multiple providers

**Enhanced TTS Support:**
- Added Bark TTS provider (local, with non-verbal sounds)
- Added ElevenLabs TTS provider (premium cloud quality)
- Added Google Cloud TTS provider (generous free tier)
- Added Qwen3 TTS provider (with voice cloning support)
- Bark supports special tokens: [laughter], [sighs], [music], [gasps]
- 30 DJ voice personas with distinct personalities
- Voice cloning support for custom AI DJ hosts

**Setup Wizard Improvements:**
- Converted setup wizard to Ink-based UI component
- Beautiful terminal interface with ASCII art and animations
- ADHD and autism-friendly design with clear visual feedback
- Selective component installation (MPD, Ollama, Bark TTS, Überzug++)
- Uninstall support for easy cleanup
- Re-runnable with `bun run setup`
- Smooth transition from setup to main app

**Beyond the Beat Feature:**
- Podcast-style track story narration
- Two AI hosts discuss song meaning, production, and history
- Pre-generated and cached audio for seamless playback
- Natural language command: "beyond the beat"

### Changed

- Updated README.md with lyrics feature, keyboard shortcuts, and expanded TTS documentation
- Updated USER_GUIDE.md with lyrics section and L key documentation
- Updated COMMANDS.md with lyrics commands
- Updated CONFIGURATION.md with all TTS providers (qwen, bark)
- Updated TTS_RECOMMENDATIONS.md with Qwen3 and Bark documentation
- Updated architecture diagram to include lyrics and TTS modules
- Added GitHub Copilot to AI Provider comparison table

### Documentation

- Comprehensive lyrics documentation across README, USER_GUIDE, and COMMANDS
- Added Bark TTS non-verbal sounds documentation
- Added Qwen3 voice cloning documentation
- Added 30 DJ voice persona descriptions
- Updated all TTS provider documentation

## [0.2.0] - 2024-01-15

### Added

**AI Model Management:**
- Added `listAvailableModels()` method to query available models from AI providers
- Added `setModel(modelId)` method to switch between models at runtime
- Added `getCurrentModel()` method to check which model is currently active
- Added `getProvider()` method to identify the current AI provider
- Natural language commands for model switching: "use llama3.2" or "switch to claude"
- Model information display includes name, description, context length, and pricing

**AI-Powered Playlist Generation:**
- Added `generate_playlist` tool for creating smart playlists based on criteria
- Support for mood-based generation: "create a relaxing playlist"
- Support for genre-based generation: "make a jazz playlist"
- Support for activity-based generation: "generate a workout playlist"
- Support for energy level: "build an upbeat playlist"
- Configurable target length (default: 20 tracks)
- Optional shuffle on generation
- AI analyzes your library and selects tracks matching the criteria

**Documentation:**
- Added SECURITY.md covering API key security, network security, file permissions, and secure configuration
- Added INTEGRATION.md documenting Last.fm, Discord, web APIs, and other music tool integrations
- Added TESTING.md with comprehensive manual testing checklist and automated testing plans
- Added DEPLOYMENT.md covering systemd services, Docker, installation scripts, and cloud deployment
- Added CHANGELOG.md to track version history

### Changed

- Updated README.md to mention playlist generation and model selection features
- Updated COMMANDS.md with new playlist generation and model selection command examples
- Updated API_REFERENCE.md to document new AI agent methods
- Updated USER_GUIDE.md with sections on playlist generation and model selection
- Improved AI provider abstraction to support model management across all providers

### Technical Details

**Model Management Implementation:**
- OpenRouter provider lists models via `/api/v1/models` endpoint
- Ollama provider lists local models via `/api/tags` endpoint
- Anthropic provider supports Claude models (hardcoded list for now)
- Model switching persists within session but resets on restart
- Model information cached for performance

**Playlist Generation Implementation:**
- AI interprets natural language criteria
- Searches library using MPD search commands
- Applies intelligent filtering based on mood/genre/activity keywords
- Returns curated track list matching the requested vibe
- Integrates with existing queue management system

### Performance

- Model listing calls are lazy-loaded (only when requested)
- Playlist generation searches optimized to avoid scanning entire library
- MusicBrainz metadata cache helps with playlist generation accuracy

### Security

- No changes to API key handling (still secure in .env file)
- Model switching doesn't expose additional attack surface
- Playlist generation uses existing MPD search (no new vulnerabilities)

## [0.1.0] - 2024-01-01

### Added

- Initial release of Conductor TUI music player
- MPD client with full playback control
- Natural language command processing via AI
- Multi-provider AI support (OpenRouter, Ollama, Anthropic)
- MusicBrainz integration for metadata enrichment
- Album art display via Überzug++ with ASCII fallback
- Now Playing view with track metadata and progress bar
- Queue viewer with navigation
- Volume control (0-100)
- Playback modes: repeat, random, single, consume
- Command history with up/down arrow navigation
- Automatic MPD reconnection on connection loss
- Rate-limited MusicBrainz API requests
- Cached metadata and album art
- TypeScript with strict type checking
- React/Ink TUI components
- Zod schema validation for AI tool calls

### AI Tools Implemented

- `search_music` - Search library by artist, album, title, or genre
- `play_music` - Play music immediately or jump to queue position
- `queue_music` - Add music to end or next in queue
- `control_playback` - Play, pause, stop, next, previous, toggle
- `set_volume` - Adjust volume 0-100
- `toggle_setting` - Toggle repeat, random, single, consume modes
- `get_queue` - View current playback queue
- `clear_queue` - Empty the queue with confirmation

### Documentation

- README.md with installation and usage
- SETUP.md with detailed setup instructions
- USER_GUIDE.md with comprehensive user documentation
- COMMANDS.md with natural language command examples
- API_REFERENCE.md with technical API documentation
- CONFIGURATION.md with environment variable reference
- ARCHITECTURE.md explaining code structure
- CONTRIBUTING.md for development guidelines
- TROUBLESHOOTING.md for common issues
- FAQ.md for frequently asked questions

### Dependencies

- bun.js (runtime and bundler)
- Ink (React for CLI)
- mpc-js (MPD client)
- Zod (schema validation)
- TypeScript (type safety)
- Various Ink components (spinner, text input, box)

### Requirements

- Linux (primary target)
- MPD (Music Player Daemon) installed and configured
- bun.js >= 1.0.0
- Optional: Überzug++ for album art
- Optional: Ollama for local AI models
- Optional: OpenRouter or Anthropic API key for cloud AI

---

## Release Notes

### 0.2.0 - The Smart Playlist Release

This release adds two major features that make Conductor smarter and more flexible:

**Dynamic Model Selection** lets you switch between AI models on the fly. Want faster responses? Switch to a lighter model. Need better understanding? Use Claude or GPT-4. All without restarting Conductor.

**AI-Powered Playlist Generation** creates playlists based on natural language descriptions. Tell Conductor you want "upbeat workout music" or "relaxing evening jazz" and it analyzes your library to build the perfect queue. No more manual playlist creation - just describe what you want.

These features build on Conductor's core natural language interface, making it feel more like talking to a music-loving friend than using a traditional music player.

### 0.1.0 - Initial Release

The first public release of Conductor. A terminal music player that understands what you mean. Type "play some jazz" and it works. No hotkeys to memorize, no complex commands. Just natural language.

Built for Linux users who want MPD control without learning mpc syntax. Integrates with MusicBrainz for metadata and supports local (Ollama) or cloud (OpenRouter, Anthropic) AI.

The TUI shows what's playing, what's queued, and accepts commands at the bottom. Album art displays if you have Überzug++, ASCII art if you don't. Everything updates in real-time as MPD plays your music.

---

## Future Plans

### Planned for 0.3.0

- Playlist management: Save, load, edit playlists via natural language
- Audio visualizer improvements: More visualization modes
- Radio mode: Stream internet radio stations through MPD
- Smart shuffle: Weighted random based on listening history
- Collaborative queues: Multiple users controlling shared MPD instance

### Planned for 1.0.0

- Automated test suite: Unit, integration, and E2E tests
- Performance optimizations: Faster search, reduced memory usage
- Plugin system: Extend Conductor with custom tools and commands
- Configuration UI: Set preferences without editing .env
- Backup/restore: Export and import settings and playlists
- Stable API: Semantic versioning guarantees for integrations

### Under Consideration

- Support for macOS and Windows (via WSL)
- Mobile companion app: Control Conductor from phone
- Web interface: Browser-based control panel
- Streaming service integration: Spotify, Tidal, etc.
- Voice control: Local voice recognition for hands-free operation
- Recommendation engine: AI suggests music based on listening patterns
- Social features: Share playlists, collaborative listening

---

## Version History

- **0.2.0** (2024-01-15): AI model management and playlist generation
- **0.1.0** (2024-01-01): Initial release with core functionality

---

## Links

- **Repository**: https://github.com/shelbeely/Conductor
- **Issues**: https://github.com/shelbeely/Conductor/issues
- **Discussions**: https://github.com/shelbeely/Conductor/discussions
- **NPM** (if published): https://www.npmjs.com/package/conductor-tui

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting changes. All contributions should update this changelog in the "Unreleased" section.

## License

MIT License - see [LICENSE](LICENSE) for details.
