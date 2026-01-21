# Architecture documentation

## Overview

Conductor is a modular TUI music player. Each module handles a specific responsibility: MPD communication, AI command processing, metadata fetching, album art display, and UI rendering.

## Core modules

### 1. MPD client (`src/mpd/client.ts`)

**Purpose**: Communicates with Music Player Daemon

**Responsibilities**:
- TCP connection to MPD server
- Playback control (play, pause, stop, next, previous)
- Queue management (add, remove, clear, reorder)
- Status monitoring
- Music library search
- Automatic reconnection on disconnect

**Key classes**:
- `MPDClient`: Main client class
- Uses `mpc-js` library for protocol implementation

**Design patterns**:
- Singleton-like pattern (one client per app instance)
- Observer pattern (event listeners for disconnection)
- Null object pattern (returns null/empty arrays on failure)

### 2. AI agent (`src/ai/agent.ts`)

**Purpose**: Processes natural language commands

**Responsibilities**:
- Parse natural language commands
- Execute structured tool calls
- Manage conversation context
- Support multiple AI providers

**Key classes**:
- `AIAgent`: Main coordinator
- `AIProvider`: Abstract base class for providers
- `OpenRouterProvider`: Remote AI via OpenRouter API
- `OllamaProvider`: Local AI via Ollama
- `AnthropicProvider`: Remote AI via Anthropic API (partial)

**Design patterns**:
- Strategy pattern (swappable AI providers)
- Factory pattern (provider instantiation)
- Command pattern (tool calls)

**Tool schema**:
Uses Zod for runtime type validation of tool parameters:
- `search_music`: Search library
- `play_music`: Start playback
- `queue_music`: Add to queue
- `control_playback`: Play/pause/stop/next/previous
- `set_volume`: Volume control
- `toggle_setting`: Repeat/random/etc.
- `get_queue`: View queue
- `clear_queue`: Clear queue

### 3. Metadata module (`src/metadata/musicbrainz.ts`)

**Purpose**: Fetches additional track information from MusicBrainz

**Responsibilities**:
- Search MusicBrainz for artist/album info
- Fetch cover art URLs
- Cache metadata to reduce API calls
- Rate limiting (1 req/sec per MusicBrainz guidelines)

**Key classes**:
- `MusicBrainzClient`: API client
- In-memory caching with Map

**Design patterns**:
- Repository pattern (data access abstraction)
- Cache-aside pattern
- Rate limiting pattern

### 4. Album art module (`src/art/display.ts`)

**Purpose**: Displays album artwork in terminal

**Responsibilities**:
- Check for Überzug++ availability
- Display images via Überzug++ protocol
- Download and cache cover art
- Generate ASCII art fallback
- Clean up temporary files

**Key classes**:
- `AlbumArtManager`: Main coordinator

**Design patterns**:
- Adapter pattern (Überzug++ process communication)
- Fallback pattern (ASCII art when Überzug++ unavailable)

### 5. UI components (`src/ui/`)

**Purpose**: Terminal user interface using React/Ink

**Components**:
- `NowPlaying`: Current track display with metadata
- `Queue`: Playlist view with scroll
- `Visualizer`: Animated audio visualizer
- `CommandInput`: Natural language input with history

**Design patterns**:
- Component pattern (React)
- Observer pattern (useEffect for updates)
- Controlled components (input state)

### 6. Main app (`src/App.tsx`)

**Purpose**: Connects all modules

**Responsibilities**:
- Initialize all modules
- Coordinate data flow
- Handle user commands
- Update UI state
- Error handling

**Data flow**:
```
User Input (CommandInput)
  ↓
AI Agent (process command)
  ↓
Tool Calls (structured actions)
  ↓
MPD Client (execute actions)
  ↓
Update State (React state)
  ↓
UI Render (Ink components)
```

## Configuration

Environment-based configuration:
- `MPD_HOST`, `MPD_PORT`: MPD connection
- `AI_PROVIDER`: Which AI to use
- `OPENROUTER_API_KEY`, `AI_MODEL`: Remote AI config
- `OLLAMA_BASE_URL`: Local AI config

## State management

**React state in App.tsx**:
- `connected`: MPD connection status
- `currentTrack`: Currently playing track (enriched)
- `status`: Player status (state, volume, etc.)
- `queue`: Current playlist
- `aiResponse`: Last AI response
- `isProcessing`: Command processing flag
- `albumArtAscii`: ASCII art for fallback
- `error`: Error messages

**Update loop**:
- Poll MPD every 1 second for status updates
- Enrich new tracks with MusicBrainz metadata
- Update album art when track changes

## Error handling

**Graceful degradation**:
- MPD disconnected: Show error, retry connection
- AI unavailable: Show error message
- Metadata unavailable: Continue without enrichment
- Überzug++ missing: Fall back to ASCII art

**Error boundaries**:
- Try-catch around all async operations
- Log errors to console
- Show user-friendly error messages in UI

## Extension points

**Adding new AI providers**:
1. Extend `AIProvider` class
2. Implement `processCommand()` method
3. Add to `AIAgent` factory

**Adding new tools**:
1. Define Zod schema in `agent.ts`
2. Add to `tools` array
3. Implement handler in `App.tsx`

**Adding new UI components**:
1. Create component in `src/ui/`
2. Import in `App.tsx`
3. Add to render tree

**Adding new metadata sources**:
1. Create client class like `MusicBrainzClient`
2. Call in `updatePlayerState()` enrichment flow

## Performance considerations

**Optimization strategies**:
- Metadata caching to reduce API calls
- Rate limiting for external APIs
- Polling interval (1s) balances freshness vs. overhead
- Lazy loading of album art
- Async/await for non-blocking operations

**Potential improvements**:
- Implement proper event-based MPD updates (idle mode)
- Use React.memo for expensive components
- Implement virtual scrolling for long queues
- Add service worker for metadata caching

## Security

**Considerations**:
- API keys via environment variables (not committed)
- Rate limiting to prevent abuse
- Input sanitization for search queries
- Temp file cleanup to prevent disk filling

## Testing strategy

**Current state**: Manual testing

**Future improvements**:
- Unit tests for MPD client methods
- Mock AI providers for deterministic testing
- Integration tests with test MPD instance
- Snapshot tests for UI components
- E2E tests for complete workflows

## Deployment

**Build process**:
1. TypeScript compilation to JavaScript
2. No bundling (uses Node.js module resolution)
3. Executable flag on entry point

**Runtime requirements**:
- bun.js >= 1.0.0 or Node.js >= 18.0.0
- MPD running and accessible
- Optional: Ollama for local AI
- Optional: Überzug++ for album art

## Future architecture considerations

**Potential enhancements**:
- Plugin system for extensibility
- WebSocket API for remote control
- Database for persistent metadata cache
- Multiple MPD server support
- Last.fm scrobbling integration
- Lyrics display from online sources
- Custom theme system
