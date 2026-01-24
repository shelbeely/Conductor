#!/usr/bin/env tsx

/**
 * Mobile UI Demo - Standalone demo of the mobile UI without MPD
 * This shows the UI components and navigation working
 */

import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { NavigationProvider, useNavigation } from './navigation/NavigationContext';
import Router from './navigation/Router';
import TopBar from './ui/mobile/components/TopBar';
import BottomNav, { NavItem } from './ui/mobile/components/BottomNav';
import Toast from './ui/mobile/components/Toast';
import Modal from './ui/mobile/components/Modal';

// Demo Screens
import HomeScreen from './ui/mobile/screens/HomeScreen';
import QueueScreen from './ui/mobile/screens/QueueScreen';
import SearchScreen from './ui/mobile/screens/SearchScreen';
import SettingsScreen from './ui/mobile/screens/SettingsScreen';
import HelpScreen from './ui/mobile/screens/HelpScreen';

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🎵', shortcut: '1' },
  { id: 'queue', label: 'Queue', icon: '📜', shortcut: '2' },
  { id: 'search', label: 'Search', icon: '🔍', shortcut: '3' },
  { id: 'settings', label: 'Settings', icon: '⚙', shortcut: '4' },
];

// Mock data
const mockTrack = {
  title: 'Bohemian Rhapsody',
  artist: 'Queen',
  album: 'A Night at the Opera',
  file: '/music/queen/bohemian.mp3',
};

const mockStatus = {
  state: 'play' as const,
  elapsed: 125,
  duration: 354,
};

const mockQueue = [
  { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera' },
  { title: 'We Will Rock You', artist: 'Queen', album: 'News of the World' },
  { title: 'Another One Bites the Dust', artist: 'Queen', album: 'The Game' },
  { title: 'Under Pressure', artist: 'Queen & David Bowie', album: 'Hot Space' },
  { title: 'Somebody to Love', artist: 'Queen', album: 'A Day at the Races' },
  { title: 'Killer Queen', artist: 'Queen', album: 'Sheer Heart Attack' },
  { title: 'Radio Ga Ga', artist: 'Queen', album: 'The Works' },
  { title: 'I Want to Break Free', artist: 'Queen', album: 'The Works' },
];

const DemoContent: React.FC = () => {
  const { state: navState, push, pop, replace, canGoBack } = useNavigation();
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Global keyboard shortcuts
  useInput((input, key) => {
    if (input === '1') {
      replace('home');
    } else if (input === '2') {
      replace('queue');
    } else if (input === '3') {
      replace('search');
    } else if (input === '4') {
      replace('settings');
    } else if ((key.escape || input === 'b') && canGoBack()) {
      if (showHelp) {
        setShowHelp(false);
      } else {
        pop();
      }
    } else if (input === '?') {
      setShowHelp(true);
    } else if (input === ' ') {
      showToast('Play/Pause toggled', 'info');
    } else if (input === 'n') {
      showToast('Next track', 'info');
    } else if (input === 'p') {
      showToast('Previous track', 'info');
    } else if (input === '/') {
      push('search');
    } else if (input === 'q' && key.ctrl) {
      process.exit(0);
    }
  });

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
  };

  const handleDismissToast = () => {
    setToast(null);
  };

  const screens = [
    {
      id: 'home' as const,
      title: 'Conductor',
      component: HomeScreen,
    },
    {
      id: 'queue' as const,
      title: 'Queue',
      component: QueueScreen,
    },
    {
      id: 'search' as const,
      title: 'Search',
      component: SearchScreen,
    },
    {
      id: 'settings' as const,
      title: 'Settings',
      component: SettingsScreen,
    },
  ];

  const currentScreen = screens.find((s) => s.id === navState.currentScreen);

  return (
    <Box flexDirection="column" minHeight={24}>
      {/* Top Bar */}
      <TopBar
        title={currentScreen?.title || 'Conductor'}
        showBack={canGoBack()}
        onBack={() => pop()}
      />

      {/* Content Area */}
      <Box flexGrow={1} flexDirection="column">
        <Router
          screens={screens}
          screenProps={{
            currentTrack: mockTrack,
            status: mockStatus,
            queue: mockQueue,
            currentIndex: 0,
            onSelectTrack: (idx: number) => {
              showToast(`Playing track ${idx + 1}`, 'success');
              replace('home');
            },
            onShowQueue: () => push('queue'),
            onShowLyrics: () => showToast('Lyrics coming soon', 'info'),
            aiProvider: 'openrouter',
            ttsEnabled: false,
            visualizerEnabled: false,
          }}
        />
      </Box>

      {/* Bottom Navigation */}
      <BottomNav
        items={navItems}
        activeId={navState.currentScreen}
        onNavigate={(id) => replace(id as any)}
      />

      {/* Toast Notification */}
      {toast && (
        <Box marginTop={1}>
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={handleDismissToast}
          />
        </Box>
      )}

      {/* Help Modal */}
      {showHelp && (
        <Box marginTop={1}>
          <Modal visible={showHelp} title="Help" onClose={() => setShowHelp(false)}>
            <HelpScreen />
          </Modal>
        </Box>
      )}
    </Box>
  );
};

const Demo: React.FC = () => {
  return (
    <NavigationProvider initialScreen="home">
      <DemoContent />
    </NavigationProvider>
  );
};

// Banner
console.log(`
╔═══════════════════════════════════════════════╗
║  🎵 CONDUCTOR - Mobile UI Demo                ║
║  Press ? for help, Ctrl+Q to quit             ║
╚═══════════════════════════════════════════════╝
`);

// Render the demo
render(<Demo />);
