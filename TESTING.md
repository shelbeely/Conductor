# Testing guide

Conductor currently lacks automated tests, but this guide documents manual testing procedures and outlines plans for future test automation.

## Manual testing checklist

Run through this checklist after making changes or before releases.

### Setup verification

- [ ] **MPD connection**
  - Start MPD: `systemctl --user start mpd`
  - Check status: `mpc status`
  - Verify library: `mpc listall | head`
  - Expected: MPD running, library populated

- [ ] **Dependencies installed**
  - Run: `bun install`
  - Expected: Clean install, no errors

- [ ] **Build succeeds**
  - Run: `bun run build`
  - Expected: Compiled to `dist/` without errors

- [ ] **Type checking passes**
  - Run: `bun run type-check`
  - Expected: No type errors

### Basic playback

- [ ] **Application starts**
  - Run: `bun start`
  - Expected: UI appears, no crashes

- [ ] **Play music**
  - Type: `play some music`
  - Expected: Track starts playing, now playing view updates

- [ ] **Pause playback**
  - Type: `pause`
  - Expected: Playback pauses, UI shows paused state

- [ ] **Resume playback**
  - Type: `play`
  - Expected: Playback resumes from where it paused

- [ ] **Stop playback**
  - Type: `stop`
  - Expected: Playback stops, position resets

- [ ] **Skip to next track**
  - Type: `next`
  - Expected: Moves to next track in queue

- [ ] **Go to previous track**
  - Type: `previous`
  - Expected: Returns to previous track or restarts current

### Search and queue

- [ ] **Search by artist**
  - Type: `play Miles Davis`
  - Expected: Finds and plays Miles Davis tracks

- [ ] **Search by album**
  - Type: `play Kind of Blue`
  - Expected: Finds and plays the album

- [ ] **Search by genre**
  - Type: `play jazz`
  - Expected: Plays tracks tagged as jazz

- [ ] **Add to queue**
  - Type: `add Pink Floyd to queue`
  - Expected: Tracks added, current playback continues

- [ ] **View queue**
  - Type: `show queue`
  - Expected: Queue displays on screen

- [ ] **Clear queue**
  - Type: `clear queue`
  - Expected: Confirmation, then queue empties

### Volume control

- [ ] **Set specific volume**
  - Type: `set volume to 50`
  - Expected: Volume changes to 50%

- [ ] **Increase volume**
  - Type: `turn up the volume`
  - Expected: Volume increases by ~10-15%

- [ ] **Decrease volume**
  - Type: `turn it down`
  - Expected: Volume decreases by ~10-15%

- [ ] **Volume boundary checks**
  - Type: `set volume to 0`
  - Expected: Volume mutes
  - Type: `set volume to 100`
  - Expected: Volume maxes out
  - Type: `set volume to 150`
  - Expected: Error message or clamps to 100

### Playback modes

- [ ] **Enable repeat**
  - Type: `turn on repeat`
  - Expected: Repeat indicator appears in UI

- [ ] **Enable random/shuffle**
  - Type: `enable shuffle`
  - Expected: Random indicator appears

- [ ] **Enable single mode**
  - Type: `turn on single mode`
  - Expected: Single indicator appears

- [ ] **Enable consume mode**
  - Type: `enable consume`
  - Expected: Consume indicator appears

- [ ] **Disable modes**
  - Type: `turn off repeat`
  - Expected: Repeat indicator disappears

- [ ] **Toggle modes**
  - Type: `toggle random`
  - Expected: Random mode toggles on/off

### AI model management (v0.2.0)

- [ ] **List available models**
  - Type: `show available models`
  - Expected: Lists models for current provider

- [ ] **Switch models**
  - Type: `use llama3.2 model`
  - Expected: Switches to specified model

- [ ] **Show current model**
  - Type: `what model are we using`
  - Expected: Displays current model name

### Playlist generation (v0.2.0)

- [ ] **Generate mood-based playlist**
  - Type: `create a relaxing playlist`
  - Expected: AI generates playlist based on mood

- [ ] **Generate genre-based playlist**
  - Type: `make an upbeat workout playlist`
  - Expected: Playlist with energetic tracks

- [ ] **Generate with target length**
  - Type: `generate a 30-track jazz playlist`
  - Expected: Playlist with approximately 30 tracks

### Metadata and album art

- [ ] **MusicBrainz enrichment**
  - Play a track
  - Expected: Additional artist/album info appears if available

- [ ] **Album art display (with Überzug++)**
  - Play a track with album art
  - Expected: Cover image displays in terminal

- [ ] **ASCII art fallback (without Überzug++)**
  - Disable Überzug++ or use incompatible terminal
  - Expected: ASCII box with track/artist info

### Error handling

- [ ] **MPD connection failure**
  - Stop MPD: `systemctl --user stop mpd`
  - Start Conductor: `bun start`
  - Expected: Graceful error, reconnection attempts

- [ ] **Invalid search**
  - Type: `play asdfasdfasdf`
  - Expected: "No results found" message

- [ ] **Invalid volume**
  - Type: `set volume to abc`
  - Expected: Error message

- [ ] **AI provider unavailable**
  - With Ollama: Stop Ollama service
  - Type a command
  - Expected: Error message about provider

### UI and display

- [ ] **Now playing updates**
  - Play music and watch for 10 seconds
  - Expected: Progress bar moves, time updates

- [ ] **Queue displays correctly**
  - Add 15 tracks to queue
  - Expected: Shows first 10, indicates more exist

- [ ] **Command history works**
  - Type several commands
  - Use up arrow
  - Expected: Previous commands appear

- [ ] **Long track names**
  - Play track with very long title
  - Expected: Text truncates gracefully, no UI breakage

### Different AI providers

- [ ] **Ollama local model**
  - Set `AI_PROVIDER=ollama` in `.env`
  - Type: `play some jazz`
  - Expected: Command works, uses local model

- [ ] **OpenRouter API**
  - Set `AI_PROVIDER=openrouter` with valid key
  - Type: `play some jazz`
  - Expected: Command works, uses remote model

- [ ] **Anthropic API**
  - Set `AI_PROVIDER=anthropic` with valid key
  - Type: `play some jazz`
  - Expected: Command works (if implemented)

### Edge cases

- [ ] **Empty library**
  - Clear MPD database: `mpc clear && rm ~/.config/mpd/database`
  - Update: `mpc update`
  - Try playing: `play something`
  - Expected: Graceful "no results" message

- [ ] **Untagged files**
  - Add untagged MP3s to library
  - Update: `mpc update`
  - Try searching: `play unknown artist`
  - Expected: May or may not find them (depends on search)

- [ ] **Network interruption (remote MPD)**
  - Connect to remote MPD
  - Disconnect network
  - Try command
  - Expected: Error message, reconnection attempts

- [ ] **Large queue**
  - Add 200+ tracks to queue
  - Type: `show queue`
  - Expected: Shows partial queue, doesn't hang

- [ ] **Rapid commands**
  - Type multiple commands quickly
  - Expected: All execute in order, no crashes

### Performance checks

- [ ] **Startup time**
  - Run: `time bun start` (quit immediately)
  - Expected: Starts in < 5 seconds

- [ ] **Search performance**
  - Large library (10,000+ tracks)
  - Type: `play jazz`
  - Expected: Results in < 2 seconds

- [ ] **AI response time**
  - Type: `play some music`
  - Measure time to response
  - Expected: < 3 seconds for Ollama, < 5 seconds for OpenRouter

- [ ] **Memory usage**
  - Run Conductor for 30 minutes
  - Check memory: `ps aux | grep bun`
  - Expected: < 200 MB, no steady increase

### Cross-platform (Linux focus)

- [ ] **Debian/Ubuntu**
  - Full checklist on Debian or Ubuntu
  - Expected: Everything works

- [ ] **Arch Linux**
  - Full checklist on Arch
  - Expected: Everything works

- [ ] **Fedora/RHEL**
  - Full checklist on Fedora
  - Expected: Everything works (MPD package names differ)

### Cleanup

- [ ] **Exit gracefully**
  - Press Ctrl+C
  - Expected: Clean shutdown, no hanging processes

- [ ] **Temp files cleaned**
  - Check temp directories
  - Expected: No leftover album art files (should auto-clean)

## Automated testing plans

Future versions should include automated tests. Here's the planned structure:

### Unit tests

**MPD client tests:**

```typescript
// src/mpd/__tests__/client.test.ts
import { MPDClient } from '../client';

describe('MPDClient', () => {
  it('connects to MPD successfully', async () => {
    const client = new MPDClient();
    await expect(client.connect()).resolves.not.toThrow();
  });

  it('handles connection failures gracefully', async () => {
    const client = new MPDClient({ host: 'invalid', port: 9999 });
    await expect(client.connect()).rejects.toThrow();
  });

  it('searches library correctly', async () => {
    const client = new MPDClient();
    await client.connect();
    const results = await client.search('artist', 'test');
    expect(Array.isArray(results)).toBe(true);
  });
});
```

**AI agent tests:**

```typescript
// src/ai/__tests__/agent.test.ts
import { AIAgent } from '../agent';

describe('AIAgent', () => {
  it('parses tool calls from responses', async () => {
    const agent = new AIAgent({ provider: 'ollama' });
    const response = await agent.processCommand('play some jazz');
    expect(response.toolCalls).toBeDefined();
  });

  it('maintains conversation history', () => {
    const agent = new AIAgent({ provider: 'ollama' });
    // Test history management
  });
});
```

**MusicBrainz client tests:**

```typescript
// src/metadata/__tests__/musicbrainz.test.ts
import { MusicBrainzClient } from '../musicbrainz';

describe('MusicBrainzClient', () => {
  it('searches for artists', async () => {
    const mb = new MusicBrainzClient();
    const artist = await mb.searchArtist('Miles Davis');
    expect(artist).toBeDefined();
    expect(artist?.name).toBe('Miles Davis');
  });

  it('respects rate limiting', async () => {
    const mb = new MusicBrainzClient();
    const start = Date.now();
    await mb.searchArtist('Artist 1');
    await mb.searchArtist('Artist 2');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThan(1000); // At least 1 second between
  });
});
```

### Integration tests

**Full playback flow:**

```typescript
// tests/integration/playback.test.ts
describe('Playback integration', () => {
  it('plays music end-to-end', async () => {
    const client = new MPDClient();
    const agent = new AIAgent({ provider: 'ollama' });
    
    await client.connect();
    const response = await agent.processCommand('play some jazz');
    
    // Execute tool calls
    for (const call of response.toolCalls || []) {
      if (call.name === 'play_music') {
        const results = await client.search('genre', 'jazz');
        await client.addToQueue(results[0].file);
        await client.play();
      }
    }
    
    const status = await client.getStatus();
    expect(status?.state).toBe('play');
  });
});
```

### UI tests

React/Ink components can be tested with `ink-testing-library`:

```typescript
// src/ui/__tests__/NowPlaying.test.tsx
import { render } from 'ink-testing-library';
import { NowPlaying } from '../NowPlaying';

describe('NowPlaying component', () => {
  it('renders track information', () => {
    const { lastFrame } = render(
      <NowPlaying 
        track={{ title: 'Test', artist: 'Artist' }}
        status={{ state: 'play', volume: 50 }}
      />
    );
    
    expect(lastFrame()).toContain('Test');
    expect(lastFrame()).toContain('Artist');
  });
});
```

### End-to-end tests

Use Playwright or similar to test the full TUI:

```typescript
// tests/e2e/commands.test.ts
describe('E2E command flow', () => {
  it('processes natural language commands', async () => {
    const process = spawn('bun', ['start']);
    
    // Send command via stdin
    process.stdin.write('play some jazz\n');
    
    // Wait for response
    await wait(2000);
    
    // Check MPD status
    const status = await exec('mpc status');
    expect(status).toContain('playing');
    
    process.kill();
  });
});
```

### Performance tests

Measure response times and resource usage:

```typescript
// tests/performance/search.test.ts
describe('Search performance', () => {
  it('searches large libraries quickly', async () => {
    const client = new MPDClient();
    await client.connect();
    
    const start = performance.now();
    const results = await client.search('any', 'test');
    const elapsed = performance.now() - start;
    
    expect(elapsed).toBeLessThan(2000); // < 2 seconds
  });
});
```

### Test infrastructure

**Test runner:**

Use bun's built-in test runner:

```bash
bun test
```

Or add Jest:

```bash
bun add --dev jest @types/jest
```

**Mock MPD server:**

Create a mock MPD implementation for tests:

```typescript
// tests/mocks/mpd-server.ts
export class MockMPDServer {
  start(port: number) {
    // Implement MPD protocol
  }
  
  stop() {
    // Clean up
  }
}
```

**CI integration:**

GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run type-check
```

## Test coverage goals

Target test coverage for v1.0:

- **Unit tests:** > 80% coverage
- **Integration tests:** Core flows (playback, search, queue)
- **E2E tests:** Common user scenarios
- **Performance tests:** Key operations benchmarked

## Contributing tests

When adding features:

1. Write unit tests for new functions
2. Add integration test if it touches multiple modules
3. Update manual checklist if it changes UI or user-facing behavior
4. Run full manual checklist before submitting PR

When fixing bugs:

1. Add test that reproduces the bug
2. Fix the bug
3. Verify test passes

## Test conventions

- Test files: `__tests__/` directories or `*.test.ts` suffix
- Use descriptive test names: `it('handles connection failures gracefully')`
- Mock external dependencies (MPD, AI providers, MusicBrainz)
- Clean up after tests (close connections, clear caches)
- Use fixtures for test data (sample tracks, responses)

## Running tests

Once automated tests exist:

```bash
# All tests
bun test

# Specific file
bun test src/mpd/__tests__/client.test.ts

# Watch mode
bun test --watch

# Coverage report
bun test --coverage
```

## Summary

Current state: Manual testing only. Use the checklist above to verify changes.

Future: Full automated test suite with unit, integration, and E2E tests. The infrastructure plans are documented here for future implementation.

Contributors should run manual tests now and help build the automated suite over time.
