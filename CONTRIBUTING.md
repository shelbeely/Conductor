# Contributing to Conductor

Thank you for your interest in contributing to Conductor!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `bun install` or `npm install`
3. Make your changes
4. Test your changes: `bun run dev`
5. Run type checking: `bun run type-check`
6. Submit a pull request

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### React Best Practices

This project follows the [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) for UI components. Key guidelines:

- **Hoist helper functions** outside components to prevent re-creation on every render
- **Use React.memo()** to prevent unnecessary re-renders for components with props
- **Use useMemo()** for expensive computations or derived state
- **Use useCallback()** for functions passed as props to maintain stable references
- **Use lazy initialization** for expensive initial state: `useState(() => computation())`
- **Use functional setState** when state depends on previous value: `setState(prev => ...)`

See `.github/copilot-instructions.md` for complete guidelines.

## Module Structure

```
src/
├── mpd/       - MPD client and communication
├── ai/        - AI agent and provider integrations
├── metadata/  - MusicBrainz and metadata enrichment
├── art/       - Album art display logic
├── ui/        - React/Ink UI components
├── utils/     - Shared utilities (future)
├── App.tsx    - Main application component
└── index.tsx  - Entry point
```

## Adding New Features

### Adding a New AI Provider

1. Create a new provider class in `src/ai/agent.ts` extending `AIProvider`
2. Implement the `processCommand()` method
3. Add the provider to the `AIAgent` switch statement
4. Update configuration types and documentation

### Adding New Tool Schemas

1. Define the schema using Zod in `src/ai/agent.ts`
2. Add to the `tools` array
3. Implement the handler in `App.tsx` `executeToolCalls()`
4. Update documentation

### Adding UI Components

1. Create component in `src/ui/`
2. Use Ink components (Box, Text, useInput, etc.)
3. Follow existing component patterns
4. Import and use in `App.tsx`

## Testing

Currently, testing is manual. To test:

1. Ensure MPD is running with test music
2. Run the app: `bun run dev`
3. Test all features:
   - Natural language commands
   - Playback controls
   - Queue management
   - Metadata display
   - Error handling

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation for new features
- Ensure code builds without errors
- Test your changes thoroughly
- Write clear commit messages

## Reporting Issues

When reporting bugs, please include:
- OS and version
- bun/Node.js version
- MPD version
- AI provider being used
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

## Feature Requests

We welcome feature requests! Please:
- Check if it's already been requested
- Describe the use case
- Explain the expected behavior
- Consider submitting a PR if you can implement it

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for helping make Conductor better! 🎵
