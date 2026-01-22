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
import { TrackStory } from './ui/TrackStory';
import { TTSManager } from './tts/manager';
import type { TTSConfig } from './tts/types';

interface AppProps {
  mpdHost?: string;
  mpdPort?: number;
  aiProvider?: 'openrouter' | 'ollama' | 'anthropic';
  aiApiKey?: string;
  aiModel?: string;
  aiBaseURL?: string;
  ttsEnabled?: boolean;
  ttsProvider?: 'piper' | 'openai';
}

export const App: React.FC<AppProps> = ({
  mpdHost = 'localhost',
  mpdPort = 6600,
  aiProvider = 'ollama',
  aiApiKey,
  aiModel,
  aiBaseURL,
  ttsEnabled = false,
  ttsProvider = 'openai',
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
  const [ttsManager] = useState(() => {
    const ttsConfig: TTSConfig = {
      enabled: ttsEnabled,
      provider: ttsProvider,
      openaiApiKey: aiApiKey,
      piperPath: process.env.PIPER_PATH,
      piperModelPath: process.env.PIPER_MODEL_PATH,
    };
    return new TTSManager(ttsConfig);
  });

  const [connected, setConnected] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<EnrichedTrack | null>(null);
  const [status, setStatus] = useState<PlayerStatus | null>(null);
  const [queue, setQueue] = useState<TrackInfo[]>([]);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [albumArtAscii, setAlbumArtAscii] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<string>('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [trackStory, setTrackStory] = useState<string>('');
  const [showTrackStory, setShowTrackStory] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [ttsProgress, setTtsProgress] = useState<string>('');

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

        // Get current model
        setCurrentModel(aiAgent.getCurrentModel());

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
      // Check for special commands
      if (command.toLowerCase().includes('list model')) {
        const models = await aiAgent.listAvailableModels();
        const modelList = models.map(m => `${m.id}: ${m.name}`).join('\n');
        setAiResponse(`Available models:\n${modelList}`);
        setIsProcessing(false);
        return;
      }
      
      if (command.toLowerCase().includes('switch to')) {
        const modelMatch = command.match(/switch to (.+)/i);
        if (modelMatch) {
          const modelId = modelMatch[1].trim();
          await handleModelSelect(modelId);
          setIsProcessing(false);
          return;
        }
      }

      // Handle "beyond the beat" / track story requests
      if (command.toLowerCase().includes('beyond the beat') || 
          command.toLowerCase().includes('track story') ||
          command.toLowerCase().includes('tell me about this song') ||
          command.toLowerCase().includes('song meaning')) {
        await handleGetTrackStory({});
        setIsProcessing(false);
        return;
      }

      if (command.toLowerCase().includes('close story') || 
          command.toLowerCase().includes('hide story')) {
        setShowTrackStory(false);
        ttsManager.stop(); // Stop TTS playback
        setAiResponse('Track story closed');
        setIsProcessing(false);
        return;
      }

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
          case 'generate_playlist':
            await handleGeneratePlaylist(call.arguments);
            break;
          case 'get_track_story':
            await handleGetTrackStory(call.arguments);
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

  const handleGeneratePlaylist = async (args: any) => {
    try {
      const criteria = args.criteria || '';
      const targetLength = args.targetLength || 20;
      const shuffle = args.shuffleResults !== false;

      setAiResponse(`Generating playlist: ${criteria}...`);

      // Get all tracks from library
      const allTracks = await mpdClient.listAll();
      
      if (allTracks.length === 0) {
        setAiResponse('No tracks found in library');
        return;
      }

      // Parse criteria for advanced search terms
      const keywords = criteria.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      let selectedTracks: TrackInfo[] = [];

      // Search for tracks matching basic criteria first
      for (const keyword of keywords) {
        const results = await mpdClient.search('any', keyword);
        selectedTracks = [...selectedTracks, ...results];
      }

      // If we have enough tracks, enrich them with MusicBrainz data for advanced filtering
      if (selectedTracks.length > 0 || keywords.length === 0) {
        setAiResponse(`Enriching ${Math.min(selectedTracks.length || 50, 50)} tracks with metadata...`);
        
        // Sample tracks to enrich (limit to avoid rate limiting)
        const tracksToEnrich = selectedTracks.length > 0 
          ? selectedTracks.slice(0, 50) 
          : allTracks.sort(() => Math.random() - 0.5).slice(0, 50);
        
        const enrichedTracks = await Promise.all(
          tracksToEnrich.map(async (track) => {
            try {
              return await mbClient.enrichTrack(track);
            } catch {
              return track;
            }
          })
        );

        // Apply advanced filtering based on MusicBrainz data
        const criteriaLower = criteria.toLowerCase();
        const filtered = enrichedTracks.filter((track) => {
          // Check for instrument mentions (from release/artist info)
          if (criteriaLower.includes('violin') || criteriaLower.includes('strings')) {
            // Look in artist disambiguation or genre
            const hasStrings = track.artistInfo?.disambiguation?.toLowerCase().includes('violin') ||
                              track.artistInfo?.disambiguation?.toLowerCase().includes('string') ||
                              track.genre?.toLowerCase().includes('classical') ||
                              track.genre?.toLowerCase().includes('chamber');
            if (!hasStrings) return false;
          }

          // Check for specific band member/vocalist mentions
          const artistNames = [
            track.artist,
            track.albumArtist,
            ...(track.releaseInfo?.artistCredit?.map(ac => ac.name) || [])
          ].filter(Boolean).map(n => n!.toLowerCase());

          // Extract potential names from criteria (words starting with capital)
          const nameMatches = criteria.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
          if (nameMatches) {
            const hasArtist = nameMatches.some(name => 
              artistNames.some(an => an.includes(name.toLowerCase()))
            );
            if (!hasArtist) return false;
          }

          // Check for country/origin if specified
          if (criteriaLower.includes('british') || criteriaLower.includes('uk')) {
            if (track.artistInfo?.country !== 'GB') return false;
          }
          if (criteriaLower.includes('american') || criteriaLower.includes('us')) {
            if (track.artistInfo?.country !== 'US') return false;
          }

          // Check for decade/year if specified
          const yearMatch = criteria.match(/\b(19|20)\d{2}s?\b/);
          if (yearMatch) {
            const targetYear = parseInt(yearMatch[0]);
            const trackYear = track.date ? parseInt(track.date.substring(0, 4)) : null;
            if (!trackYear) return false;
            
            // If decade specified (e.g., "1990s"), match decade
            if (yearMatch[0].includes('s')) {
              const decade = Math.floor(targetYear / 10) * 10;
              const trackDecade = Math.floor(trackYear / 10) * 10;
              if (decade !== trackDecade) return false;
            } else {
              // Exact year match with +/- 2 year tolerance
              if (Math.abs(trackYear - targetYear) > 2) return false;
            }
          }

          return true;
        });

        // Use filtered tracks if we got results
        if (filtered.length > 0) {
          selectedTracks = filtered;
        }
      }

      // Remove duplicates
      const uniqueTracks = Array.from(
        new Map(selectedTracks.map(t => [t.file, t])).values()
      );

      // Limit to target length
      let finalTracks = uniqueTracks.slice(0, targetLength);

      // If not enough matches, add random tracks
      if (finalTracks.length < targetLength) {
        const remaining = targetLength - finalTracks.length;
        const randomTracks = allTracks
          .filter(t => !finalTracks.some(ft => ft.file === t.file))
          .sort(() => Math.random() - 0.5)
          .slice(0, remaining);
        finalTracks = [...finalTracks, ...randomTracks];
      }

      // Shuffle if requested
      if (shuffle) {
        finalTracks.sort(() => Math.random() - 0.5);
      }

      // Clear queue and add tracks
      await mpdClient.clearQueue();
      for (const track of finalTracks) {
        await mpdClient.addToQueue(track.file);
      }

      setAiResponse(`Generated playlist with ${finalTracks.length} tracks based on: ${criteria}`);
    } catch (err) {
      setAiResponse(`Failed to generate playlist: ${err}`);
    }
  };

  const handleModelSelect = async (modelId: string) => {
    try {
      aiAgent.setModel(modelId);
      setCurrentModel(modelId);
      setShowModelSelector(false);
      setAiResponse(`Switched to model: ${modelId}`);
    } catch (err) {
      setAiResponse(`Failed to switch model: ${err}`);
    }
  };

  const toggleModelSelector = () => {
    setShowModelSelector(!showModelSelector);
  };

  const handleGetTrackStory = async (args: any) => {
    try {
      const track = args.track || currentTrack?.title || '';
      const artist = args.artist || currentTrack?.artist || currentTrack?.albumArtist || '';
      
      if (!track || !artist) {
        setAiResponse('No track currently playing');
        return;
      }

      setAiResponse(`Fetching story for "${track}" by ${artist}...`);
      setShowTrackStory(true);

      // Use AI to generate rich contextual information
      const prompt = `Provide detailed information about the song "${track}" by ${artist}. Include:

${args.aspectFocus === 'meaning' ? '- Focus primarily on the song\'s meaning, themes, and lyrics interpretation' : ''}
${args.aspectFocus === 'production' ? '- Focus primarily on production details, recording techniques, and musical composition' : ''}
${args.aspectFocus === 'history' ? '- Focus primarily on the song\'s creation history and artist background' : ''}
${args.aspectFocus === 'cultural-impact' ? '- Focus primarily on cultural impact, chart performance, and legacy' : ''}
${!args.aspectFocus || args.aspectFocus === 'all' ? `
1. Song Meaning & Themes: What the song is about, lyrical themes, emotional content
2. Production & Recording: Recording location, producer, musical techniques, interesting instruments
3. Artist Context: What was happening in the artist's life, influences, related works
4. Cultural Impact: Chart performance, awards, covers, influence on other artists
5. Interesting Facts: Behind-the-scenes stories, anecdotes, trivia` : ''}

Keep it engaging and informative. If you don't know specific details, provide general context about the artist and era instead.`;

      const response = await aiAgent.processCommand(prompt);
      const story = response.message || 'No information available';
      
      setTrackStory(story);
      setAiResponse(`Story loaded for "${track}"`);

      // Pre-generate TTS audio if enabled
      if (ttsManager.isAvailable()) {
        setIsGeneratingTTS(true);
        setTtsProgress('Generating audio narration...');
        
        try {
          // Create cache key from track and artist
          const cacheKey = `${artist}-${track}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          
          // Generate audio in chunks
          await ttsManager.queueLongSpeech(story, cacheKey);
          
          setTtsProgress('Audio ready - narration will play automatically');
          setAiResponse(`Story and narration ready for "${track}"`);
        } catch (err) {
          setTtsProgress(`TTS generation failed: ${err}`);
          console.error('TTS generation error:', err);
        } finally {
          setIsGeneratingTTS(false);
        }
      }
    } catch (err) {
      setAiResponse(`Failed to fetch track story: ${err}`);
      setShowTrackStory(false);
      setIsGeneratingTTS(false);
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
        <Text color="gray"> | MPD Client with {aiProvider} AI ({currentModel})</Text>
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

      {showTrackStory && (
        <TrackStory 
          story={trackStory}
          trackTitle={currentTrack?.title}
          artist={currentTrack?.artist || currentTrack?.albumArtist}
          isGeneratingTTS={isGeneratingTTS}
          ttsProgress={ttsProgress}
          onClose={() => {
            setShowTrackStory(false);
            ttsManager.stop();
          }}
        />
      )}

      <CommandInput
        onCommand={handleCommand}
        aiResponse={aiResponse}
        isProcessing={isProcessing}
      />
      
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Commands: "beyond the beat", "generate a workout playlist", "list models" | Ctrl+C to quit
        </Text>
      </Box>
    </Box>
  );
};
