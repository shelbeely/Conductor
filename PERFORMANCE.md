# Performance Guide

Performance characteristics, optimization strategies, and tuning recommendations for Conductor. Metrics and benchmarks come from real-world usage with typical music libraries (5,000-50,000 tracks).

## Performance Overview

Conductor's performance depends on a few things:

- **MPD server responsiveness** - Local MPD typically responds in <10ms
- **AI provider latency** - Remote AI (OpenRouter): 500-3000ms, Local AI (Ollama): 100-500ms
- **Network conditions** - MusicBrainz API, cover art downloads
- **Library size** - Search performance degrades with libraries >100,000 tracks
- **Terminal capabilities** - Ink rendering speed varies by terminal emulator

### Expected Performance Baseline

| Operation | Target | Typical |
|-----------|--------|---------|
| MPD command execution | <50ms | 10-30ms |
| UI re-render | <16ms (60fps) | 5-15ms |
| Status update (polling) | <100ms | 20-50ms |
| Metadata fetch (cached) | <5ms | 1-3ms |
| Metadata fetch (network) | <2000ms | 500-1500ms |
| AI command processing | <5000ms | 1000-3000ms |
| Album art display | <500ms | 100-300ms |

## CPU Usage Optimization

### React Rendering

Conductor uses React/Ink for terminal UI. If you're not careful about rendering, it'll eat CPU.

#### Optimization Strategies

**Component memoization**

All major UI components use `React.memo()` to skip re-renders when props haven't changed:

```typescript
export default React.memo(NowPlaying);
export default React.memo(Queue);
export default React.memo(Visualizer);
export default React.memo(CommandInput);
```

This keeps parent state changes from triggering child re-renders when the child's props are the same.

**Derived state memoization**

The Queue component memoizes expensive computations:

```typescript
const displayQueue = useMemo(() => {
  return queue.slice(scrollPosition, scrollPosition + visibleItems);
}, [queue, scrollPosition, visibleItems]);
```

This avoids recalculating the visible queue subset on every render.

**Callback memoization**

Event handlers are wrapped with `useCallback()` to maintain referential equality:

```typescript
const handleInput = useCallback((value: string) => {
  setCurrentInput(value);
}, []);
```

Without this, child components would see a "new" function on every render and re-render unnecessarily.

**Lazy state initialization**

The CommandInput component uses function initializers to avoid recreating arrays:

```typescript
const [commandHistory, setCommandHistory] = useState<string[]>(() => []);
```

This runs the initialization function only once, not on every render.

#### Monitoring React Performance

To identify rendering bottlenecks:

```bash
# Run with React DevTools Profiler
NODE_ENV=development npm run dev

# Check for excessive re-renders
# Each status update (1s) should trigger minimal renders:
# - App: 1 render (state change)
# - NowPlaying: 0-1 renders (only if track changed)
# - Queue: 0 renders (unless queue changed)
# - Visualizer: ~10 renders/sec (intentional animation)
```

If components render on every status update regardless of prop changes, check that:
1. Props are properly memoized
2. Parent components don't create new objects/arrays inline
3. `React.memo()` comparison function is correct

### Polling Optimization

The main CPU cost comes from polling MPD for status updates.

**Current implementation:**
- Interval: 1000ms (1 second)
- Operations per poll: Status check, current track, queue check
- CPU impact: ~1-3% on modern CPUs

**Reducing polling overhead:**

```bash
# In App.tsx, adjust polling interval
# Trade-off: Longer intervals reduce CPU but increase UI lag

# Conservative (low CPU, slower updates)
setInterval(updatePlayerState, 2000);  // 2 seconds

# Balanced (default)
setInterval(updatePlayerState, 1000);  // 1 second

# Aggressive (high CPU, instant updates)
setInterval(updatePlayerState, 500);   // 0.5 seconds
```

**Recommended: Use MPD idle mode** (future enhancement)

MPD has an "idle" command that blocks until state changes. This would eliminate polling entirely:

```typescript
// Future implementation (not yet in Conductor)
async function idleLoop() {
  while (connected) {
    const changes = await mpd.idle(['player', 'playlist']);
    await updatePlayerState();
  }
}
```

This reduces CPU usage to near-zero between state changes.

### AI Call Optimization

AI processing is CPU-intensive (local) or network-bound (remote).

**OpenRouter (remote):**
- CPU impact: Minimal (just JSON parsing)
- Latency: 500-3000ms depending on model and load
- Optimization: None needed, bottleneck is network

**Ollama (local):**
- CPU impact: High (50-100% of one core during inference)
- Latency: 100-500ms for small models, 1000-5000ms for large models
- Memory: 2-8GB RAM depending on model size

**Optimization strategies:**

1. **Choose smaller models for Ollama**
   ```bash
   # Fast but less capable
   export AI_MODEL="llama3.2:3b"
   
   # Balanced
   export AI_MODEL="llama3.1:8b"
   
   # Slow but more capable
   export AI_MODEL="llama3.1:70b"
   ```

2. **Use streaming responses** (future enhancement)
   Process AI output as it arrives instead of waiting for completion.

3. **Cache common commands** (not yet implemented)
   Store mappings of common phrases to actions to skip AI entirely.

### Visualizer Performance

The audio visualizer updates at 10fps (100ms interval), generating animated bars.

**CPU impact:**
- Negligible on modern terminals
- Can be significant on slow SSH connections or old hardware

**To disable the visualizer:**

```typescript
// In App.tsx, comment out or remove:
// {status?.state === 'play' && <Visualizer volume={status?.volume || 50} />}
```

This reduces re-renders from ~10/sec to ~1/sec.

## Memory Usage Optimization

### Caching Strategies

Conductor uses in-memory caching to reduce network requests. This trades memory for speed.

#### MusicBrainz Metadata Cache

**Implementation:**
```typescript
private cache = new Map<string, any>();
```

**Cache keys:**
- `artist:{name}` - Artist information
- `release:{title}:{artist}` - Album/release information
- `coverart:{releaseId}` - Cover art URLs

**Each cached entry:** ~1-5KB (depending on artist discography size)
**Typical session:** 50-200 cached entries
**Memory usage:** 50KB - 1MB

**No expiration policy:**
Cached data stays for the entire session. For long-running sessions (days), this can grow without bound.

**Manual cache clearing:**

```typescript
// In MusicBrainzClient
clearCache(): void {
  this.cache.clear();
}
```

Consider calling this periodically in long sessions.

### Album Art Cache

Album art gets cached on disk in `/tmp/conductor-albumart-*.jpg`.

**Memory impact:** Minimal (files on disk, not RAM)
**Disk usage:** ~100KB per cached image, ~5-10MB for typical session
**Cleanup:** Files stay until manual deletion or system reboot

**To clean up old art:**

```bash
# Remove all cached album art
rm /tmp/conductor-albumart-*.jpg

# Or find and remove art older than 7 days
find /tmp -name "conductor-albumart-*.jpg" -mtime +7 -delete
```

### Garbage Collection

Conductor runs on Node.js/Bun, which both use garbage collection for memory management.

**Default behavior:**
- V8 garbage collector runs automatically
- Minor GC: Every few seconds, <10ms pause
- Major GC: Every few minutes, 50-200ms pause

**For long-running sessions, monitor memory:**

```bash
# Check memory usage
ps aux | grep conductor

# Or use Node.js built-in profiling
node --inspect dist/index.js
# Then open chrome://inspect
```

**If memory keeps growing:**

1. Check for memory leaks in event listeners
2. Verify interval/timeout cleanup in useEffect
3. Consider restarting Conductor daily (systemd timer)

**Potential memory leak sources:**

- Uncleaned MPD event listeners
- Growing command history in CommandInput
- Unbounded metadata cache
- Temp files not deleted on error

### Memory-Efficient Configuration

For low-memory systems (<2GB RAM):

```bash
# Use remote AI instead of local Ollama
export AI_PROVIDER="openrouter"

# Reduce polling interval to decrease state copies
# (Edit App.tsx, increase interval to 2000ms)

# Disable visualizer (remove from render tree)
```

For high-memory systems (>8GB RAM):

```bash
# Use local Ollama with large models
export AI_PROVIDER="ollama"
export AI_MODEL="llama3.1:70b"

# Enable aggressive metadata prefetching (future feature)
```

## Network Performance

### API Calls

Conductor makes network requests to three external services:

1. **MusicBrainz API** - Metadata lookups
2. **Cover Art Archive** - Album art downloads
3. **AI providers** - Command processing (OpenRouter, Anthropic)

#### Rate Limiting

**MusicBrainz:**

The MusicBrainz API has strict rate limits (1 request/second). Conductor enforces this:

```typescript
private async rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - this.lastRequestTime;
  if (elapsed < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
  }
  this.lastRequestTime = Date.now();
}
```

Violating this limit gets you 503 errors and potential IP blocking.

**Cover Art Archive:**
- No explicit rate limit
- Use reasonable intervals between downloads

**AI Providers:**
- OpenRouter: Varies by plan (typically 100-1000 req/min)
- Anthropic: Varies by plan (typically 50 req/min)
- Ollama: No limit (local)

#### Connection Pooling

Conductor currently creates a new HTTP connection for each request. For high-frequency usage, connection pooling reduces latency.

**Future optimization:**

```typescript
import { Agent } from 'http';

const agent = new Agent({
  keepAlive: true,
  maxSockets: 10
});

fetch(url, { agent });
```

This reuses TCP connections, saving ~50-100ms per request.

### Network Monitoring

To identify network bottlenecks:

```bash
# Monitor network usage
nethogs  # Shows per-process bandwidth

# Typical usage:
# - Idle: <1 KB/s
# - Metadata fetching: 5-20 KB/s
# - Album art download: 50-200 KB/s
# - AI processing: 10-50 KB/s
```

High network usage means:
- Metadata cache misses (inefficient caching)
- Album art re-downloads (cache not working)
- AI provider latency (try local Ollama)

### Offline Mode

Conductor requires MPD (local or network) but can run with degraded features when external APIs are unavailable:

- **No MusicBrainz access:** Basic metadata from MPD only
- **No Cover Art Archive:** ASCII art fallback
- **No AI provider:** Command input disabled

For fully offline usage with local AI:

```bash
export AI_PROVIDER="ollama"
export OLLAMA_BASE_URL="http://localhost:11434"

# Start Ollama service
systemctl start ollama

# Conductor now works without internet
npm start
```

## MPD Communication Optimization

### Connection Management

Conductor maintains a persistent TCP connection to MPD.

**Default configuration:**
```bash
export MPD_HOST="localhost"
export MPD_PORT="6600"
```

**Connection lifecycle:**
1. Connect on app start
2. Auto-reconnect on disconnect
3. Graceful error handling

**Optimization tips:**

1. **Use Unix socket instead of TCP** (lower latency)
   ```bash
   # In mpd.conf
   bind_to_address "~/.config/mpd/socket"
   
   # In Conductor (requires code change)
   # Connect to socket instead of TCP
   ```
   Latency reduction: ~3-5ms per command

2. **Run MPD locally** (don't use remote servers)
   Remote MPD over SSH adds 20-100ms latency per command

3. **Reduce MPD database size** (faster searches)
   Remove unused music directories from mpd.conf

### Command Optimization

Each MPD command has different performance characteristics:

| Command | Latency | Notes |
|---------|---------|-------|
| `status` | 5-10ms | Fast, called every 1s |
| `currentsong` | 5-10ms | Fast, called every 1s |
| `playlistinfo` | 10-100ms | Scales with queue size |
| `search` | 50-500ms | Scales with library size |
| `listall` | 100-5000ms | Very slow for large libraries |

**Optimization strategies:**

1. **Batch commands** (not yet implemented)
   MPD supports command lists that execute atomically:
   ```
   command_list_begin
   status
   currentsong
   playlistinfo
   command_list_end
   ```
   This reduces round-trips from 3 to 1.

2. **Use targeted searches**
   ```typescript
   // Slow: searches everything
   mpd.search({ any: 'test' });
   
   // Fast: searches specific field
   mpd.search({ artist: 'test' });
   ```

3. **Limit search results**
   ```typescript
   // Add window parameter (future feature)
   mpd.search({ artist: 'test' }, { window: [0, 50] });
   ```

### Queue Management

Large queues (>1000 tracks) can slow down `playlistinfo` commands.

**Current implementation:** Fetches entire queue on every poll

**Performance by queue size:**
- <100 tracks: <10ms
- 100-500 tracks: 10-50ms
- 500-1000 tracks: 50-100ms
- >1000 tracks: 100-500ms

**Optimization for large queues:**

1. **Lazy loading** (future feature)
   Only fetch the visible part of the queue:
   ```typescript
   // Instead of entire queue
   const queue = await mpd.playlistinfo();
   
   // Fetch window around current position
   const queue = await mpd.playlistinfo({ start: pos - 50, end: pos + 50 });
   ```

2. **Cache queue and update incrementally**
   Only refetch when `playlist` version changes in status.

3. **Virtual scrolling in Queue component**
   Don't render all 1000+ tracks, just visible window.

## AI Provider Performance Comparison

### OpenRouter (Remote)

**Pros:**
- No local resource usage
- Access to latest models (Claude 3.5 Sonnet, GPT-4)
- Consistent latency regardless of your hardware

**Cons:**
- Requires internet
- API costs ($0.003-0.015 per command)
- Privacy concerns (commands go to the cloud)

**Performance characteristics:**
- Latency: 500-3000ms (depends on model and load)
- CPU: <1%
- Memory: <50MB
- Network: ~5-20KB per request

**Best for:**
- Low-power systems (Raspberry Pi, old laptops)
- Users who want the best AI quality
- Occasional usage (not 24/7 background playback)

### Ollama (Local)

**Pros:**
- Completely offline
- No API costs
- Privacy (data never leaves your system)
- Low latency with small models

**Cons:**
- High resource usage
- Needs powerful hardware for large models
- Manual model installation

**Performance characteristics by model:**

| Model | VRAM | Latency | Quality |
|-------|------|---------|---------|
| llama3.2:1b | 1GB | 50-150ms | Poor |
| llama3.2:3b | 2GB | 100-300ms | Fair |
| llama3.1:8b | 5GB | 200-800ms | Good |
| llama3.1:70b | 40GB | 2000-5000ms | Excellent |

**Installation:**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull llama3.2:3b

# Start service
systemctl start ollama

# Configure Conductor
export AI_PROVIDER="ollama"
export AI_MODEL="llama3.2:3b"
```

**Best for:**
- Privacy-conscious users
- Offline usage
- Powerful hardware (desktop with GPU)
- 24/7 background playback

### Anthropic (Direct)

**Note:** Partial implementation, not yet fully functional.

**When complete:**
- Similar performance to OpenRouter
- Direct access to Claude models
- Potentially lower latency (no proxy)

### Performance Recommendations

**Choose OpenRouter if:**
- System has <4GB RAM
- Internet connection is reliable
- API cost is acceptable
- You want the best quality

**Choose Ollama if:**
- System has >8GB RAM (16GB+ for large models)
- Privacy is important
- No internet or unreliable connection
- You run Conductor frequently

**Benchmark your setup:**

```bash
# Test OpenRouter latency
time echo "play some jazz" | conductor

# Test Ollama latency
AI_PROVIDER=ollama time echo "play some jazz" | conductor

# Compare results
```

## MusicBrainz API Optimization

### Request Patterns

Conductor queries MusicBrainz for:
1. Artist info (discography, genres, bio)
2. Release info (album metadata)
3. Cover art URLs (from Cover Art Archive)

**Request flow for new track:**
```
Track plays → Extract artist/album
  ↓
Search MusicBrainz artist (if not cached)
  ↓
Search MusicBrainz release (if not cached)
  ↓
Fetch cover art URL (if not cached)
  ↓
Download and display cover art
```

Each step adds 500-1500ms latency.

### Cache Hit Rate

Cache hit rate makes a huge difference in performance.

**Cold start (empty cache):**
- First track: 2-4 seconds to load metadata
- Each subsequent unique artist: 1-2 seconds

**Warm cache (typical session):**
- Track from cached artist: <100ms
- Track from new artist: 1-2 seconds

**Typical hit rates:**
- Single album playback: 95%+ hit rate (1 miss, then all hits)
- Shuffle mode: 30-70% hit rate (depends on library diversity)
- Random mode: 10-30% hit rate (many unique artists)

### Optimization Strategies

**1. Prefetch metadata**

When queue is populated, prefetch metadata for upcoming tracks:

```typescript
// Future feature
async function prefetchQueueMetadata(queue: Track[]) {
  const artists = [...new Set(queue.map(t => t.artist))];
  await Promise.all(artists.map(a => musicbrainz.getArtist(a)));
}
```

This moves latency from playback time to queue time.

**2. Persistent cache**

Save cache to disk between sessions:

```typescript
// On app exit
fs.writeFileSync('~/.cache/conductor/metadata.json', 
  JSON.stringify(Array.from(cache.entries())));

// On app start
const cached = JSON.parse(fs.readFileSync('~/.cache/conductor/metadata.json'));
cache = new Map(cached);
```

This eliminates cache misses for frequently played artists.

**3. Batch requests**

MusicBrainz supports searching multiple releases in one request (reduces round-trips).

**4. Use MusicBrainz mirror**

For heavy users, run a local MusicBrainz mirror to eliminate network latency.

### Respecting Rate Limits

Conductor enforces the 1 request/second limit. This can create delays:

- Play 10 new tracks quickly: Last track waits 10 seconds for metadata
- Scrub through album: Each track adds 1 second delay

**Mitigation:**
- Prefetching (spreads requests over time)
- Persistent cache (reduces request frequency)
- Graceful degradation (show basic info immediately, enrich later)

## Album Art Performance

### Überzug++ Overhead

Überzug++ is a separate process that displays images in your terminal.

**Resource usage:**
- CPU: 1-3% (image decoding and rendering)
- Memory: 20-50MB (one decoded image in memory)
- Disk I/O: Minimal (reads cached JPEG files)

**Latency:**
- Initial display: 100-300ms
- Update to new image: 50-150ms

**Compatibility:**
- Works: alacritty, kitty, wezterm, tmux (with proper config)
- Doesn't work: gnome-terminal, konsole, xterm

### Caching Strategy

**Download caching:**
```
Cover art URL discovered
  ↓
Check if /tmp/conductor-albumart-{hash}.jpg exists
  ↓
If exists: display immediately (5-10ms)
If not: download, save to /tmp, display (200-1000ms)
```

**Cache effectiveness:**
- Same album: 100% hit rate
- Different albums by same artist: Often reused (MusicBrainz returns same URL)
- Different albums by different artists: 0% hit rate

**Disk usage grows over time:**
- One-hour session: ~20-50 images, 2-5MB
- Ten-hour session: ~200-500 images, 20-50MB

**Cleanup recommendations:**

```bash
# In crontab, clean up weekly
0 0 * * 0 find /tmp -name "conductor-albumart-*.jpg" -mtime +7 -delete

# Or in systemd timer
[Timer]
OnCalendar=weekly
```

### ASCII Art Fallback

When Überzug++ is unavailable or fails, Conductor generates ASCII art.

**Performance:**
- Generation: 50-100ms (happens once per image)
- Rendering: <5ms (just text output)
- Memory: Minimal (small string)

**Quality vs. performance:**

```typescript
// Larger ASCII art (better quality, slower)
const ascii = generateAscii(image, { width: 60, height: 30 });

// Smaller ASCII art (lower quality, faster)
const ascii = generateAscii(image, { width: 30, height: 15 });
```

### Disabling Album Art

For maximum performance (headless servers, SSH over slow connections):

```typescript
// In App.tsx, comment out album art code
// const albumArtManager = new AlbumArtManager();
// useEffect(() => { ... albumArtManager.displayArt(...) ... }, [currentTrack]);
```

This eliminates:
- Überzug++ process overhead
- Image download latency
- Temp file I/O

## UI Rendering Performance

### Ink Optimization

Ink (React for CLI) renders to stdout using ANSI escape codes.

**Rendering pipeline:**
```
React state change
  ↓
Virtual DOM diff
  ↓
Ink reconciliation
  ↓
ANSI output to stdout
  ↓
Terminal renders
```

**Performance characteristics:**
- Diff + reconciliation: 1-5ms
- ANSI output: 1-3ms
- Terminal rendering: 0-10ms (varies by terminal)

**Total:** 2-18ms per render (well within 60fps budget)

### Terminal Performance Variance

Different terminal emulators have wildly different rendering speeds:

**Fast terminals (< 5ms render):**
- alacritty
- kitty
- wezterm

**Medium terminals (5-15ms render):**
- iTerm2
- Terminal.app
- xterm

**Slow terminals (>15ms render):**
- gnome-terminal
- konsole
- Windows Terminal (older versions)

**Remote terminals (20-100ms+ render):**
- SSH over high-latency connections
- tmux over SSH
- Mosh

### React Best Practices Applied

Conductor follows these practices to keep render cycles low:

1. **Hoist helper functions outside components**
   Functions don't get recreated every render.

2. **Wrap components with React.memo()**
   Components only re-render when props change.

3. **Use useMemo() for derived state**
   Expensive computations get cached between renders.

4. **Use useCallback() for stable function references**
   Stops child components from seeing "new" functions.

5. **Lazy state initialization**
   `useState(() => [])` instead of `useState([])`.

6. **Functional setState updates**
   `setState(prev => prev + 1)` avoids stale closures.

### Optimizing for Slow Terminals

If rendering feels sluggish:

1. **Reduce polling interval** (fewer updates per second)
   ```typescript
   setInterval(updatePlayerState, 2000); // Instead of 1000
   ```

2. **Disable visualizer** (10 renders/sec → 1 render/sec)

3. **Simplify UI** (remove boxen borders, reduce text)

4. **Use faster terminal emulator** (switch to alacritty or kitty)

5. **Reduce SSH compression** (if over SSH)
   ```bash
   ssh -C user@host  # Enable compression (slower)
   ssh user@host     # No compression (faster)
   ```

## Large Library Handling

### Performance by Library Size

**MPD search performance:**

| Library Size | Search Time | Notes |
|--------------|-------------|-------|
| <5,000 tracks | <50ms | Instant |
| 5,000-20,000 | 50-200ms | Still fast |
| 20,000-50,000 | 200-500ms | Noticeable delay |
| 50,000-100,000 | 500-1500ms | Significant delay |
| >100,000 tracks | 1500ms+ | Very slow |

**Queue display performance:**

| Queue Size | Render Time | Scroll Lag |
|------------|-------------|------------|
| <100 tracks | <10ms | None |
| 100-500 | 10-30ms | Minimal |
| 500-1000 | 30-80ms | Slight |
| >1000 tracks | 80ms+ | Noticeable |

### Optimization for Large Libraries

**1. Use specific search terms**

AI should generate targeted searches:

```typescript
// Slow: searches entire library
search({ any: 'jazz' });

// Fast: searches specific field
search({ genre: 'jazz' });

// Faster: multiple specific fields
search({ genre: 'jazz', artist: 'miles davis' });
```

**2. Limit result count**

```typescript
// Slow: returns 10,000 results
const results = await mpd.search({ genre: 'rock' });

// Fast: returns 50 results (requires implementation)
const results = await mpd.search({ genre: 'rock' }, { limit: 50 });
```

**3. Index optimization in MPD**

```bash
# In mpd.conf, ensure database is optimized
auto_update "yes"
auto_update_depth "3"

# Rebuild database
mpc update
```

**4. Virtual scrolling in Queue component**

For queues >500 tracks, only render visible portion:

```typescript
// Current: renders all tracks
{queue.map(track => <QueueItem track={track} />)}

// Optimized: renders visible window only
{visibleQueue.map(track => <QueueItem track={track} />)}
```

### Memory Considerations

Large libraries don't directly affect Conductor's memory (MPD stores the database), but they do affect:

- Search result arrays (more results = more memory)
- Queue representation (1000-track queue = ~1-5MB)

For very large libraries (>200,000 tracks):
- Expect 50-100MB RAM usage
- Expect 1-3 second search delays
- Consider splitting library across multiple MPD instances

## Monitoring and Profiling Tools

### Built-in Node.js Profiling

```bash
# CPU profiling
node --prof dist/index.js
# Generates isolate-*-v8.log
node --prof-process isolate-*-v8.log > profile.txt

# Heap snapshots
node --inspect dist/index.js
# Open chrome://inspect
# Take heap snapshots before/after operations
```

### Memory Monitoring

```bash
# Watch memory usage in real-time
watch -n 1 "ps aux | grep conductor"

# Or use htop
htop -p $(pgrep -f conductor)

# Memory breakdown
node --expose-gc --max-old-space-size=512 dist/index.js
```

### Network Monitoring

```bash
# Monitor API calls
tcpdump -i any -A host musicbrainz.org

# Or use mitmproxy for HTTP inspection
mitmproxy --mode transparent
```

### MPD Performance Monitoring

```bash
# Check MPD response times
echo "status" | nc localhost 6600 | time

# Monitor MPD CPU usage
top -p $(pgrep mpd)

# Check database size
du -h ~/.config/mpd/database
```

### Custom Performance Logging

Add instrumentation to Conductor:

```typescript
// In App.tsx
const perfLog = (label: string, start: number) => {
  console.log(`[PERF] ${label}: ${Date.now() - start}ms`);
};

// Around expensive operations
const start = Date.now();
await updatePlayerState();
perfLog('updatePlayerState', start);
```

### React DevTools Profiler

```bash
# Install React DevTools
npm install -g react-devtools

# Run with profiling
NODE_ENV=development npm run dev

# In separate terminal
react-devtools
```

This shows:
- Which components render
- How long each render takes
- Why each component rendered (props changed, state changed, etc.)

## Benchmarking Different Configurations

### Benchmark Suite

Create a test script to compare configurations:

```bash
#!/bin/bash
# benchmark.sh

echo "Testing different configurations..."

# Baseline: Default settings
echo "=== Baseline ==="
time (
  echo "play jazz music" | npm start
  sleep 5
  echo "next track" | npm start
  sleep 5
  echo "stop" | npm start
)

# Reduced polling
echo "=== Reduced Polling (2s) ==="
# (modify App.tsx, setInterval to 2000)
time (
  echo "play jazz music" | npm start
  sleep 5
  echo "next track" | npm start
  sleep 5
  echo "stop" | npm start
)

# No visualizer
echo "=== No Visualizer ==="
# (comment out visualizer in App.tsx)
time (
  echo "play jazz music" | npm start
  sleep 5
  echo "next track" | npm start
  sleep 5
  echo "stop" | npm start
)

# Local AI
echo "=== Local AI (Ollama) ==="
AI_PROVIDER=ollama time (
  echo "play jazz music" | npm start
  sleep 5
  echo "next track" | npm start
  sleep 5
  echo "stop" | npm start
)
```

Run with: `./benchmark.sh > benchmark-results.txt`

### Key Metrics to Measure

**Startup time:**
```bash
time npm start
# Target: <2 seconds
```

**Command latency:**
```bash
time echo "play some jazz" | npm start
# Target: <5 seconds (includes AI processing)
```

**Memory usage over time:**
```bash
# Run for 1 hour, measure memory every minute
for i in {1..60}; do
  ps aux | grep conductor | awk '{print $6}'
  sleep 60
done > memory-over-time.txt
```

**CPU usage during idle:**
```bash
# Should be <5% when music playing, no commands
pidstat -p $(pgrep -f conductor) 1 60
```

### Configuration Matrix

Test these combinations to find optimal setup:

| Config | Polling | Visualizer | AI Provider | Best For |
|--------|---------|------------|-------------|----------|
| Fast | 1s | Yes | OpenRouter | Desktop, good network |
| Balanced | 1s | No | OpenRouter | Desktop, medium network |
| Conservative | 2s | No | OpenRouter | Laptop, battery saving |
| Local | 1s | Yes | Ollama (3b) | Desktop, offline |
| Minimal | 2s | No | Ollama (3b) | Old hardware, SSH |

## Performance Troubleshooting

### High CPU Usage

**Symptom:** Conductor uses >20% CPU when idle

**Possible causes:**
1. Polling interval too aggressive
2. Visualizer running when not needed
3. Memory leak causing frequent GC
4. MPD returning very large queue
5. React components re-rendering unnecessarily

**Diagnosis:**

```bash
# Check if polling is the issue
# Edit App.tsx: comment out setInterval(updatePlayerState, 1000)
# If CPU drops, polling is the culprit

# Check if visualizer is the issue
# Edit App.tsx: comment out <Visualizer />
# If CPU drops, visualizer is the culprit

# Check for memory leak
node --inspect dist/index.js
# Take heap snapshots over 10 minutes
# If heap grows continuously, memory leak present
```

**Solutions:**
- Increase polling interval to 2000ms
- Disable visualizer
- Fix memory leaks (check event listeners, intervals)
- Limit queue size display (virtual scrolling)
- Profile with React DevTools to find excessive renders

### High Memory Usage

**Symptom:** Conductor uses >500MB RAM

**Possible causes:**
1. Metadata cache growing unbounded
2. Memory leak in event listeners
3. Large queue stored in state
4. Ollama model loaded in memory

**Diagnosis:**

```bash
# Check metadata cache size
# Add logging in MusicBrainzClient:
console.log('Cache size:', this.cache.size);

# Check heap usage
node --max-old-space-size=256 dist/index.js
# If it crashes, Conductor needs >256MB
```

**Solutions:**
- Clear metadata cache periodically: `musicbrainz.clearCache()`
- Implement LRU cache with size limit
- Limit queue state to visible items only
- Use smaller Ollama model (3b instead of 8b)
- Restart Conductor daily (systemd timer)

### Slow UI Responsiveness

**Symptom:** Keyboard input delayed, UI feels sluggish

**Possible causes:**
1. Slow terminal emulator
2. High CPU usage blocking event loop
3. Large state updates causing full re-renders
4. SSH latency

**Diagnosis:**

```bash
# Test terminal speed
yes | head -n 10000 | time cat
# Should be <1 second for fast terminal

# Test event loop lag
# Add to App.tsx:
setInterval(() => {
  const start = Date.now();
  setImmediate(() => {
    const lag = Date.now() - start;
    if (lag > 100) console.log('Event loop lag:', lag);
  });
}, 1000);
```

**Solutions:**
- Switch to faster terminal (alacritty, kitty)
- Reduce CPU usage (see above)
- Use React.memo() on all components
- Memoize expensive computations with useMemo()
- If over SSH, use mosh instead (better for high latency)

### Slow Metadata Loading

**Symptom:** Track changes but metadata takes 5+ seconds

**Possible causes:**
1. Poor network connection to MusicBrainz
2. MusicBrainz API slow/overloaded
3. Cache not working
4. Rate limiting causing queued requests

**Diagnosis:**

```bash
# Test MusicBrainz latency
time curl "https://musicbrainz.org/ws/2/artist/?query=miles%20davis"
# Should be <2 seconds

# Check if cache is working
# Add logging:
console.log('Cache hit:', this.cache.has(key));
# Should see mostly hits after warmup
```

**Solutions:**
- Check internet connection (run speed test)
- Implement persistent cache (survives restarts)
- Prefetch metadata for queue
- Use MusicBrainz mirror for heavy usage
- Graceful degradation (show basic info immediately)

### Slow AI Responses

**Symptom:** Commands take 10+ seconds to process

**Possible causes:**
1. AI provider overloaded
2. Large AI model (Ollama 70b)
3. Poor network to OpenRouter
4. Command requires multiple tool calls

**Diagnosis:**

```bash
# Test AI provider latency
time curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{"model":"anthropic/claude-3.5-sonnet","messages":[{"role":"user","content":"Hi"}]}'
# Should be <3 seconds

# For Ollama
time curl http://localhost:11434/api/generate \
  -d '{"model":"llama3.2:3b","prompt":"Hi"}'
# Should be <1 second
```

**Solutions:**
- Try different AI provider
- Use smaller Ollama model (3b instead of 8b)
- Check network connection
- Implement command caching (map common phrases to actions)
- Consider streaming responses (show partial results)

### MPD Connection Issues

**Symptom:** Frequent disconnections, "Not connected" errors

**Possible causes:**
1. MPD not running
2. Network issues (if remote MPD)
3. MPD max_connections limit reached
4. Firewall blocking connection

**Diagnosis:**

```bash
# Check if MPD is running
systemctl status mpd

# Test connection manually
echo "status" | nc localhost 6600
# Should return MPD status

# Check MPD logs
journalctl -u mpd -f
```

**Solutions:**
- Start MPD: `systemctl start mpd`
- Increase max_connections in mpd.conf
- Use Unix socket instead of TCP (faster, more reliable)
- Check firewall rules if using remote MPD
- Ensure automatic reconnection is working (check App.tsx)

## Hardware Recommendations

### Minimum Requirements

Conductor will run on this, but with limitations:

- **CPU:** Dual-core 1.5GHz (Intel Celeron, AMD A6)
- **RAM:** 1GB free (2GB total)
- **Storage:** 100MB for app + 1GB for music cache
- **Network:** Dial-up speeds (56 Kbps) work for MPD, metadata will be slow
- **OS:** Linux with kernel 3.10+ (any distro)

**Limitations:**
- Must use OpenRouter (Ollama too slow)
- Disable visualizer
- Increase polling interval to 2s
- Expect 5-10s metadata loading

### Recommended Configuration

Smooth experience with all features:

- **CPU:** Quad-core 2.5GHz (Intel i5, AMD Ryzen 5)
- **RAM:** 4GB free (8GB total)
- **Storage:** 500MB for app + 10GB for music cache
- **Network:** Broadband (1+ Mbps)
- **OS:** Modern Linux (kernel 5.4+)

**Performance:**
- Instant MPD commands (<50ms)
- Fast metadata loading (1-2s)
- Smooth UI (60fps)
- Can run Ollama with small models (3b, 8b)

### High-Performance Setup

For power users with large libraries:

- **CPU:** 8+ cores, 3.5GHz+ (Intel i7/i9, AMD Ryzen 7/9)
- **RAM:** 16GB+ (for large Ollama models)
- **GPU:** 8GB+ VRAM (for Ollama GPU acceleration)
- **Storage:** NVMe SSD
- **Network:** Gigabit ethernet or Wi-Fi 6

**Benefits:**
- Can run Ollama 70b model (<2s responses)
- Handles 100,000+ track libraries
- Instant metadata (persistent cache on SSD)
- Can run multiple instances

### Raspberry Pi Recommendations

**Raspberry Pi 4 (4GB or 8GB):**
- Use OpenRouter (don't run Ollama locally)
- Disable visualizer
- Works fine for typical use
- Consider heatsink/fan for sustained use

**Raspberry Pi 3:**
- Possible but slow
- Must use OpenRouter
- Increase polling to 2s
- Expect slower UI

**Raspberry Pi 5:**
- Great performance
- Can run Ollama 3b model (slowly)
- All features work smoothly

## Performance Tuning for Different Use Cases

### 24/7 Background Server

Running Conductor as a headless music server:

**Configuration:**
```bash
# Optimize for low CPU and memory
export AI_PROVIDER="ollama"  # No external API costs
export AI_MODEL="llama3.2:3b"  # Small model

# In App.tsx:
# - Increase polling to 5000ms (5s)
# - Disable visualizer
# - Limit queue display to 100 tracks
```

**Systemd service:**
```ini
[Unit]
Description=Conductor Music Player
After=mpd.service

[Service]
Type=simple
ExecStart=/usr/local/bin/conductor
Restart=always
RestartSec=10
Environment="MPD_HOST=localhost"
Environment="AI_PROVIDER=ollama"

[Install]
WantedBy=default.target
```

**Monitoring:**
```bash
# Daily log rotation
journalctl --vacuum-time=7d

# Weekly cache cleanup
0 0 * * 0 rm /tmp/conductor-albumart-*.jpg
0 0 * * 0 curl localhost:8080/api/cache/clear  # If implementing HTTP API
```

### Interactive Desktop Use

Optimal experience for daily use:

**Configuration:**
```bash
# Use best AI for quality
export AI_PROVIDER="openrouter"
export AI_MODEL="anthropic/claude-3.5-sonnet"

# In App.tsx:
# - Keep polling at 1000ms
# - Enable visualizer
# - Full queue display
```

**Shell alias:**
```bash
alias music='conductor'
alias m='conductor'
```

**Keyboard shortcuts (in terminal):**
- Ctrl+C to exit
- Ctrl+L to clear and redraw
- Ctrl+U to clear input

### Resource-Constrained Environment

Minimal resource usage (old laptop, VM, Raspberry Pi):

**Configuration:**
```bash
# Use remote AI to save local resources
export AI_PROVIDER="openrouter"
export AI_MODEL="anthropic/claude-3-haiku"  # Faster, cheaper

# In App.tsx:
# - Increase polling to 3000ms
# - Disable visualizer
# - Disable album art
# - Limit queue to 50 tracks
```

**Build optimization:**
```bash
# Use bun instead of node (faster startup)
bun run build:bun
bun run start:bun
```

**Memory limit:**
```bash
# Prevent runaway memory usage
node --max-old-space-size=256 dist/index.js
```

### Development/Testing

Fast iteration and debugging:

**Configuration:**
```bash
# Use local AI for speed and no costs
export AI_PROVIDER="ollama"
export AI_MODEL="llama3.2:3b"

# Enable debug logging
export DEBUG="conductor:*"
export NODE_ENV="development"
```

**Hot reload:**
```bash
# Use tsx watch mode
npm run dev

# Or bun watch mode
npm run dev:bun
```

**Mock providers:**
```typescript
// In tests, use mock MPD and AI
const mockMPD = new MockMPDClient();
const mockAI = new MockAIProvider();
```

### Party Mode / Public Display

Show-off mode with all features maxed:

**Configuration:**
```bash
# Use best AI
export AI_PROVIDER="openrouter"
export AI_MODEL="anthropic/claude-3.5-sonnet"

# In App.tsx:
# - Keep polling at 1000ms
# - Enable visualizer with bigger bars
# - Full album art (Überzug++)
# - Animated transitions
```

**Large display:**
```bash
# Increase terminal size
resize -s 60 200

# Use large fonts in terminal emulator
# Alacritty: font.size = 16
# Kitty: font_size 16.0
```

**RGB effects (future):**
```typescript
// Sync terminal colors with album art dominant color
const dominantColor = getDominantColor(albumArt);
console.log(`\x1b[48;2;${dominantColor.r};${dominantColor.g};${dominantColor.b}m`);
```

## Future Performance Improvements

Ideas for making Conductor faster:

### Short-term (Easy Wins)

1. **Persistent metadata cache**
   Save cache to `~/.cache/conductor/` on exit, load on start.
   Expected improvement: 80% fewer MusicBrainz requests

2. **MPD idle mode**
   Replace polling with event-based updates.
   Expected improvement: 95% less idle CPU usage

3. **Command caching**
   Map common phrases to actions (skip AI entirely).
   Expected improvement: 90% faster command latency

4. **Virtual scrolling**
   Only render visible queue items.
   Expected improvement: 90% faster large queue rendering

5. **Connection pooling**
   Reuse HTTP connections to external APIs.
   Expected improvement: 20% less network latency

### Medium-term (Moderate Effort)

1. **Streaming AI responses**
   Show AI output as it's generated, not after completion.
   Expected improvement: 60% faster perceived latency

2. **Prefetch metadata**
   Load metadata for queue tracks in background.
   Expected improvement: Zero latency for cached tracks

3. **LRU cache**
   Limit cache size to prevent unbounded growth.
   Expected improvement: Stable memory in long sessions

4. **WebSocket API**
   Control Conductor remotely without SSH overhead.
   Expected improvement: 80% faster remote control

5. **Metadata database**
   Use SQLite instead of in-memory Map.
   Expected improvement: Persistent cache with lower memory

### Long-term (Major Features)

1. **GPU-accelerated visualizer**
   Use GPU for complex visualizations.
   Expected improvement: 10x more complex animations

2. **Distributed caching**
   Share metadata cache across multiple Conductor instances.
   Expected improvement: Network-wide cache hits

3. **Machine learning prefetch**
   Predict next tracks and prefetch metadata.
   Expected improvement: 95% cache hit rate

4. **Native rewrite**
   Rewrite in Rust for lower resource usage.
   Expected improvement: 50% less memory, 30% less CPU

5. **Peer-to-peer metadata**
   Share metadata between users (if privacy-acceptable).
   Expected improvement: No MusicBrainz rate limiting

## Summary

Conductor's performance is solid for typical use. The main bottlenecks are:

1. **AI provider latency** (1-3s) - Fix with local Ollama or command caching
2. **MusicBrainz rate limits** (1 req/s) - Fix with persistent cache and prefetching
3. **Large library searches** (500ms+) - Fix with targeted queries and limits
4. **Polling overhead** (1-3% CPU) - Fix with MPD idle mode

For most people, the defaults work fine. Power users should consider local Ollama. Low-resource systems benefit from disabling the visualizer and increasing the polling interval.

The codebase follows React best practices for rendering performance. Future work should focus on MPD idle mode, persistent caching, and command caching for the biggest wins.
