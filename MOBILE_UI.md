# Mobile-App-Like TUI Layer

This document describes the new mobile-app-like TUI layer for Conductor, designed for small terminal screens and touch-friendly navigation.

## Overview

The mobile UI provides a modern, mobile-app-like experience within the terminal, optimized for small screens (40-48 columns wide, 16-30 rows tall) and simple keyboard navigation.

## Features

### Application Shell

- **Top Bar**: Shows screen title and back navigation when available
- **Scrollable Content Area**: Main content with list views, cards, and forms
- **Bottom Navigation**: 3-5 primary sections for quick access
- **Toast Notifications**: Non-intrusive feedback for actions
- **Modal Overlays**: Help screens and action sheets

### Navigation Model

Stack-based navigation similar to mobile apps:
- Bottom tabs switch between root screens
- Selecting items opens detail views
- Back button returns to previous screen
- Clean navigation stack management

### Screens

1. **Home Screen** (Tab 1) - Now Playing overview with quick actions
2. **Queue Screen** (Tab 2) - Scrollable playlist management
3. **Search Screen** (Tab 3) - Music search interface
4. **Settings Screen** (Tab 4) - App configuration
5. **Help Screen** (? key) - Keyboard shortcuts and controls

## Keyboard Shortcuts

### Navigation
- `j` / `k` - Move selection up/down
- `Tab` / `Shift+Tab` - Focus traversal
- `Enter` - Activate/open selected item
- `Esc` or `b` - Go back to previous screen
- `1-4` - Jump directly to bottom navigation tabs

### Actions
- `/` - Open search screen
- `.` - Context/actions menu (future feature)
- `?` - Show help overlay
- `Space` - Play/pause
- `n` - Next track
- `p` - Previous track

### System
- `Ctrl+C` or `Ctrl+Q` - Quit application

## Usage

### Auto-Detection Mode (Default)

The mobile UI automatically activates on small terminals (≤60 columns × ≤30 rows):

```bash
conductor
```

### Explicit Mobile Mode

Force mobile UI regardless of terminal size:

```bash
conductor --mobile
```

### Disable Auto-Detection

Use desktop UI even on small terminals:

```bash
conductor --no-auto-detect
```

### First-Time Setup

Run the setup wizard:

```bash
conductor --setup
```

## Terminal Resize Handling

The mobile UI automatically detects and responds to terminal resize events:

- Minimum size: 40×16 (shows error message if smaller)
- Optimal size: 48×24
- Maximum for auto-detection: 60×30

## Architecture

### Component Structure

```
src/
├── MobileApp.tsx                    # Main mobile app container
├── navigation/
│   ├── NavigationContext.tsx       # React context for navigation
│   ├── Router.tsx                   # Screen routing
│   └── types.ts                     # Navigation types
└── ui/mobile/
    ├── components/
    │   ├── TopBar.tsx               # App bar
    │   ├── BottomNav.tsx            # Bottom navigation
    │   ├── ListRow.tsx              # List item component
    │   ├── Card.tsx                 # Card container
    │   ├── Modal.tsx                # Modal overlay
    │   └── Toast.tsx                # Toast notification
    └── screens/
        ├── HomeScreen.tsx           # Now playing screen
        ├── QueueScreen.tsx          # Queue management
        ├── SearchScreen.tsx         # Search interface
        ├── SettingsScreen.tsx       # Settings
        └── HelpScreen.tsx           # Help overlay
```

### Service Integration

The mobile UI wraps existing Conductor services without duplicating logic:

- **MPDClient**: Music Player Daemon control
- **AIAgent**: Natural language command processing
- **TTSManager**: Text-to-speech (optional)
- **MusicBrainzClient**: Metadata enrichment
- **AlbumArtManager**: Album art display

## Design Constraints

### Target Viewport
- Width: 40-48 columns
- Height: 16-30 rows

### Input Method
- Soft keyboard friendly
- No function keys required
- One-handed operation support

### Visual Style
- Single-column layouts
- Card-based content organization
- Minimal color palette (accent, warning, error)
- Supports terminals with and without truecolor

## Accessibility

- Every screen has a clear primary action
- Text readable at small font sizes
- No horizontal scrolling
- Built-in help screen with all controls
- Visual feedback for all actions

## Future Enhancements

- Search results with scrolling
- AI command input screen
- Lyrics viewer integration
- Album art display (ASCII mode)
- Playlist creation/editing
- Volume control UI
- EQ settings
- Action sheets for context menus

## Development

### Adding New Screens

1. Create screen component in `src/ui/mobile/screens/`
2. Add screen type to `src/navigation/types.ts`
3. Register screen in `MobileApp.tsx` screens array
4. Add navigation item to bottom nav (if primary screen)

### Creating New Components

1. Create component in `src/ui/mobile/components/`
2. Follow Ink component patterns
3. Use TypeScript for type safety
4. Keep components stateless when possible
5. Support mobile-friendly keyboard navigation

### Testing

Test on various terminal sizes:

```bash
# Test mobile UI at different sizes
resize -s 24 48  # 48 columns × 24 rows
conductor --mobile

resize -s 20 40  # 40 columns × 20 rows
conductor --mobile

resize -s 16 42  # 42 columns × 16 rows (minimum)
conductor --mobile
```

## Compatibility

- **Node.js**: ≥18.0.0
- **Bun**: ≥1.0.0
- **Terminal**: Any terminal with ANSI support
- **MPD**: Compatible with existing Conductor MPD setup
- **Existing Features**: All existing CLI and desktop TUI features continue working unchanged

## License

MIT - Same as Conductor project
