#!/usr/bin/env bun

/**
 * Conductor - AI-Powered TUI Music Player
 * Entry point for the application
 */

import React, { useState } from 'react';
import { render } from 'ink';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { App } from './App';
import MobileApp from './MobileApp';
import { SetupWizard } from './ui/SetupWizard';

// Check command line arguments
const args = process.argv.slice(2);
const forceSetup = args.includes('--setup');
const mobileMode = args.includes('--mobile');
const autoDetectMobile = !args.includes('--no-auto-detect');

// Check if setup is needed
const stateFile = path.join(process.cwd(), '.conductor-setup-state.json');
let needsSetup = forceSetup;

if (!forceSetup && existsSync(stateFile)) {
  try {
    const state = JSON.parse(readFileSync(stateFile, 'utf-8'));
    // Check if MPD is installed (required component)
    needsSetup = !state.mpd?.installed;
  } catch {
    // Invalid state file, needs setup
    needsSetup = true;
  }
} else if (!forceSetup) {
  // No state file, needs setup
  needsSetup = true;
}

// Auto-detect mobile mode based on terminal size
const termWidth = process.stdout.columns || 80;
const termHeight = process.stdout.rows || 24;
const shouldUseMobile = mobileMode || (autoDetectMobile && termWidth <= 60 && termHeight <= 30);

// Configuration from environment or defaults
const config = {
  mpdHost: process.env.MPD_HOST || 'localhost',
  mpdPort: parseInt(process.env.MPD_PORT || '6600'),
  aiProvider: (process.env.AI_PROVIDER || 'ollama') as 'openrouter' | 'ollama' | 'anthropic' | 'copilot',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GITHUB_TOKEN,
  aiModel: process.env.AI_MODEL,
  aiBaseURL: process.env.AI_BASE_URL || process.env.OLLAMA_BASE_URL,
  ttsEnabled: process.env.TTS_ENABLED === 'true',
  ttsProvider: (process.env.TTS_PROVIDER || 'openai') as 'piper' | 'openai',
};

// Main component that switches between wizard and app
const Main: React.FC = () => {
  const [showWizard, setShowWizard] = useState(needsSetup);

  if (showWizard) {
    return (
      <SetupWizard
        onComplete={() => setShowWizard(false)}
        onExit={() => process.exit(0)}
      />
    );
  }

  // Use mobile UI if explicitly requested or auto-detected
  if (shouldUseMobile) {
    return (
      <MobileApp
        mpdHost={config.mpdHost}
        mpdPort={config.mpdPort}
        aiProvider={config.aiProvider}
        aiApiKey={config.apiKey || ''}
        aiModel={config.aiModel || ''}
        aiBaseURL={config.aiBaseURL}
        ttsProvider={config.ttsProvider}
        ttsApiKey={config.apiKey || ''}
      />
    );
  }

  return <App {...config} aiApiKey={config.apiKey} />;
};

// Banner
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎵  CONDUCTOR - AI Music Player                        ║
║                                                           ║
║   A Linux-first TUI music player with MPD control        ║
║   Natural language commands powered by AI                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

if (needsSetup) {
  console.log('🔧 Setup required - launching interactive wizard...\n');
} else {
  console.log('Configuration:');
  console.log(`  MPD: ${config.mpdHost}:${config.mpdPort}`);
  console.log(`  AI Provider: ${config.aiProvider}`);
  if (config.aiModel) {
    console.log(`  AI Model: ${config.aiModel}`);
  }
  if (config.ttsEnabled) {
    console.log(`  TTS: ${config.ttsProvider} (enabled)`);
  }
  if (shouldUseMobile) {
    console.log(`  UI Mode: Mobile (${termWidth}x${termHeight})`);
  } else {
    console.log(`  UI Mode: Desktop`);
  }
  console.log('');
  console.log('💡 Tip: Use --mobile flag to force mobile UI, --no-auto-detect to disable auto-detection');
  console.log('');
}

// Render the app (or wizard)
const { unmount, waitUntilExit } = render(<Main />);

// Handle cleanup
process.on('SIGINT', () => {
  unmount();
  process.exit(0);
});

process.on('SIGTERM', () => {
  unmount();
  process.exit(0);
});

// Wait for exit
await waitUntilExit();
