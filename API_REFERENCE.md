# Conductor API Reference

Technical reference for working with Conductor's core modules.

## Table of Contents

- [MPDClient](#mpdclient)
- [AIAgent](#aiagent)
- [MusicBrainzClient](#musicbrainzclient)
- [AlbumArtManager](#albumartmanager)
- [Tool Schemas](#tool-schemas)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)

---

## MPDClient

The MPD client manages the connection to Music Player Daemon and handles all music playback operations.

### Constructor

```typescript
new MPDClient(config?: MPDConfig)
```

**Parameters:**
- `config` (optional): Connection configuration
  - `host` (string): MPD server hostname (default: `'localhost'`)
  - `port` (number): MPD server port (default: `6600`)

**Example:**
```typescript
const client = new MPDClient({ host: 'localhost', port: 6600 });
```

### Connection Methods

#### `connect(): Promise<void>`

Establishes connection to MPD server. Automatically reconnects if the connection drops.

```typescript
await client.connect();
```

**Throws:** Error if connection fails

#### `disconnect(): void`

Closes the MPD connection and cancels any scheduled reconnection attempts.

```typescript
client.disconnect();
```

#### `isConnected(): boolean`

Returns the current connection status.

```typescript
if (client.isConnected()) {
  // proceed with operations
}
```

### Playback Control

#### `play(pos?: number): Promise<void>`

Starts playback. Optionally jumps to a specific queue position.

```typescript
await client.play();      // Resume playback
await client.play(5);     // Play track at queue position 5
```

#### `pause(): Promise<void>`

Pauses playback.

```typescript
await client.pause();
```

#### `stop(): Promise<void>`

Stops playback completely.

```typescript
await client.stop();
```

#### `next(): Promise<void>`

Skips to the next track in the queue.

```typescript
await client.next();
```

#### `previous(): Promise<void>`

Returns to the previous track.

```typescript
await client.previous();
```

### Volume and Settings

#### `setVolume(volume: number): Promise<void>`

Sets playback volume. Values are automatically clamped to 0-100.

```typescript
await client.setVolume(75);
```

**Parameters:**
- `volume` (number): Volume level from 0 to 100

#### `toggleRepeat(): Promise<void>`

Toggles repeat mode on or off.

```typescript
await client.toggleRepeat();
```

#### `toggleRandom(): Promise<void>`

Toggles random playback mode.

```typescript
await client.toggleRandom();
```

### Track and Status Information

#### `getCurrentSong(): Promise<TrackInfo | null>`

Returns metadata for the currently playing track.

```typescript
const track = await client.getCurrentSong();
if (track) {
  console.log(`${track.artist} - ${track.title}`);
}
```

**Returns:** `TrackInfo` object or `null` if nothing is playing

#### `getStatus(): Promise<PlayerStatus | null>`

Returns current player status including state, volume, and playback options.

```typescript
const status = await client.getStatus();
if (status) {
  console.log(`State: ${status.state}, Volume: ${status.volume}`);
}
```

**Returns:** `PlayerStatus` object or `null` on error

### Queue Management

#### `getQueue(): Promise<TrackInfo[]>`

Returns all tracks in the current playback queue.

```typescript
const queue = await client.getQueue();
console.log(`Queue has ${queue.length} tracks`);
```

#### `addToQueue(uri: string): Promise<void>`

Adds a track to the end of the queue.

```typescript
await client.addToQueue('local/music/song.mp3');
```

**Parameters:**
- `uri` (string): File path or URI of the track to add

#### `removeFromQueue(pos: number): Promise<void>`

Removes a track from the queue by position.

```typescript
await client.removeFromQueue(3);  // Remove track at position 3
```

#### `clearQueue(): Promise<void>`

Empties the entire playback queue.

```typescript
await client.clearQueue();
```

### Library Operations

#### `search(type: string, query: string): Promise<TrackInfo[]>`

Searches the music library.

```typescript
const results = await client.search('artist', 'Miles Davis');
const albums = await client.search('album', 'Kind of Blue');
```

**Parameters:**
- `type` (string): Search field (`'artist'`, `'album'`, `'title'`, etc.)
- `query` (string): Search term

**Returns:** Array of matching tracks

#### `listAll(path?: string): Promise<TrackInfo[]>`

Lists all files in the music library or a specific directory.

```typescript
const allTracks = await client.listAll();
const jazzTracks = await client.listAll('jazz/');
```

---

## AIAgent

The AI agent processes natural language commands using various AI providers. It maintains conversation history and translates user intent into tool calls.

### Constructor

```typescript
new AIAgent(config: AIProviderConfig)
```

**Parameters:**
- `config`: Provider configuration
  - `provider` (`'openrouter'` | `'ollama'` | `'anthropic'`): Which AI service to use
  - `apiKey` (string, optional): API key for remote providers
  - `model` (string, optional): Model identifier
  - `baseURL` (string, optional): Custom endpoint for Ollama

**Examples:**

```typescript
// OpenRouter with Claude
const agent = new AIAgent({
  provider: 'openrouter',
  apiKey: process.env.OPENROUTER_API_KEY,
  model: 'anthropic/claude-3.5-sonnet'
});

// Local Ollama
const localAgent = new AIAgent({
  provider: 'ollama',
  model: 'llama3.2',
  baseURL: 'http://localhost:11434'
});
```

### Methods

#### `processCommand(userMessage: string): Promise<AIResponse>`

Processes a natural language command and returns the AI's response along with any tool calls.

```typescript
const response = await agent.processCommand('play some jazz');
console.log(response.message);

if (response.toolCalls) {
  for (const call of response.toolCalls) {
    console.log(`Tool: ${call.name}`, call.arguments);
  }
}
```

**Parameters:**
- `userMessage` (string): User's command in natural language

**Returns:** `AIResponse` containing:
- `message` (string): AI's text response
- `toolCalls` (optional): Array of `ToolCall` objects

#### `clearHistory(): void`

Clears the conversation history. Useful for starting fresh or managing memory usage.

```typescript
agent.clearHistory();
```

#### `listAvailableModels(): Promise<ModelInfo[]>` *NEW in v0.2.0*

Lists all available models from the current AI provider.

```typescript
const models = await agent.listAvailableModels();
models.forEach(model => {
  console.log(`${model.name}: ${model.description}`);
  if (model.pricing) {
    console.log(`  Cost: ${model.pricing.prompt} per prompt token`);
  }
});
```

**Returns:** Array of `ModelInfo` objects containing:
- `id` (string): Model identifier
- `name` (string): Display name
- `description` (string, optional): Model description
- `contextLength` (number, optional): Maximum context tokens
- `pricing` (object, optional): Cost information
  - `prompt` (string): Cost per prompt token
  - `completion` (string): Cost per completion token

**Provider-specific behavior:**
- **OpenRouter**: Fetches from `/api/v1/models` endpoint (returns full catalog)
- **Ollama**: Queries local `/api/tags` endpoint (returns installed models)
- **Anthropic**: Returns hardcoded list of Claude models

**Example output:**

```typescript
[
  {
    id: 'llama3.2',
    name: 'Llama 3.2',
    description: 'Fast and efficient local model',
    contextLength: 8192
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic\'s latest model',
    contextLength: 200000,
    pricing: {
      prompt: '$3.00 per million tokens',
      completion: '$15.00 per million tokens'
    }
  }
]
```

#### `setModel(modelId: string): void` *NEW in v0.2.0*

Switches to a different AI model without restarting.

```typescript
agent.setModel('llama3.2');
agent.setModel('anthropic/claude-3.5-sonnet');
```

**Parameters:**
- `modelId` (string): Model identifier from your provider

**Provider-specific model IDs:**
- **Ollama**: Model name as shown by `ollama list` (e.g., `'llama3.2'`, `'mistral'`)
- **OpenRouter**: Full model path (e.g., `'anthropic/claude-3.5-sonnet'`, `'openai/gpt-4'`)
- **Anthropic**: Claude model version (e.g., `'claude-3-opus'`, `'claude-3-sonnet'`)

**Note:** Model change takes effect immediately for the next command. Previous conversation history is preserved.

#### `getCurrentModel(): string` *NEW in v0.2.0*

Returns the currently active model identifier.

```typescript
const currentModel = agent.getCurrentModel();
console.log(`Using model: ${currentModel}`);
```

**Returns:** Model identifier string or `'unknown'` if unavailable

**Example:**
```typescript
agent.setModel('llama3.2');
console.log(agent.getCurrentModel());  // 'llama3.2'
```

#### `getProvider(): string` *NEW in v0.2.0*

Returns the name of the current AI provider.

```typescript
const provider = agent.getProvider();
console.log(`Provider: ${provider}`);
```

**Returns:** Provider name: `'openrouter'`, `'ollama'`, or `'anthropic'`

**Example:**
```typescript
const agent = new AIAgent({ provider: 'ollama' });
console.log(agent.getProvider());  // 'ollama'
```

### AI Providers

Each provider implements the same interface but handles requests differently.

#### OpenRouterProvider

Routes requests through OpenRouter, which provides access to multiple models including Claude, GPT-4, and others. Requires an API key.

**Configuration:**
```typescript
{
  provider: 'openrouter',
  apiKey: 'your-key-here',
  model: 'anthropic/claude-3.5-sonnet'  // or 'openai/gpt-4', etc.
}
```

#### OllamaProvider

Connects to a local Ollama instance. No API key needed. Good for privacy and offline use.

**Configuration:**
```typescript
{
  provider: 'ollama',
  model: 'llama3.2',
  baseURL: 'http://localhost:11434'  // default Ollama port
}
```

Note: Ollama's tool calling is less sophisticated than OpenRouter. It parses JSON tool calls from the response text.

#### AnthropicProvider

Direct integration with Anthropic's API. Requires an API key. Currently a placeholder implementation.

---

## MusicBrainzClient

Fetches metadata from the MusicBrainz API and Cover Art Archive. Includes built-in rate limiting (1 request/second) and caching.

### Constructor

```typescript
new MusicBrainzClient()
```

No configuration needed. The client uses sensible defaults.

### Methods

#### `searchArtist(artistName: string): Promise<ArtistInfo | null>`

Searches for an artist and returns their metadata.

```typescript
const artist = await mb.searchArtist('Miles Davis');
if (artist) {
  console.log(`${artist.name} (${artist.country})`);
  if (artist.lifeSpan?.begin) {
    console.log(`Born: ${artist.lifeSpan.begin}`);
  }
}
```

**Returns:** `ArtistInfo` object or `null` if not found

#### `searchRelease(title: string, artist?: string): Promise<ReleaseInfo | null>`

Searches for an album release. Including the artist name improves accuracy.

```typescript
const album = await mb.searchRelease('Kind of Blue', 'Miles Davis');
if (album) {
  console.log(`Released: ${album.date}`);
  console.log(`Cover: ${album.coverArtUrl}`);
}
```

**Parameters:**
- `title` (string): Album title
- `artist` (string, optional): Artist name for better matching

**Returns:** `ReleaseInfo` object (including cover art URL) or `null`

#### `getCoverArt(releaseId: string): Promise<string | null>`

Fetches the cover art URL for a specific release ID.

```typescript
const coverUrl = await mb.getCoverArt('release-mbid-here');
```

**Returns:** URL string or `null` if no cover art exists

#### `enrichTrack(track: TrackInfo): Promise<EnrichedTrack>`

Enriches a track with artist and release information from MusicBrainz.

```typescript
const enriched = await mb.enrichTrack(track);
if (enriched.artistInfo) {
  console.log(`Artist country: ${enriched.artistInfo.country}`);
}
if (enriched.releaseInfo) {
  console.log(`Album art: ${enriched.releaseInfo.coverArtUrl}`);
}
```

**Returns:** `EnrichedTrack` with additional metadata fields

#### `fuzzyMatchTrack(track: TrackInfo): Promise<EnrichedTrack>`

Attempts fuzzy matching for tracks with imperfect metadata. Currently just calls `enrichTrack` but the interface exists for future improvements.

```typescript
const matched = await mb.fuzzyMatchTrack(localTrack);
```

#### `searchRecordingsByCriteria(criteria: object): Promise<Array>`

**NEW in v0.2.0:** Advanced search using MusicBrainz criteria like instruments, band members, and tags.

```typescript
// Search by instrument
const recordings = await mb.searchRecordingsByCriteria({
  instrument: 'violin',
  artist: 'Led Zeppelin'
});

// Search by band member
const tracks = await mb.searchRecordingsByCriteria({
  bandMember: 'John Bonham'
});

// Search by tag
const tagged = await mb.searchRecordingsByCriteria({
  tag: 'progressive rock'
});
```

**Parameters:**
- `criteria.artist` (string, optional): Filter by artist name
- `criteria.instrument` (string, optional): Find tracks featuring this instrument
- `criteria.bandMember` (string, optional): Find tracks by this band member/performer
- `criteria.tag` (string, optional): Filter by MusicBrainz tag

**Returns:** Array of recording objects with title, artist, and releaseId

**Use case:** Building sophisticated playlists like "rock music with violins" or "tracks featuring specific drummers"

#### `getArtistDetails(artistId: string): Promise<object | null>`

**NEW in v0.2.0:** Fetches detailed artist information including band members and tags.

```typescript
const details = await mb.getArtistDetails('artist-mbid-here');
if (details) {
  console.log(`Artist: ${details.info.name}`);
  
  if (details.members) {
    details.members.forEach(member => {
      console.log(`${member.name}: ${member.instrument}`);
    });
  }
  
  if (details.tags) {
    console.log(`Tags: ${details.tags.join(', ')}`);
  }
}
```

**Returns:** Object containing:
- `info`: Full `ArtistInfo` object
- `members`: Array of band members with their instruments
- `tags`: Array of genre/style tags

**Use case:** Finding all members of a band, checking what instrument someone plays, or discovering an artist's genre classifications

#### `clearCache(): void`

Clears all cached metadata. Use this if you need fresh data.

```typescript
mb.clearCache();
```

### Rate Limiting

The client automatically enforces MusicBrainz's rate limit of 1 request per second. No action needed on your part.

---

## AlbumArtManager

Displays album art using Überzug++ or provides ASCII art fallback.

### Constructor

```typescript
new AlbumArtManager()
```

### Methods

#### `initialize(): Promise<void>`

Checks for Überzug++ availability and starts the display process.

```typescript
const artManager = new AlbumArtManager();
await artManager.initialize();

if (artManager.isAvailable()) {
  console.log('Album art display ready');
}
```

#### `displayArt(imageSource: string, config: ArtDisplayConfig): Promise<boolean>`

Displays an image in the terminal. Accepts local file paths or HTTP(S) URLs.

```typescript
const displayed = await artManager.displayArt(
  'https://example.com/cover.jpg',
  {
    x: 2,
    y: 2,
    width: 30,
    height: 15
  }
);
```

**Parameters:**
- `imageSource` (string): File path or URL
- `config`: Display configuration
  - `x` (number): Column position
  - `y` (number): Row position
  - `width` (number): Width in terminal cells
  - `height` (number): Height in terminal cells

**Returns:** `true` if successfully displayed, `false` otherwise

#### `hideArt(): Promise<void>`

Hides the currently displayed album art.

```typescript
await artManager.hideArt();
```

#### `generateAsciiArt(title: string, artist: string): string`

Generates ASCII art for terminals that don't support Überzug++.

```typescript
const ascii = artManager.generateAsciiArt('Kind of Blue', 'Miles Davis');
console.log(ascii);
```

Returns a bordered box with centered title and artist text.

#### `isAvailable(): boolean`

Checks if Überzug++ is available.

```typescript
if (!artManager.isAvailable()) {
  console.log('Using ASCII fallback');
}
```

#### `cleanup(): Promise<void>`

Cleans up resources and stops the Überzug++ process.

```typescript
await artManager.cleanup();
```

Always call this before your application exits.

---

## Tool Schemas

The AI agent uses these tools to control music playback. Each schema is defined with Zod and converted to JSON Schema for the AI provider.

### search_music

Searches the music library.

**Schema:**
```typescript
{
  query: string;        // Search term
  type: 'artist' | 'album' | 'title' | 'any';
}
```

**Example:**
```typescript
{
  query: 'miles davis',
  type: 'artist'
}
```

### play_music

Plays music immediately.

**Schema:**
```typescript
{
  query?: string;       // What to play
  position?: number;    // Queue position
}
```

**Example:**
```typescript
{ query: 'kind of blue' }
{ position: 3 }
```

### queue_music

Adds music to the queue.

**Schema:**
```typescript
{
  query: string;            // What to add
  position: 'end' | 'next'; // Where to add (default: 'end')
}
```

### control_playback

Controls playback state.

**Schema:**
```typescript
{
  action: 'play' | 'pause' | 'stop' | 'next' | 'previous' | 'toggle';
}
```

### set_volume

Adjusts volume level.

**Schema:**
```typescript
{
  volume: number;  // 0-100
}
```

### toggle_setting

Toggles playback options.

**Schema:**
```typescript
{
  setting: 'repeat' | 'random' | 'single' | 'consume';
}
```

### get_queue

Retrieves the current queue.

**Schema:**
```typescript
{
  limit?: number;  // Max items to return
}
```

### clear_queue

Clears the playback queue.

**Schema:**
```typescript
{
  confirm: boolean;  // Safety confirmation (default: true)
}
```

### generate_playlist *NEW in v0.2.0*

Generates an AI-curated playlist based on criteria.

**Schema:**
```typescript
{
  criteria: string;          // Playlist criteria: mood, genre, energy, theme, or activity
  targetLength?: number;     // Desired number of tracks (default: 20)
  shuffleResults?: boolean;  // Shuffle the generated playlist
}
```

**Example:**
```typescript
{
  criteria: 'relaxing jazz for studying',
  targetLength: 30,
  shuffleResults: false
}
```

The AI analyzes your library, searches for tracks matching the criteria, and returns a curated playlist. Works best with well-tagged music files.

**Criteria examples:**
- Mood: `'relaxing'`, `'upbeat'`, `'melancholy'`, `'energetic'`
- Genre: `'jazz'`, `'rock'`, `'classical'`, `'electronic'`
- Activity: `'workout'`, `'study'`, `'party'`, `'dinner'`
- Energy: `'high-energy'`, `'chill'`, `'mellow'`, `'intense'`
- Theme: `'90s nostalgia'`, `'summer vibes'`, `'rainy day'`

---

## Type Definitions

### MPD Types

#### TrackInfo

Metadata for a music track.

```typescript
interface TrackInfo {
  file: string;           // File path or URI
  title?: string;         // Track title
  artist?: string;        // Track artist
  album?: string;         // Album name
  albumArtist?: string;   // Album artist
  track?: string;         // Track number
  date?: string;          // Release date
  genre?: string;         // Genre
  time?: number;          // Duration in seconds
  pos?: number;           // Position in queue
  id?: number;            // MPD track ID
}
```

#### PlayerStatus

Current player state.

```typescript
interface PlayerStatus {
  state: 'play' | 'pause' | 'stop';
  volume: number;         // 0-100
  repeat: boolean;
  random: boolean;
  single: boolean;
  consume: boolean;
  song?: number;          // Current queue position
  songid?: number;        // Current song ID
  elapsed?: number;       // Seconds elapsed
  duration?: number;      // Track duration
  bitrate?: number;       // Current bitrate
}
```

### Metadata Types

#### ArtistInfo

Artist metadata from MusicBrainz.

```typescript
interface ArtistInfo {
  id: string;                    // MusicBrainz ID
  name: string;                  // Artist name
  sortName?: string;             // Sort name
  disambiguation?: string;       // Disambiguation text
  type?: string;                 // Person, Group, etc.
  gender?: string;
  country?: string;
  lifeSpan?: {
    begin?: string;              // Birth/formation date
    end?: string;                // Death/dissolution date
  };
}
```

#### ReleaseInfo

Album/release metadata.

```typescript
interface ReleaseInfo {
  id: string;                    // MusicBrainz release ID
  title: string;                 // Album title
  date?: string;                 // Release date
  country?: string;              // Release country
  barcode?: string;
  status?: string;               // Official, Bootleg, etc.
  artistCredit?: Array<{
    name: string;
    artist: ArtistInfo;
  }>;
  coverArtUrl?: string;          // Cover art URL
}
```

#### EnrichedTrack

Track with additional metadata.

```typescript
interface EnrichedTrack extends TrackInfo {
  artistInfo?: ArtistInfo;
  releaseInfo?: ReleaseInfo;
}
```

### AI Types

#### AIProviderConfig

Configuration for AI providers.

```typescript
interface AIProviderConfig {
  provider: 'openrouter' | 'anthropic' | 'ollama';
  apiKey?: string;
  baseURL?: string;
  model?: string;
}
```

#### AIMessage

Message in conversation history.

```typescript
interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

#### ToolCall

Tool invocation from AI.

```typescript
interface ToolCall {
  name: string;        // Tool name
  arguments: any;      // Tool arguments object
}
```

#### AIResponse

Response from AI provider.

```typescript
interface AIResponse {
  message: string;         // AI's text response
  toolCalls?: ToolCall[];  // Requested tool calls
}
```

### Album Art Types

#### ArtDisplayConfig

Configuration for displaying album art.

```typescript
interface ArtDisplayConfig {
  x: number;       // Column position
  y: number;       // Row position
  width: number;   // Width in cells
  height: number;  // Height in cells
}
```

---

## Error Handling

All modules handle errors internally and provide graceful degradation.

### MPDClient Errors

Connection errors don't crash the application. The client attempts automatic reconnection every 5 seconds.

```typescript
try {
  await client.connect();
} catch (error) {
  console.error('Connection failed:', error.message);
  // Client will retry automatically
}
```

Methods return `null` or empty arrays when disconnected:

```typescript
const track = await client.getCurrentSong();  // Returns null if disconnected
const queue = await client.getQueue();        // Returns [] if disconnected
```

### AIAgent Errors

Provider errors throw exceptions. Wrap calls in try-catch:

```typescript
try {
  const response = await agent.processCommand('play jazz');
} catch (error) {
  console.error('AI request failed:', error.message);
}
```

### MusicBrainzClient Errors

API errors are logged but methods return `null` gracefully:

```typescript
const artist = await mb.searchArtist('Unknown');  // Returns null if not found
```

Rate limiting happens automatically. No need to handle it yourself.

### AlbumArtManager Errors

If Überzug++ isn't available, methods fail silently. Check availability first:

```typescript
if (artManager.isAvailable()) {
  await artManager.displayArt(url, config);
} else {
  // Use ASCII fallback
  const ascii = artManager.generateAsciiArt(title, artist);
  console.log(ascii);
}
```

### Type Guards

The MPD client uses type guards to validate API responses:

```typescript
function isTrackInfo(obj: unknown): obj is TrackInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'file' in obj &&
    typeof obj.file === 'string'
  );
}
```

This protects against malformed responses from the MPD server.

---

## Usage Examples

### Basic Music Player

```typescript
import { MPDClient } from './mpd/client';

const client = new MPDClient();
await client.connect();

// Play the first song in the queue
await client.play(0);

// Volume controls
await client.setVolume(50);

// Get current status
const status = await client.getStatus();
console.log(`Playing: ${status.state}, Volume: ${status.volume}%`);

// Clean up
client.disconnect();
```

### AI-Controlled Playback

```typescript
import { AIAgent } from './ai/agent';
import { MPDClient } from './mpd/client';

const agent = new AIAgent({ provider: 'ollama' });
const client = new MPDClient();
await client.connect();

// Process natural language command
const response = await agent.processCommand('play some jazz');

if (response.toolCalls) {
  for (const call of response.toolCalls) {
    if (call.name === 'search_music') {
      const results = await client.search(
        call.arguments.type,
        call.arguments.query
      );
      console.log(`Found ${results.length} tracks`);
    }
  }
}
```

### Metadata Enrichment

```typescript
import { MPDClient } from './mpd/client';
import { MusicBrainzClient } from './metadata/musicbrainz';

const mpd = new MPDClient();
const mb = new MusicBrainzClient();

await mpd.connect();
const track = await mpd.getCurrentSong();

if (track) {
  const enriched = await mb.enrichTrack(track);
  
  if (enriched.releaseInfo?.coverArtUrl) {
    console.log(`Cover art: ${enriched.releaseInfo.coverArtUrl}`);
  }
  
  if (enriched.artistInfo?.country) {
    console.log(`Artist from: ${enriched.artistInfo.country}`);
  }
}
```

### Album Art Display

```typescript
import { AlbumArtManager } from './art/display';
import { MusicBrainzClient } from './metadata/musicbrainz';

const artManager = new AlbumArtManager();
const mb = new MusicBrainzClient();

await artManager.initialize();

// Get album info and display cover
const album = await mb.searchRelease('Kind of Blue', 'Miles Davis');

if (album?.coverArtUrl && artManager.isAvailable()) {
  await artManager.displayArt(album.coverArtUrl, {
    x: 2,
    y: 2,
    width: 30,
    height: 15
  });
} else {
  // Fallback to ASCII
  const ascii = artManager.generateAsciiArt(
    album?.title || 'Unknown',
    'Miles Davis'
  );
  console.log(ascii);
}

// Clean up when done
await artManager.cleanup();
```

### Complete Integration

```typescript
import { MPDClient } from './mpd/client';
import { AIAgent } from './ai/agent';
import { MusicBrainzClient } from './metadata/musicbrainz';
import { AlbumArtManager } from './art/display';

// Initialize all modules
const mpd = new MPDClient({ host: 'localhost', port: 6600 });
const agent = new AIAgent({ 
  provider: 'openrouter',
  apiKey: process.env.OPENROUTER_API_KEY 
});
const mb = new MusicBrainzClient();
const art = new AlbumArtManager();

// Connect everything
await mpd.connect();
await art.initialize();

// Process user command
const response = await agent.processCommand('play kind of blue');

// Execute tool calls
if (response.toolCalls) {
  for (const call of response.toolCalls) {
    switch (call.name) {
      case 'search_music':
        const results = await mpd.search(
          call.arguments.type,
          call.arguments.query
        );
        if (results.length > 0) {
          await mpd.addToQueue(results[0].file);
          await mpd.play();
        }
        break;
        
      case 'control_playback':
        if (call.arguments.action === 'pause') {
          await mpd.pause();
        }
        break;
    }
  }
}

// Enrich current track and display art
const track = await mpd.getCurrentSong();
if (track) {
  const enriched = await mb.enrichTrack(track);
  
  if (enriched.releaseInfo?.coverArtUrl) {
    await art.displayArt(enriched.releaseInfo.coverArtUrl, {
      x: 2, y: 2, width: 30, height: 15
    });
  }
}

// Clean up
mpd.disconnect();
await art.cleanup();
```

---

## Additional Notes

### Thread Safety

None of the modules are thread-safe. They're designed for single-threaded use in a terminal application.

### Memory Management

- MPDClient: Automatically manages reconnection timers
- AIAgent: Keeps only the last 10 messages in history
- MusicBrainzClient: Caches indefinitely (call `clearCache()` if needed)
- AlbumArtManager: Cleans up temp files automatically

### Performance Considerations

- MusicBrainz requests are rate-limited to 1/second
- MPD operations are generally fast (< 100ms)
- AI requests vary by provider (1-10 seconds typically)
- Album art downloads depend on network speed

### Environment Variables

The following environment variables are supported:

- `OPENROUTER_API_KEY`: OpenRouter API key
- `ANTHROPIC_API_KEY`: Anthropic API key

You can also pass these directly to the `AIAgent` constructor.
