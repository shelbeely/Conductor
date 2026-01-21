#!/usr/bin/env bun

/**
 * Conductor - AI-Powered TUI Music Player
 * Entry point for the application
 */

import React from 'react';
import { render } from 'ink';
import { App } from './App';

// Configuration from environment or defaults
const config = {
  mpdHost: process.env.MPD_HOST || 'localhost',
  mpdPort: parseInt(process.env.MPD_PORT || '6600'),
  aiProvider: (process.env.AI_PROVIDER || 'ollama') as 'openrouter' | 'ollama' | 'anthropic',
  aiApiKey: process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY,
  aiModel: process.env.AI_MODEL,
  aiBaseURL: process.env.AI_BASE_URL || process.env.OLLAMA_BASE_URL,
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

console.log('Configuration:');
console.log(`  MPD: ${config.mpdHost}:${config.mpdPort}`);
console.log(`  AI Provider: ${config.aiProvider}`);
if (config.aiModel) {
  console.log(`  AI Model: ${config.aiModel}`);
}
console.log('');

// Render the app
const { unmount, waitUntilExit } = render(<App {...config} />);

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
