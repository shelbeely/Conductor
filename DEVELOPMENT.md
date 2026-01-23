# Development Guide

This guide covers everything you need to know for developing Conductor. If you're looking for basic setup, check [SETUP.md](SETUP.md) first.

## Development Environment

### Required Tools

You need bun.js (recommended) or Node.js 18+:

```bash
# Install bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Or verify Node.js version
node --version  # Should be >= 18.0.0
```

MPD must be running for testing. See [SETUP.md](SETUP.md) for MPD configuration.

### Recommended IDEs

**VS Code** (recommended):
- TypeScript and ESLint support out of the box
- Ink React component highlighting
- GitHub Copilot integration with custom agent support

Extensions to install:
- `esbenp.prettier-vscode` - Code formatting
- `dbaeumer.vscode-eslint` - Linting
- `GitHub.copilot` - AI assistance with our custom React performance agent

**Other options**:
- WebStorm - Excellent TypeScript support
- Neovim - With TypeScript LSP and Telescope

### GitHub Copilot Custom Agent

This project includes a custom React performance optimization agent. If you have GitHub Copilot, the agent is automatically available in supported environments.

The agent specializes in:
- React/Ink performance optimization
- Re-render prevention patterns
- Memory leak detection
- Proper hook usage

See `.github/agents/react-performance.md` for details.

## Repository Structure

```
Conductor/
├── .github/
│   ├── agents/              # Custom GitHub Copilot agents
│   │   └── react-performance.md
│   ├── copilot-instructions.md
│   └── skills/              # Agent skill references
│       ├── humanizer.md     # AI writing detection/removal
│       └── react-best-practices.md
├── src/
│   ├── ai/                  # AI agent and provider implementations
│   │   └── agent.ts         # Main AI agent, providers, tool schemas
│   ├── art/                 # Album art display
│   │   └── display.ts       # Überzug++ integration, ASCII fallback
│   ├── metadata/            # Music metadata enrichment
│   │   └── musicbrainz.ts   # MusicBrainz API client with caching
│   ├── mpd/                 # MPD client
│   │   └── client.ts        # TCP connection, commands, status polling
│   ├── ui/                  # React/Ink UI components
│   │   ├── CommandInput.tsx # Natural language input with history
│   │   ├── NowPlaying.tsx   # Current track display
│   │   ├── Queue.tsx        # Playlist view
│   │   └── Visualizer.tsx   # Audio visualization
│   ├── App.tsx              # Main application component
│   └── index.tsx            # Entry point, Ink render setup
├── dist/                    # Compiled JavaScript (git-ignored)
├── ARCHITECTURE.md          # System design documentation
├── CONTRIBUTING.md          # Quick contribution guide
├── DEVELOPMENT.md           # This file
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

### Key Files Explained

**src/index.tsx**: Entry point. Renders the main App component with Ink, loads environment variables, handles graceful shutdown.

**src/App.tsx**: Main coordinator. Initializes all modules (MPD, AI, metadata, album art), manages application state, polls MPD for updates, handles user commands.

**src/mpd/client.ts**: MPD communication layer. Uses `mpc-js` library, handles reconnection, exposes typed methods for playback control, queue management, and search.

**src/ai/agent.ts**: AI command processor. Defines tool schemas with Zod, supports multiple providers (OpenRouter, Ollama, Anthropic), parses natural language into structured tool calls.

**src/metadata/musicbrainz.ts**: Metadata enrichment. Rate-limited MusicBrainz API client (1 req/sec), in-memory caching, fetches artist info and cover art URLs.

**src/art/display.ts**: Album art display. Checks for Überzug++ availability, downloads and displays cover art, generates ASCII art fallback, manages cleanup of temp files.

**src/ui/\*.tsx**: React components using Ink. Each component follows React best practices with proper memoization and hook usage.

## Development Workflow

### Branch Strategy

We use a simple trunk-based workflow:

- `main` - Production-ready code
- Feature branches - `feature/your-feature-name`
- Bug fixes - `fix/bug-description`

Branch naming is lowercase with hyphens. Keep branches short-lived.

### Commit Messages

Use conventional commits format:

```
type(scope): short description

Longer explanation if needed.

Fixes #123
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding tests
- `chore` - Build/tooling changes

Examples:
```
feat(ai): add Anthropic provider support
fix(mpd): handle disconnection during queue update
docs(setup): clarify Ollama installation steps
refactor(ui): extract NowPlaying metadata display
perf(ui): memoize Queue component rendering
```

### Pull Request Process

1. Fork the repository (external contributors)
2. Create a feature branch
3. Make your changes
4. Run `bun run type-check` to verify TypeScript
5. Test manually with `bun run dev`
6. Commit with clear messages
7. Push and open a PR
8. Address review feedback

Keep PRs focused. One feature or fix per PR makes review easier.

## Building From Source

### Development Build

```bash
# Type check without building
bun run type-check

# Run directly without building (hot reload with tsx)
bun run dev

# Or with Node.js
npm run dev
```

The `dev` script uses `tsx` to compile TypeScript on the fly. Changes require restarting the process.

### Release Build

```bash
# Build with bun
bun run build

# Or with npm
npm run build

# Output goes to dist/
# Entry point: dist/index.js (with executable flag)
```

The build process:
1. TypeScript compiles to `dist/` directory
2. Sets executable flag on `dist/index.js`
3. No bundling - uses Node.js module resolution

### Build Optimization

TypeScript compiler is configured in `tsconfig.json`:

- `target: ES2022` - Modern JavaScript features
- `module: ESNext` - Native ES modules
- `strict: true` - Strict type checking
- `moduleResolution: bundler` - Resolves imports like a bundler

No webpack/rollup because:
- Faster build times
- Simpler debugging
- Native Node.js module support

## Hot Reload and Dev Mode

### Basic Hot Reload

```bash
bun run dev
```

This runs the app with `tsx` which recompiles on file changes. You need to restart manually for changes to take effect.

### Bun Watch Mode

```bash
bun run dev:bun
```

Uses bun's `--watch` flag for automatic restarts on file changes. Faster than tsx.

### Development Tips

**Terminal resets**: If the terminal gets messed up after crashes, run:
```bash
reset
```

**Clear Ink state**: Ink can leave artifacts. Use:
```bash
clear && bun run dev
```

**Multiple test instances**: Run in different terminals to test concurrent behavior.

## Debugging Techniques

### Debugging React/Ink Components

**Console logging**: Use `console.error()` instead of `console.log()` because Ink captures stdout:

```typescript
// In a component
useEffect(() => {
  console.error('NowPlaying rendered with track:', track.title);
}, [track]);
```

**Component state inspection**: Log state changes in useEffect:

```typescript
useEffect(() => {
  console.error('Queue state:', { length: queue.length, scrollPosition });
}, [queue, scrollPosition]);
```

**Render count tracking**: Detect unnecessary re-renders:

```typescript
const renderCount = useRef(0);
renderCount.current++;
console.error('Component rendered', renderCount.current, 'times');
```

**React DevTools**: Won't work with Ink. Use console logging instead.

### Debugging MPD Issues

**Check MPD connection**:
```bash
# Test MPD directly
mpc status
mpc current
mpc listall | head -10
```

**View MPD logs**:
```bash
tail -f ~/.config/mpd/log
```

**Debug MPD client in code**:
```typescript
// Add logging to src/mpd/client.ts
async connect() {
  console.error('Connecting to MPD:', this.host, this.port);
  try {
    // ... existing code
    console.error('MPD connected successfully');
  } catch (error) {
    console.error('MPD connection failed:', error);
  }
}
```

**Test raw MPD protocol**:
```bash
# Connect with netcat
nc localhost 6600
# Type: status
# Type: currentsong
# Type: close
```

### Debugging AI Problems

**Test AI provider directly**:

For Ollama:
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "play some jazz",
  "stream": false
}'
```

For OpenRouter:
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

**Debug AI agent responses**:
```typescript
// In src/ai/agent.ts processCommand()
console.error('AI raw response:', JSON.stringify(result, null, 2));
console.error('Extracted tool calls:', toolCalls);
```

**Test tool schemas**:
```typescript
// Test Zod validation
import { z } from 'zod';

const schema = z.object({
  query: z.string(),
  limit: z.number().optional()
});

const result = schema.safeParse({ query: "jazz", limit: 10 });
console.error('Schema validation:', result);
```

### Debugging Album Art

**Check Überzug++ availability**:
```bash
which ueberzugpp
ueberzugpp --version
```

**Test Überzug++ manually**:
```bash
# Create test JSON
echo '{"action":"add","identifier":"test","x":10,"y":10,"width":30,"height":30,"path":"/path/to/image.jpg"}' | ueberzugpp layer
```

**Debug art display in code**:
```typescript
// In src/art/display.ts
console.error('Überzug++ available:', this.isAvailable);
console.error('Displaying art:', { url, identifier, position });
```

### Performance Profiling

**Time operations**:
```typescript
const start = performance.now();
await someOperation();
const duration = performance.now() - start;
console.error(`Operation took ${duration}ms`);
```

**Memory usage**:
```typescript
const used = process.memoryUsage();
console.error('Memory:', {
  heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
  external: `${Math.round(used.external / 1024 / 1024)}MB`
});
```

## Testing Strategy

### Current State

Manual testing only. No automated test suite yet.

### Manual Testing Checklist

Before submitting a PR, test these scenarios:

**Basic playback**:
- [ ] "play some jazz" searches and plays
- [ ] "pause" pauses playback
- [ ] "next track" skips forward
- [ ] "previous track" goes back
- [ ] "stop" stops playback

**Queue management**:
- [ ] "show queue" displays queue
- [ ] "clear queue" empties queue
- [ ] "add [song] to queue" adds song

**Volume control**:
- [ ] "set volume to 75" changes volume
- [ ] "volume up" increases volume
- [ ] "volume down" decreases volume

**Settings**:
- [ ] "turn on repeat" enables repeat
- [ ] "turn off repeat" disables repeat
- [ ] "enable random" enables random playback

**Metadata display**:
- [ ] Album art displays (if Überzug++ available)
- [ ] ASCII art fallback works (without Überzug++)
- [ ] MusicBrainz metadata enrichment works
- [ ] Track info displays correctly

**Error handling**:
- [ ] Graceful handling when MPD disconnects
- [ ] Error message when AI provider unavailable
- [ ] Fallback when metadata API fails
- [ ] Recovery when album art download fails

**UI**:
- [ ] Command history with up/down arrows
- [ ] Queue scrolling (if long queue)
- [ ] Visualizer animation runs smoothly
- [ ] No UI artifacts after errors

### Future Automated Testing

When we add tests, they should cover:

**Unit tests** (src/\*\*/\*.test.ts):
- MPD client methods
- Zod schema validation
- Metadata client parsing
- Album art URL extraction

**Integration tests**:
- AI agent with mock providers
- MPD client with test instance
- Complete command flow

**Component tests**:
- Ink component rendering
- User input handling
- State updates

**E2E tests**:
- Full command workflows
- Error recovery scenarios
- Performance benchmarks

Test framework recommendations:
- Vitest for unit tests (fast, TypeScript-first)
- @testing-library/react for component tests
- Playwright for E2E (if we add web interface)

## Code Organization Patterns

### Where to Add New Features

**New AI provider**:
1. Add provider class to `src/ai/agent.ts`
2. Extend `AIProvider` abstract class
3. Implement `processCommand()` method
4. Add to factory in `AIAgent` constructor

**New MPD command**:
1. Add method to `MPDClient` in `src/mpd/client.ts`
2. Define return type interface
3. Handle errors gracefully
4. Call from `App.tsx` tool execution

**New AI tool**:
1. Define Zod schema in `src/ai/agent.ts`
2. Add to `tools` array with description
3. Add handler in `App.tsx` `executeToolCalls()`
4. Update state as needed

**New UI component**:
1. Create file in `src/ui/`
2. Use TypeScript with proper types
3. Follow React best practices (see below)
4. Import and render in `App.tsx`

**New metadata source**:
1. Create client class in `src/metadata/`
2. Follow `MusicBrainzClient` pattern
3. Add caching and rate limiting
4. Call in `App.tsx` enrichment flow

**Shared utilities**:
1. Create `src/utils/` directory
2. Add utility modules (validation, formatting, etc.)
3. Export typed functions
4. Import where needed

### File Naming Conventions

- Components: PascalCase (e.g., `NowPlaying.tsx`)
- Modules: camelCase (e.g., `client.ts`, `agent.ts`)
- Types: PascalCase interfaces/types
- Constants: UPPER_SNAKE_CASE

### Module Exports

Use named exports for better tree-shaking:

```typescript
// Good
export class MPDClient { }
export interface Track { }

// Avoid default exports
export default MPDClient; // Don't do this
```

### Import Organization

Order imports logically:

```typescript
// External dependencies
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

// Internal modules
import { MPDClient } from './mpd/client.js';
import { AIAgent } from './ai/agent.js';

// Types
import type { Track, Status } from './mpd/client.js';
```

## TypeScript Best Practices

### Strict Mode Configuration

`tsconfig.json` has `strict: true` enabled. This includes:
- `noImplicitAny` - No implicit any types
- `strictNullChecks` - Proper null/undefined handling
- `strictFunctionTypes` - Sound function type checking
- `strictPropertyInitialization` - Class properties must be initialized

Keep strict mode enabled. It catches bugs early.

### Type Safety Guidelines

**Define interfaces for all data structures**:

```typescript
// Good
interface Track {
  file: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
}

// Bad - using any
const track: any = await mpd.currentSong();
```

**Use type guards for runtime validation**:

```typescript
function isTrack(obj: unknown): obj is Track {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'file' in obj &&
    typeof obj.file === 'string'
  );
}

// Use it
const data = await fetchData();
if (isTrack(data)) {
  console.log(data.title); // TypeScript knows this is safe
}
```

**Use Zod for external data validation**:

```typescript
import { z } from 'zod';

const TrackSchema = z.object({
  file: z.string(),
  title: z.string().optional(),
  artist: z.string().optional(),
  album: z.string().optional(),
  duration: z.number().optional()
});

// Validate and parse
const track = TrackSchema.parse(externalData);
```

**Prefer unknown over any**:

```typescript
// Good - forces type checking
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
}

// Bad - bypasses type safety
function processData(data: any) {
  return data.toUpperCase(); // Might crash
}
```

**Use proper async/await types**:

```typescript
// Good
async function fetchTrack(): Promise<Track | null> {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch:', error);
    return null;
  }
}

// Bad - missing error handling
async function fetchTrack(): Promise<Track> {
  const response = await fetch(url);
  return await response.json(); // Might crash
}
```

### Avoiding Common TypeScript Pitfalls

**Non-null assertions**: Use sparingly and only when you're certain:

```typescript
// Risky
const track = tracks.find(t => t.id === id)!; // Might be undefined

// Better
const track = tracks.find(t => t.id === id);
if (track) {
  // Use track safely here
}
```

**Type assertions**: Avoid when possible:

```typescript
// Bad
const track = data as Track; // Bypasses type checking

// Better
const track = TrackSchema.parse(data); // Runtime validation
```

**Optional chaining**: Use for potentially undefined values:

```typescript
// Good
const title = track?.title ?? 'Unknown';

// Verbose alternative
const title = track && track.title ? track.title : 'Unknown';
```

## React/Ink Performance Optimization

This project follows [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices). Full reference in `.github/skills/react-best-practices.md`.

### Re-render Optimization (Most Important)

**Hoist helper functions outside components**:

```typescript
// Good - function created once
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const NowPlaying = ({ track }: Props) => {
  const formatted = formatDuration(track.duration);
  return <Text>{formatted}</Text>;
};

// Bad - new function on every render
const NowPlaying = ({ track }: Props) => {
  const formatDuration = (seconds: number) => {
    // This creates a new function every render
    return `${Math.floor(seconds / 60)}:${seconds % 60}`;
  };
  return <Text>{formatDuration(track.duration)}</Text>;
};
```

**Wrap components with React.memo()**:

```typescript
import React, { memo } from 'react';

interface Props {
  track: Track;
  isPlaying: boolean;
}

const NowPlaying = memo(({ track, isPlaying }: Props) => {
  return (
    <Box>
      <Text>{track.title}</Text>
      <Text>{isPlaying ? '▶' : '⏸'}</Text>
    </Box>
  );
});

export default NowPlaying;
```

**Use useMemo() for expensive computations**:

```typescript
const Queue = ({ tracks }: Props) => {
  // This filters array on every render - expensive!
  // Bad:
  const filtered = tracks.filter(t => t.artist === selectedArtist);

  // Good - only recomputes when dependencies change:
  const filtered = useMemo(
    () => tracks.filter(t => t.artist === selectedArtist),
    [tracks, selectedArtist]
  );

  return <Box>{/* render filtered */}</Box>;
};
```

**Use useCallback() for stable function references**:

```typescript
const App = () => {
  const [query, setQuery] = useState('');

  // Bad - new function on every render
  const handleSubmit = (value: string) => {
    setQuery(value);
  };

  // Good - stable function reference
  const handleSubmit = useCallback((value: string) => {
    setQuery(value);
  }, []); // Empty deps because we only use setQuery (stable)

  return <CommandInput onSubmit={handleSubmit} />;
};
```

**Lazy state initialization**:

```typescript
// Bad - expensive function runs every render
const [data, setData] = useState(expensiveComputation());

// Good - only runs once on mount
const [data, setData] = useState(() => expensiveComputation());
```

**Functional setState updates**:

```typescript
// Bad - might use stale state
const increment = () => {
  setCount(count + 1);
};

// Good - always uses latest state
const increment = () => {
  setCount(prev => prev + 1);
};
```

### When to Optimize

Don't optimize prematurely. Use these techniques when:
- Component receives props that change frequently
- Component renders a large list (e.g., Queue with 1000 tracks)
- Expensive computation runs on every render
- Function is passed as a prop to a memoized child

### Performance Debugging

Check if component is re-rendering unnecessarily:

```typescript
const NowPlaying = memo(({ track }: Props) => {
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    console.error('NowPlaying rendered', renderCount.current, 'times');
  });

  return <Box>{/* ... */}</Box>;
});
```

If render count is high but props haven't changed, the component isn't memoized properly.

## Adding New AI Providers

Step-by-step guide to add a new AI provider (e.g., Google Gemini):

### 1. Define Provider Class

In `src/ai/agent.ts`, add a new provider class:

```typescript
class GeminiProvider extends AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-pro') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async processCommand(
    command: string,
    tools: ToolDefinition[]
  ): Promise<{ toolCalls: ToolCall[] }> {
    // Implementation here
  }
}
```

### 2. Implement API Client

Add the API call logic:

```typescript
async processCommand(command: string, tools: ToolDefinition[]) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: command }]
        }],
        tools: this.formatTools(tools)
      })
    }
  );

  const data = await response.json();
  return this.parseResponse(data);
}
```

### 3. Format Tools for Provider

Each provider expects tools in a different format:

```typescript
private formatTools(tools: ToolDefinition[]) {
  return tools.map(tool => ({
    function_declarations: [{
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.parameters)
    }]
  }));
}
```

### 4. Parse Response

Extract tool calls from the provider's response format:

```typescript
private parseResponse(data: any): { toolCalls: ToolCall[] } {
  const toolCalls: ToolCall[] = [];
  
  // Parse Gemini's response format
  const functionCalls = data.candidates?.[0]?.content?.parts?.filter(
    (part: any) => part.functionCall
  );

  for (const call of functionCalls || []) {
    toolCalls.push({
      name: call.functionCall.name,
      arguments: call.functionCall.args
    });
  }

  return { toolCalls };
}
```

### 5. Add to Factory

Update the `AIAgent` constructor to include the new provider:

```typescript
export class AIAgent {
  private provider: AIProvider;

  constructor() {
    const aiProvider = process.env.AI_PROVIDER || 'ollama';

    switch (aiProvider) {
      case 'openrouter':
        this.provider = new OpenRouterProvider(/* ... */);
        break;
      case 'ollama':
        this.provider = new OllamaProvider(/* ... */);
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider(/* ... */);
        break;
      case 'gemini':
        // Add new provider here
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not set');
        this.provider = new GeminiProvider(apiKey, process.env.AI_MODEL);
        break;
      default:
        throw new Error(`Unknown AI provider: ${aiProvider}`);
    }
  }
}
```

### 6. Update Environment Variables

Add to `.env.example`:

```bash
# Google Gemini (alternative)
GEMINI_API_KEY=your_gemini_key_here
AI_MODEL=gemini-pro
```

### 7. Test the Provider

```bash
# Set environment
export AI_PROVIDER=gemini
export GEMINI_API_KEY=your_key
export AI_MODEL=gemini-pro

# Run
bun run dev

# Test with simple command
> play some jazz
```

### 8. Document

Update these files:
- `SETUP.md` - Add setup instructions
- `API_REFERENCE.md` - Document provider configuration
- `.env.example` - Add environment variables
- This file (DEVELOPMENT.md) - Add to provider list

## Adding New MPD Commands

To add a new MPD command (e.g., "shuffle queue"):

### 1. Add MPD Client Method

In `src/mpd/client.ts`:

```typescript
async shuffle(): Promise<void> {
  if (!this.client) {
    throw new Error('Not connected to MPD');
  }

  try {
    await this.client.api.playback.shuffle();
  } catch (error) {
    console.error('Shuffle failed:', error);
    throw error;
  }
}
```

### 2. Define Tool Schema

In `src/ai/agent.ts`, add to the `tools` array:

```typescript
{
  name: 'shuffle_queue',
  description: 'Shuffle the current queue randomly',
  parameters: z.object({
    // No parameters needed for shuffle
  })
}
```

### 3. Add Tool Handler

In `src/App.tsx`, add to `executeToolCalls()`:

```typescript
case 'shuffle_queue':
  if (mpdClient) {
    await mpdClient.shuffle();
    setAiResponse('Queue shuffled');
  }
  break;
```

### 4. Test

```bash
bun run dev
> shuffle the queue
> show queue  # Verify order changed
```

## Adding New UI Components

To add a new UI component (e.g., "Settings panel"):

### 1. Create Component File

Create `src/ui/Settings.tsx`:

```typescript
import React, { memo } from 'react';
import { Box, Text } from 'ink';

interface SettingsProps {
  repeat: boolean;
  random: boolean;
  volume: number;
}

const Settings = memo(({ repeat, random, volume }: SettingsProps) => {
  return (
    <Box flexDirection="column" borderStyle="single" padding={1}>
      <Text bold>Settings</Text>
      <Text>Repeat: {repeat ? 'On' : 'Off'}</Text>
      <Text>Random: {random ? 'On' : 'Off'}</Text>
      <Text>Volume: {volume}%</Text>
    </Box>
  );
});

export default Settings;
```

### 2. Import in App.tsx

```typescript
import Settings from './ui/Settings.js';
```

### 3. Add to Render Tree

```typescript
return (
  <Box flexDirection="column">
    <NowPlaying track={currentTrack} status={status} />
    <Settings 
      repeat={status?.repeat || false}
      random={status?.random || false}
      volume={status?.volume || 0}
    />
    {/* other components */}
  </Box>
);
```

### 4. Follow Best Practices

- Use TypeScript with proper interfaces
- Wrap with `memo()` to prevent unnecessary re-renders
- Extract helper functions outside the component
- Use `useMemo()` for derived state
- Use `useCallback()` for event handlers

## Dependency Management

### Adding Dependencies

```bash
# Add production dependency
bun add package-name

# Add dev dependency
bun add -d package-name

# Or with npm
npm install package-name
npm install --save-dev package-name
```

Before adding a dependency, consider:
- Is it actively maintained?
- What's the bundle size impact?
- Can we implement it ourselves easily?
- Are there better alternatives?

### Updating Dependencies

```bash
# Update all dependencies
bun update

# Update specific package
bun update package-name

# Check for outdated packages
bun outdated
```

Update dependencies regularly but test thoroughly after updates.

### Security Auditing

```bash
# Check for vulnerabilities
bun audit

# With npm
npm audit
npm audit fix
```

Run audit before releases and address high/critical vulnerabilities.

### Dependency Guidelines

**Prefer smaller, focused packages** over large frameworks.

**Pin versions carefully**:
- Major versions in `package.json` (e.g., `^4.4.1`)
- Exact versions in `package-lock.json` (committed)

**Document why dependencies are needed**:
- `ink` - Terminal UI framework
- `mpc-js` - MPD protocol client
- `zod` - Runtime type validation
- `boxen` - Fancy terminal boxes
- `chalk` - Terminal colors

### Removing Dependencies

When removing a dependency:
1. Remove import statements
2. Run `bun remove package-name`
3. Update documentation if mentioned
4. Test that everything still works

## Documentation Standards

### What to Document

**Public APIs**: All exported functions, classes, and types.

**Complex logic**: Algorithms that aren't immediately obvious.

**External integrations**: API clients, protocol implementations.

**Configuration**: Environment variables, config files.

**User-facing features**: How to use new commands or UI.

### Don't document:
- Obvious code (e.g., getters/setters)
- Implementation details users don't need
- Temporary/debug code

### How to Write Documentation

**Use clear, direct language**. Skip AI-sounding phrases like "serves as", "showcasing", "leverages".

**Be specific**. Instead of "handles errors gracefully", write "returns null if connection fails".

**Show examples**:

```typescript
/**
 * Searches MPD library for tracks matching query.
 * 
 * @param query - Search string (e.g., "artist:Beatles")
 * @param limit - Max results to return (default: 50)
 * @returns Array of matching tracks, empty array if none found
 * 
 * @example
 * const tracks = await mpd.search('jazz', 20);
 * console.log(`Found ${tracks.length} jazz tracks`);
 */
async search(query: string, limit = 50): Promise<Track[]> {
  // Implementation
}
```

**Keep it up to date**. When code changes, update the docs immediately.

### Documentation Files

**README.md**: Quick overview, installation, basic usage.

**SETUP.md**: Detailed installation and configuration.

**USER_GUIDE.md**: How to use all features.

**API_REFERENCE.md**: All commands and options.

**ARCHITECTURE.md**: System design and structure.

**CONTRIBUTING.md**: Quick contribution guide.

**DEVELOPMENT.md** (this file): Everything for developers.

**TROUBLESHOOTING.md**: Common problems and solutions.

**FAQ.md**: Frequently asked questions.

### Code Comments

Use comments sparingly. Good code should be self-documenting through:
- Clear variable names
- Small, focused functions
- Descriptive type definitions

Use comments when:
- Explaining why (not what)
- Documenting gotchas
- Linking to external resources
- Explaining performance trade-offs

```typescript
// Good - explains why
// MusicBrainz requires 1 req/sec rate limit per their guidelines
await this.rateLimiter.wait(1000);

// Bad - states the obvious
// Set volume to 50
setVolume(50);
```

### Markdown Style

- Use `#` headers (not underlines)
- Use `**bold**` for emphasis (not _italic_)
- Use fenced code blocks with language tags
- Use relative links to other docs
- Break long lines at ~80 chars for readability

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

Current version is in `package.json`.

### Creating a Release

1. **Prepare the release**:
   ```bash
   # Update version in package.json
   # Use semver: major.minor.patch
   ```

2. **Update CHANGELOG.md**:
   ```markdown
   ## [1.2.0] - 2024-01-15
   
   ### Added
   - Google Gemini AI provider support
   - Settings panel in UI
   
   ### Fixed
   - Queue scrolling with large playlists
   - MPD reconnection on network change
   
   ### Changed
   - Improved error messages for AI failures
   ```

3. **Build and test**:
   ```bash
   bun run type-check
   bun run build
   bun start
   # Test all features manually
   ```

4. **Commit and tag**:
   ```bash
   git add .
   git commit -m "chore: bump version to 1.2.0"
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin main --tags
   ```

5. **Create GitHub release**:
   - Go to GitHub releases
   - Create new release from tag
   - Copy changelog section to release notes
   - Attach built artifacts if needed

### Pre-release Checklist

Before releasing:
- [ ] All tests pass (when we have tests)
- [ ] Type checking passes (`bun run type-check`)
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated
- [ ] No console.log statements (only console.error for debugging)
- [ ] Dependencies are up to date
- [ ] Security audit is clean (`bun audit`)
- [ ] Manual testing completed

### Publishing to npm

If/when we publish to npm:

```bash
# Login to npm
npm login

# Publish
npm publish

# Or publish with tag
npm publish --tag beta
```

Update registry info in `package.json` before publishing.

### Release Frequency

- Patch releases: As needed for bugs
- Minor releases: Monthly or when features are ready
- Major releases: Rare, only for breaking changes

Don't rush releases. Better to delay than ship broken code.

---

## Getting Help

Stuck on something? Here's what to do:

1. Check existing documentation (this file, ARCHITECTURE.md, etc.)
2. Search GitHub issues for similar problems
3. Ask in GitHub discussions
4. Open an issue with details about what you tried

When asking for help, include:
- What you're trying to do
- What you've tried
- Error messages or logs
- Environment info (OS, bun/Node version, MPD version)

Good luck building! The codebase is well-structured and easy to navigate once you understand the module boundaries.
