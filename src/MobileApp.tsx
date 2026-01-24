import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { NavigationProvider, useNavigation } from './navigation/NavigationContext';
import Router from './navigation/Router';
import TopBar from './ui/mobile/components/TopBar';
import BottomNav, { NavItem } from './ui/mobile/components/BottomNav';
import Toast from './ui/mobile/components/Toast';
import Modal from './ui/mobile/components/Modal';

// Screens
import HomeScreen from './ui/mobile/screens/HomeScreen';
import QueueScreen from './ui/mobile/screens/QueueScreen';
import SearchScreen from './ui/mobile/screens/SearchScreen';
import SettingsScreen from './ui/mobile/screens/SettingsScreen';
import HelpScreen from './ui/mobile/screens/HelpScreen';

// Services
import { MPDClient } from './mpd/client';
import { AIAgent } from './ai/agent';
import { TTSManager } from './tts/manager';

interface MobileAppProps {
  mpdHost: string;
  mpdPort: number;
  aiProvider: string;
  aiApiKey: string;
  aiModel: string;
  aiBaseURL?: string;
  ttsProvider?: string;
  ttsApiKey?: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🎵', shortcut: '1' },
  { id: 'queue', label: 'Queue', icon: '📜', shortcut: '2' },
  { id: 'search', label: 'Search', icon: '🔍', shortcut: '3' },
  { id: 'settings', label: 'Settings', icon: '⚙', shortcut: '4' },
];

const MobileAppContent: React.FC<MobileAppProps & { 
  mpdClient: MPDClient;
  aiAgent: AIAgent;
  ttsManager: TTSManager | null;
}> = ({ mpdClient, aiAgent, ttsManager, ...config }) => {
  const { state: navState, push, pop, replace, canGoBack } = useNavigation();
  const { exit } = useApp();

  // Player state
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // UI state
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Terminal resize handling
  const [terminalSize, setTerminalSize] = useState({ width: process.stdout.columns || 48, height: process.stdout.rows || 24 });

  useEffect(() => {
    const handleResize = () => {
      setTerminalSize({ width: process.stdout.columns || 48, height: process.stdout.rows || 24 });
    };
    process.stdout.on('resize', handleResize);
    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

  // MPD status polling
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const [newStatus, newQueue] = await Promise.all([
          mpdClient.getStatus(),
          mpdClient.getQueue(),
        ]);
        setStatus(newStatus);
        setQueue(newQueue || []);

        if (newStatus?.song !== undefined) {
          setCurrentIndex(newStatus.song);
          const track = newQueue?.[newStatus.song];
          if (track) {
            setCurrentTrack(track);
          }
        }
      } catch (err) {
        console.error('MPD status error:', err);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [mpdClient]);

  // Global keyboard shortcuts
  useInput((input, key) => {
    // Bottom nav shortcuts
    if (input === '1') {
      replace('home');
    } else if (input === '2') {
      replace('queue');
    } else if (input === '3') {
      replace('search');
    } else if (input === '4') {
      replace('settings');
    } else if (input === '5' && navState.currentScreen !== 'help') {
      // Optional 5th tab or help
    }
    
    // Navigation shortcuts
    else if ((key.escape || input === 'b') && canGoBack()) {
      if (showHelp) {
        setShowHelp(false);
      } else {
        pop();
      }
    } else if (input === '?') {
      setShowHelp(true);
    }
    
    // Playback shortcuts
    else if (input === ' ') {
      handlePlayPause();
    } else if (input === 'n') {
      handleNext();
    } else if (input === 'p') {
      handlePrevious();
    }
    
    // Search shortcut
    else if (input === '/' && navState.currentScreen !== 'search') {
      push('search');
    }
    
    // Quit
    else if (input === 'q' && key.ctrl) {
      exit();
    }
  });

  const handlePlayPause = async () => {
    try {
      if (status?.state === 'play') {
        await mpdClient.pause();
        showToast('Paused', 'info');
      } else {
        await mpdClient.play();
        showToast('Playing', 'success');
      }
    } catch (err) {
      showToast('Playback error', 'error');
    }
  };

  const handleNext = async () => {
    try {
      await mpdClient.next();
      showToast('Next track', 'info');
    } catch (err) {
      showToast('Error skipping track', 'error');
    }
  };

  const handlePrevious = async () => {
    try {
      await mpdClient.previous();
      showToast('Previous track', 'info');
    } catch (err) {
      showToast('Error going back', 'error');
    }
  };

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
  };

  const handleDismissToast = () => {
    setToast(null);
  };

  const handleSelectTrack = async (index: number) => {
    try {
      await mpdClient.play(index);
      showToast('Playing track', 'success');
      replace('home');
    } catch (err) {
      showToast('Error playing track', 'error');
    }
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

  // Check if terminal is too small
  if (terminalSize.width < 40 || terminalSize.height < 16) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow" bold>
          Terminal too small!
        </Text>
        <Text>
          Minimum size: 40x16
        </Text>
        <Text>
          Current: {terminalSize.width}x{terminalSize.height}
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height={terminalSize.height}>
      {/* Top Bar */}
      <TopBar
        title={currentScreen?.title || 'Conductor'}
        showBack={canGoBack()}
        onBack={() => pop()}
      />

      {/* Content Area (scrollable) */}
      <Box flexGrow={1} flexDirection="column">
        <Router
          screens={screens}
          screenProps={{
            currentTrack,
            status,
            queue,
            currentIndex,
            onSelectTrack: handleSelectTrack,
            onShowQueue: () => push('queue'),
            onShowLyrics: () => showToast('Lyrics coming soon', 'info'),
            aiProvider: config.aiProvider,
            ttsEnabled: !!ttsManager,
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

const MobileApp: React.FC<MobileAppProps> = (props) => {
  const [mpdClient] = useState(() => new MPDClient({ host: props.mpdHost, port: props.mpdPort }));
  const [aiAgent] = useState(() => new AIAgent({
    provider: props.aiProvider as any,
    apiKey: props.aiApiKey,
    model: props.aiModel,
    baseURL: props.aiBaseURL,
  }));
  
  const [ttsManager] = useState<TTSManager | null>(() => {
    if (props.ttsProvider) {
      return new TTSManager({
        provider: props.ttsProvider as any,
        enabled: true,
        piperPath: process.env.PIPER_PATH,
        piperModelPath: process.env.PIPER_MODEL_PATH,
        openaiApiKey: props.ttsApiKey,
      });
    }
    return null;
  });

  useEffect(() => {
    return () => {
      mpdClient.disconnect();
    };
  }, [mpdClient]);

  return (
    <NavigationProvider initialScreen="home">
      <MobileAppContent
        {...props}
        mpdClient={mpdClient}
        aiAgent={aiAgent}
        ttsManager={ttsManager}
      />
    </NavigationProvider>
  );
};

export default MobileApp;
