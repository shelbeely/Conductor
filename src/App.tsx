/**
 * Main App Component
 * Orchestrates all modules and renders the TUI
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { MPDClient, type TrackInfo, type PlayerStatus } from './mpd/client';
import { AIAgent, type AIProviderConfig, type ToolCall } from './ai/agent';
import { MusicBrainzClient, type EnrichedTrack } from './metadata/musicbrainz';
import { AlbumArtManager } from './art/display';
import { NowPlaying } from './ui/NowPlaying';
import { Queue } from './ui/Queue';
import { Visualizer } from './ui/Visualizer';
import { CommandInput } from './ui/CommandInput';

interface AppProps {
  mpdHost?: string;
  mpdPort?: number;
  aiProvider?: 'openrouter' | 'ollama' | 'anthropic';
  aiApiKey?: string;
  aiModel?: string;
  aiBaseURL?: string;
}

export const App: React.FC<AppProps> = ({
  mpdHost = 'localhost',
  mpdPort = 6600,
  aiProvider = 'ollama',
  aiApiKey,
  aiModel,
  aiBaseURL,
}) => {
  const { exit } = useApp();

  // State
  const [mpdClient] = useState(() => new MPDClient({ host: mpdHost, port: mpdPort }));
  const [aiAgent] = useState(() => {
    const config: AIProviderConfig = {
      provider: aiProvider,
      apiKey: aiApiKey,
      model: aiModel,
      baseURL: aiBaseURL,
    };
    return new AIAgent(config);
  });
  const [mbClient] = useState(() => new MusicBrainzClient());
  const [artManager] = useState(() => new AlbumArtManager());

  const [connected, setConnected] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<EnrichedTrack | null>(null);
  const [status, setStatus] = useState<PlayerStatus | null>(null);
  const [queue, setQueue] = useState<TrackInfo[]>([]);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [albumArtAscii, setAlbumArtAscii] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        // Connect to MPD
        await mpdClient.connect();
        setConnected(true);
        setError('');

        // Initialize album art
        await artManager.initialize();

        // Initial data fetch
        await updatePlayerState();
      } catch (err) {
        setError(`Failed to connect to MPD: ${err}`);
        setConnected(false);
      }
    };

    init();

    // Cleanup
    return () => {
      mpdClient.disconnect();
      artManager.cleanup();
    };
  }, []);

  // Poll for updates
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(updatePlayerState, 1000);
    return () => clearInterval(interval);
  }, [connected]);

  // Update player state
  const updatePlayerState = async () => {
    try {
      const [newStatus, newTrack, newQueue] = await Promise.all([
        mpdClient.getStatus(),
        mpdClient.getCurrentSong(),
        mpdClient.getQueue(),
      ]);

      setStatus(newStatus);
      setQueue(newQueue);

      if (newTrack && newTrack.file !== currentTrack?.file) {
        // Enrich track with metadata
        const enriched = await mbClient.enrichTrack(newTrack);
        setCurrentTrack(enriched);

        // Update album art
        if (enriched.releaseInfo?.coverArtUrl && artManager.isAvailable()) {
          await artManager.displayArt(enriched.releaseInfo.coverArtUrl, {
            x: 2,
            y: 2,
            width: 30,
            height: 30,
          });
        } else if (enriched.title && enriched.artist) {
          // Fallback to ASCII art
          const ascii = artManager.generateAsciiArt(
            enriched.title,
            enriched.artist || 'Unknown'
          );
          setAlbumArtAscii(ascii);
        }
      }
    } catch (err) {
      console.error('Error updating player state:', err);
    }
  };

  // Handle AI commands
  const handleCommand = async (command: string) => {
    setIsProcessing(true);
    setAiResponse('Thinking...');

    try {
      const response = await aiAgent.processCommand(command);
      setAiResponse(response.message || 'Command processed');

      // Execute tool calls
      if (response.toolCalls) {
        await executeToolCalls(response.toolCalls);
      }

      // Update state after command
      await updatePlayerState();
    } catch (err) {
      setAiResponse(`Error: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute tool calls from AI
  const executeToolCalls = async (toolCalls: ToolCall[]) => {
    for (const call of toolCalls) {
      try {
        switch (call.name) {
          case 'search_music':
            await handleSearch(call.arguments);
            break;
          case 'play_music':
            await handlePlay(call.arguments);
            break;
          case 'queue_music':
            await handleQueue(call.arguments);
            break;
          case 'control_playback':
            await handleControl(call.arguments);
            break;
          case 'set_volume':
            await mpdClient.setVolume(call.arguments.volume);
            break;
          case 'toggle_setting':
            await handleToggleSetting(call.arguments);
            break;
          case 'get_queue':
            // Already have queue in state
            break;
          case 'clear_queue':
            if (call.arguments.confirm) {
              await mpdClient.clearQueue();
            }
            break;
        }
      } catch (err) {
        console.error(`Error executing ${call.name}:`, err);
      }
    }
  };

  const handleSearch = async (args: any) => {
    const results = await mpdClient.search(args.type || 'any', args.query);
    setAiResponse(`Found ${results.length} results for "${args.query}"`);
  };

  const handlePlay = async (args: any) => {
    if (args.position !== undefined) {
      await mpdClient.play(args.position);
    } else if (args.query) {
      // Search and play first result
      const results = await mpdClient.search('any', args.query);
      if (results.length > 0) {
        await mpdClient.clearQueue();
        await mpdClient.addToQueue(results[0].file);
        await mpdClient.play(0);
      }
    } else {
      await mpdClient.play();
    }
  };

  const handleQueue = async (args: any) => {
    const results = await mpdClient.search('any', args.query);
    for (const result of results.slice(0, 10)) {
      await mpdClient.addToQueue(result.file);
    }
  };

  const handleControl = async (args: any) => {
    switch (args.action) {
      case 'play':
        await mpdClient.play();
        break;
      case 'pause':
        await mpdClient.pause();
        break;
      case 'stop':
        await mpdClient.stop();
        break;
      case 'next':
        await mpdClient.next();
        break;
      case 'previous':
        await mpdClient.previous();
        break;
      case 'toggle':
        if (status?.state === 'play') {
          await mpdClient.pause();
        } else {
          await mpdClient.play();
        }
        break;
    }
  };

  const handleToggleSetting = async (args: any) => {
    switch (args.setting) {
      case 'repeat':
        await mpdClient.toggleRepeat();
        break;
      case 'random':
        await mpdClient.toggleRandom();
        break;
    }
  };

  // Render
  if (error) {
    return (
      <Box padding={1} borderStyle="round" borderColor="red">
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  if (!connected) {
    return (
      <Box padding={1}>
        <Text color="yellow">Connecting to MPD...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🎵 CONDUCTOR - AI Music Player
        </Text>
        <Text color="gray"> | MPD Client with {aiProvider} AI</Text>
      </Box>

      <Box flexDirection="row" marginBottom={1}>
        <Box flexDirection="column" flexGrow={1} marginRight={1}>
          <NowPlaying
            track={currentTrack}
            status={status}
            showAlbumArt={!artManager.isAvailable()}
            albumArtAscii={albumArtAscii}
          />
        </Box>

        <Box flexDirection="column" width={50}>
          <Queue queue={queue} currentPosition={status?.song} maxItems={8} />
        </Box>
      </Box>

      <Box flexDirection="row" marginBottom={1}>
        <Box flexGrow={1}>
          <Visualizer isPlaying={status?.state === 'play'} volume={status?.volume || 0} />
        </Box>
      </Box>

      <CommandInput
        onCommand={handleCommand}
        aiResponse={aiResponse}
        isProcessing={isProcessing}
      />
    </Box>
  );
};
