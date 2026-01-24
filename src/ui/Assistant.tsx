/**
 * Assistant Component
 * A friendly robot guide that helps users throughout the Conductor app
 * Can be used in the wizard, main app, or anywhere assistance is needed
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

export type AssistantMode = 'guided' | 'fast' | 'silent';
export type AssistantState = 'idle' | 'thinking' | 'success' | 'warning' | 'error' | 'happy' | 'excited' | 'working';

interface AssistantProps {
  mode: AssistantMode;
  state?: AssistantState;
  message: string;
  compact?: boolean;
  animate?: boolean;
}

// Expanded assistant face representations with more expressions
const ASSISTANT_FACES = {
  idle: '[◉_◉]',
  thinking: ['[◉~◉]', '[◉≖◉]', '[◉~◉]', '[◉≖◉]'], // Animated - alternating
  success: '[◉‿◉]',
  warning: '[◉_◉]',
  error: '[◉︵◉]',
  happy: '[◉ᵕ◉]',
  excited: ['[◉✧◉]', '[◉▣◉]', '[◉✧◉]'], // Animated - sparkly
  working: ['[◉~◉]', '[◉≖◉]', '[◉▣◉]', '[◉≖◉]'], // Animated - busy
} as const;

// Color mapping for different states
const STATE_COLORS = {
  idle: 'cyan',
  thinking: 'blue',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  happy: 'green',
  excited: 'magenta',
  working: 'cyan',
} as const;

// Hoisted helper to determine if we should show message based on mode
const shouldShowMessage = (mode: AssistantMode, messageType: 'info' | 'warning' | 'error'): boolean => {
  if (mode === 'silent') {
    return messageType === 'error' || messageType === 'warning';
  }
  if (mode === 'fast') {
    return messageType === 'warning' || messageType === 'error';
  }
  return true; // guided mode shows everything
};

export const Assistant = React.memo(({ 
  mode, 
  state = 'idle', 
  message, 
  compact = false,
  animate = true 
}: AssistantProps) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  
  // Determine message type from state
  const messageType = state === 'error' ? 'error' : state === 'warning' ? 'warning' : 'info';
  
  // Don't render if mode doesn't allow this message type
  if (!shouldShowMessage(mode, messageType)) {
    return null;
  }

  // Don't render if no message
  if (!message || message.trim() === '') {
    return null;
  }

  const faces = ASSISTANT_FACES[state];
  const color = STATE_COLORS[state];
  
  // Determine if this state uses animation
  const isAnimated = Array.isArray(faces);
  
  // Animation effect for states with multiple frames
  useEffect(() => {
    if (!isAnimated || !animate) return;
    
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % (faces as string[]).length);
    }, 300); // Change frame every 300ms
    
    return () => clearInterval(interval);
  }, [isAnimated, faces, animate]);
  
  // Get current face
  const currentFace = isAnimated ? (faces as string[])[animationFrame] : faces;

  if (compact) {
    return (
      <Box>
        <Text color={color} bold>{currentFace} </Text>
        <Text dimColor>{message}</Text>
      </Box>
    );
  }

  return (
    <Box padding={1} borderStyle="round" borderColor={color}>
      <Box flexDirection="column">
        <Box>
          <Text color={color} bold>{currentFace} Assistant</Text>
        </Box>
        <Box marginTop={1}>
          <Text>{message}</Text>
        </Box>
      </Box>
    </Box>
  );
});

Assistant.displayName = 'Assistant';

// Context-specific assistant messages for wizard
export const AssistantMessages = {
  welcome: {
    guided: "Hey there! I'm your setup assistant. I'll help you get Conductor up and running. Don't worry - I'll explain everything as we go, and if something goes wrong, we can always fix it together!",
    fast: "Quick setup mode active. I'll stay out of your way but warn you about important stuff.",
    silent: "", // Silent mode shows nothing here
  },
  
  aiSetup: {
    guided: "First, let's configure your AI. This is what powers natural language commands like 'play some jazz'. OpenRouter is recommended because it gives you access to multiple AI models - but any option works!",
    fast: "Configuring AI provider for natural language commands.",
    silent: "",
  },
  
  aiTesting: {
    guided: "Let me test the connection to make sure everything works. This just sends a simple test message to verify your API key and configuration are correct.",
    fast: "Testing AI connection...",
    silent: "",
  },
  
  beforeMPDInstall: {
    guided: "MPD (Music Player Daemon) is the heart of Conductor - it actually plays your music. I'll install it using your system's package manager, create a config file in ~/.config/mpd/, and start the service. Don't worry, you can always uninstall it later!",
    fast: "Installing MPD via system package manager. Will create config and start service.",
    silent: "",
  },
  
  beforeOllamaInstall: {
    guided: "Ollama lets you run AI locally instead of using cloud services. This is optional but great if you want privacy or don't want to pay per request. Note: The models can be large (4-8GB), so make sure you have space!",
    fast: "Installing Ollama for local AI. Models are 4-8GB.",
    silent: "",
  },
  
  beforeBarkInstall: {
    guided: "Bark TTS adds AI DJ hosts that can talk about your music! It supports natural sounds like [laughter] and [sighs]. This is optional and requires about 2GB of model downloads. It's super fun but you can skip it!",
    fast: "Installing Bark TTS (~2GB). Optional feature.",
    silent: "",
  },
  
  beforeUeberzugInstall: {
    guided: "Überzug++ shows album art right in your terminal - pretty cool! If it doesn't work, Conductor falls back to ASCII art automatically. This is optional.",
    fast: "Installing Überzug++ for terminal album art.",
    silent: "",
  },
  
  beforeEnvWrite: {
    guided: "I'm about to save your configuration to a .env file. If you already have one, I'll back it up first as .env.backup just in case!",
    fast: "Writing .env file (backing up existing if present).",
    silent: "",
  },
  
  beforeUninstall: {
    guided: "Just so you know, I'm about to remove these components from your system. Your music files and other data will stay safe - I'm only removing the programs themselves.",
    fast: "Uninstalling selected components. Music files unaffected.",
    silent: "",
  },
  
  error: {
    generic: "Oops! Something didn't work as expected. But don't worry - this is totally fixable. Let's figure out what went wrong.",
    connection: "Couldn't connect to the service. This usually means it's not running yet or there's a network issue. We can retry or troubleshoot together!",
    permission: "Looks like we need permission to do that. Some installations need sudo/admin access. Would you like to try again with elevated permissions?",
    notFound: "Hmm, I couldn't find that. Maybe it's not installed yet or the path is different on your system. Let's try another approach!",
  },
  
  success: {
    component: "Success! That component is now installed and ready to go. ✓",
    test: "Perfect! The connection test passed. Everything's working great!",
    complete: "Awesome! Setup is complete. You're all set to start using Conductor. Have fun! 🎉",
  },
  
  warning: {
    sudo: "This next step needs administrator permissions. I'll run: sudo [command]. You might be asked for your password.",
    overwrite: "There's already a file there. I can back it up first if you'd like, or we can skip this step.",
    diskSpace: "Heads up: This will download several gigabytes. Make sure you have enough disk space!",
  },
  
  // Messages for main app usage
  app: {
    connecting: {
      guided: "Connecting to MPD (Music Player Daemon). This is what actually plays your music!",
      fast: "Connecting to MPD...",
      silent: "",
    },
    connected: {
      guided: "Connected! Everything's ready. You can now use natural language commands like 'play some jazz' or 'skip to next song'.",
      fast: "Connected to MPD.",
      silent: "",
    },
    aiProcessing: {
      guided: "Let me think about that command and figure out what you want me to do...",
      fast: "Processing command...",
      silent: "",
    },
    searchingMusic: {
      guided: "Searching through your music library to find what you're looking for...",
      fast: "Searching...",
      silent: "",
    },
    generatingPlaylist: {
      guided: "Creating a playlist based on what you asked for. I'll look at your library and pick tracks that match!",
      fast: "Generating playlist...",
      silent: "",
    },
    loadingMetadata: {
      guided: "Fetching additional information about this track from MusicBrainz. This helps me tell you more about the artist and album!",
      fast: "Loading metadata...",
      silent: "",
    },
    connectionLost: {
      guided: "Oops! Lost connection to MPD. Don't worry - I'll try to reconnect automatically. Your music and playlists are safe!",
      fast: "Connection lost. Reconnecting...",
      silent: "",
    },
  },
};

// Helper to get the appropriate message based on mode
export const getAssistantMessage = (mode: AssistantMode, messageKey: keyof typeof AssistantMessages, subKey?: string): string => {
  const messages = AssistantMessages[messageKey];
  if (typeof messages === 'string') {
    return messages;
  }
  
  if (subKey && typeof messages === 'object' && subKey in messages) {
    return (messages as any)[subKey];
  }
  
  if (typeof messages === 'object' && mode in messages) {
    return (messages as any)[mode];
  }
  
  return '';
};
