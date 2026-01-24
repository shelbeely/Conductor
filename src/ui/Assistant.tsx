/**
 * Assistant Component
 * A friendly robot guide that helps users through the setup wizard
 */

import React from 'react';
import { Box, Text } from 'ink';

export type AssistantMode = 'guided' | 'fast' | 'silent';
export type AssistantState = 'idle' | 'thinking' | 'success' | 'warning' | 'error';

interface AssistantProps {
  mode: AssistantMode;
  state?: AssistantState;
  message: string;
  compact?: boolean;
}

// Assistant face representations for different states
const ASSISTANT_FACES = {
  idle: '[◉_◉]',
  thinking: '[◉~◉]',
  success: '[◉‿◉]',
  warning: '[◉_◉]',
  error: '[◉︵◉]',
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

export const Assistant = React.memo(({ mode, state = 'idle', message, compact = false }: AssistantProps) => {
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

  const face = ASSISTANT_FACES[state];
  const color = state === 'error' ? 'red' : state === 'warning' ? 'yellow' : state === 'success' ? 'green' : 'cyan';

  if (compact) {
    return (
      <Box>
        <Text color={color}>{face} </Text>
        <Text dimColor>{message}</Text>
      </Box>
    );
  }

  return (
    <Box padding={1} borderStyle="round" borderColor={color}>
      <Box flexDirection="column">
        <Box>
          <Text color={color} bold>{face} Assistant</Text>
        </Box>
        <Box marginTop={1}>
          <Text>{message}</Text>
        </Box>
      </Box>
    </Box>
  );
});

Assistant.displayName = 'Assistant';

// Context-specific assistant messages
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
