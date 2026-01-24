/**
 * Assistant Component
 * A friendly orchestra conductor guide that helps users throughout the Conductor app
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

// Orchestra conductor assistant faces with various expressions
const ASSISTANT_FACES = {
  idle: '(/¯◡ ‿ ◡)/¯',
  thinking: ['(\\¯◡ ~ ◡)\\¯', '(/¯~ ‿ ~)/¯', '(\\¯◡ ~ ◡)\\¯'], // Animated - contemplating
  success: '(\\¯◠ ‿ ◠)\\¯', // Big smile
  warning: '(/¯◡ ‿ ◡)/¯!', // Alert conductor
  error: '(\\¯︵ ‿ ︵)\\¯', // Disappointed
  happy: '(\\¯◡ ᵕ ◡)\\¯', // Joyful
  excited: ['(\\¯✧ ‿ ✧)\\¯', '(/¯★ ‿ ★)/¯', '(\\¯✧ ‿ ✧)\\¯'], // Animated - sparkly eyes
  working: ['(/¯◡ ‿ ◡)/¯', '(\\¯◡ ‿ ◡)\\¯', '(/¯◡ ‿ ◡)/¯', '(\\¯◡ ‿ ◡)\\¯'], // Animated - conducting motion
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
          <Text color={color} bold>{currentFace} Conductor</Text>
        </Box>
        <Box marginTop={1}>
          <Text>{message}</Text>
        </Box>
      </Box>
    </Box>
  );
});

Assistant.displayName = 'Conductor';

// Context-specific assistant messages for wizard
export const AssistantMessages = {
  welcome: {
    guided: "Hey there! I'm your orchestra conductor for this setup. I'll help you get everything in harmony and ready to play. Don't worry - I'll guide you through each movement, and if something goes wrong, we can always retune together!",
    fast: "Quick setup mode active. I'll stay out of your way but signal when something important needs attention.",
    silent: "", // Silent mode shows nothing here
  },
  
  aiSetup: {
    guided: "First movement: let's configure your AI! This is what powers natural language commands like 'play some jazz'. OpenRouter is recommended because it gives you access to multiple AI models - like having a full orchestra at your fingertips!",
    fast: "Configuring AI provider for natural language commands.",
    silent: "",
  },
  
  aiTesting: {
    guided: "Let me conduct a quick sound check to make sure everything's in tune. This just sends a simple test to verify your API key and configuration are hitting the right notes.",
    fast: "Testing AI connection...",
    silent: "",
  },
  
  beforeMPDInstall: {
    guided: "MPD (Music Player Daemon) is the heart of our ensemble - it actually plays your music. I'll install it using your system's package manager, create a config file in ~/.config/mpd/, and raise the curtain on the service. Don't worry, you can always close the show later!",
    fast: "Installing MPD via system package manager. Will create config and start service.",
    silent: "",
  },
  
  beforeOllamaInstall: {
    guided: "Ollama lets you conduct AI locally instead of using cloud services. This is optional but great if you want privacy or don't want to pay per performance. Note: The models can be large (4-8GB), so make sure you have space in the concert hall!",
    fast: "Installing Ollama for local AI. Models are 4-8GB.",
    silent: "",
  },
  
  beforeBarkInstall: {
    guided: "Bark TTS adds AI DJ hosts that can talk about your music! It supports natural sounds like [laughter] and [sighs] - like having a charismatic maestro introducing each piece. This is optional and requires about 2GB of model downloads. It's super fun but you can skip it!",
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
    generic: "Oops! Hit a wrong note there. But don't worry - we can retune and try again. Let's figure out what went wrong.",
    connection: "Couldn't connect to the service. The orchestra might not be warmed up yet or there's a network issue. We can retry or troubleshoot together!",
    permission: "Looks like we need backstage access for that. Some installations need sudo/admin permissions. Would you like to try again with elevated access?",
    notFound: "Hmm, that instrument isn't in our collection yet. Maybe it's not installed or the path is different on your system. Let's try another approach!",
  },
  
  success: {
    component: "Bravo! That component is now installed and ready for the performance. ✓",
    test: "Perfect pitch! The connection test passed with flying colors. Everything's in harmony!",
    complete: "Magnificent! The orchestra is ready. You're all set to conduct your musical experience. Enjoy the show! 🎉",
  },
  
  warning: {
    sudo: "This next movement needs administrator permissions. I'll signal: sudo [command]. You might be asked for your password.",
    overwrite: "There's already sheet music there. I can archive the original first if you'd like, or we can skip this step.",
    diskSpace: "Heads up: This will download several gigabytes. Make sure you have enough space in the concert hall!",
  },
  
  // Messages for main app usage
  app: {
    connecting: {
      guided: "Tuning up the connection to MPD (Music Player Daemon). This is the orchestra that actually plays your music!",
      fast: "Connecting to MPD...",
      silent: "",
    },
    connected: {
      guided: "The orchestra is ready! You can now conduct with natural language like 'play some jazz' or 'skip to next song'.",
      fast: "Connected to MPD.",
      silent: "",
    },
    aiProcessing: {
      guided: "Reading your score and interpreting what you want the orchestra to play...",
      fast: "Processing command...",
      silent: "",
    },
    searchingMusic: {
      guided: "Searching through the sheet music collection to find what you're looking for...",
      fast: "Searching...",
      silent: "",
    },
    generatingPlaylist: {
      guided: "Composing a playlist based on your request. I'll arrange tracks from your library that hit the right notes!",
      fast: "Generating playlist...",
      silent: "",
    },
    loadingMetadata: {
      guided: "Fetching the liner notes about this track from MusicBrainz. This gives us more context about the artist and album!",
      fast: "Loading metadata...",
      silent: "",
    },
    connectionLost: {
      guided: "Oh no! The orchestra went silent. Don't worry - I'll get them back on stage automatically. Your music and playlists are safe!",
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
