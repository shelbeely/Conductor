# GitHub Copilot Instructions for Conductor

## Project Overview

Conductor is a Linux-first TUI music player built with bun.js, TypeScript, and Ink that controls MPD (Music Player Daemon) with AI-powered natural language commands.

## Development Guidelines

### React Best Practices

This project follows the [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) for optimal performance and code quality.

**Key practices implemented:**

1. **Re-render Optimization** (MEDIUM impact)
   - Helper functions hoisted outside components
   - Components wrapped with `React.memo()` 
   - `useMemo()` for derived state
   - `useCallback()` for stable function references
   - Lazy state initialization with function initializers
   - Functional `setState` updates

2. **Rendering Performance** (MEDIUM impact)
   - Static JSX elements hoisted outside render
   - Explicit conditional rendering patterns

3. **Component Structure**
   - UI components in `src/ui/` 
   - All React components use TypeScript with strict types
   - Ink (React for CLI) for terminal UI

### Code Quality Standards

- **TypeScript**: Strict mode enabled, all code must type-check
- **Type Safety**: Runtime type guards for external data (MPD, API responses)
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **Performance**: Optimized re-renders, memoization where beneficial

### Architecture

- **Modular Design**: Clear separation of concerns (MPD, AI, Metadata, Art, UI)
- **AI Integration**: Multi-provider support (OpenRouter, Ollama, Anthropic)
- **Metadata**: MusicBrainz API with caching and rate limiting
- **Album Art**: Überzug++ with ASCII fallback

## When Making Changes

### For React/UI Components

- Always hoist helper functions outside the component
- Use `React.memo()` for components that receive props
- Use `useMemo()` for expensive computations or derived state
- Use `useCallback()` for functions passed as props
- Use lazy initialization for expensive initial state: `useState(() => expensiveComputation())`
- Use functional updates for state that depends on previous state: `setState(prev => ...)`

### For Type Safety

- Define proper TypeScript interfaces for all data structures
- Use type guards for runtime validation of external data
- Avoid `any` types - use proper interfaces or `unknown` with guards
- Use Zod schemas for validation where appropriate

### For Performance

- Avoid recreating functions/objects on every render
- Memoize expensive operations
- Use proper dependency arrays in `useEffect` and `useCallback`
- Consider bundle size impact when adding dependencies

## Testing & Validation

Before committing:
1. Run `npm run type-check` to verify TypeScript
2. Run `npm run build` to ensure clean compilation
3. Test the affected functionality manually if possible

## Reference Documentation

- **React Best Practices**: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
- **Project Architecture**: See `ARCHITECTURE.md`
- **Setup Guide**: See `SETUP.md`
- **Contributing**: See `CONTRIBUTING.md`
