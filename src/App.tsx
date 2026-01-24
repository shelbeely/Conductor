/**
 * Main App Component
 * Orchestrates all modules and renders the TUI
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { MPDClient, type TrackInfo, type PlayerStatus } from './mpd/client';
import { AIAgent, type AIProviderConfig, type ToolCall } from './ai/agent';
import { MusicBrainzClient, type EnrichedTrack } from './metadata/musicbrainz';
import { AlbumArtManager } from './art/display';
import { LRCLibClient, type LyricsData } from './lyrics/lrclib';
import { NowPlaying } from './ui/NowPlaying';
import { Queue } from './ui/Queue';
import { Visualizer } from './ui/Visualizer';
import { CommandInput } from './ui/CommandInput';
import { TrackStory } from './ui/TrackStory';
import { Lyrics } from './ui/Lyrics';
import { TTSManager } from './tts/manager';
import type { TTSConfig } from './tts/types';

interface AppProps {
  mpdHost?: string;
  mpdPort?: number;
  aiProvider?: 'openrouter' | 'ollama' | 'anthropic' | 'copilot';
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
  const [lyricsClient] = useState(() => new LRCLibClient());
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
  
  // AI DJ feature state
  const [aiDjEnabled, setAiDjEnabled] = useState(true);
  const [tracksSinceLastDj, setTracksSinceLastDj] = useState(0);
  const [djIntroduced, setDjIntroduced] = useState(false);
  const [lastDjTrack, setLastDjTrack] = useState<string>('');
  
  // Lyrics feature state
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState<LyricsData | null>(null);

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

        // Fetch lyrics for the new track
        if (enriched.title && enriched.artist) {
          const lyrics = await lyricsClient.getLyrics(
            enriched.title,
            enriched.artist,
            enriched.album,
            enriched.duration
          );
          setCurrentLyrics(lyrics);
        } else {
          setCurrentLyrics(null);
        }

        // Increment track counter for AI DJ
        setTracksSinceLastDj(prev => prev + 1);

        // Trigger AI DJ commentary every 4-5 songs if enabled and TTS available
        if (aiDjEnabled && ttsManager.isAvailable() && tracksSinceLastDj >= 4 && lastDjTrack !== newTrack.file) {
          // Trigger DJ commentary in the background
          triggerAiDjCommentary(enriched);
          setTracksSinceLastDj(0);
          setLastDjTrack(newTrack.file);
        }

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

      // Handle AI DJ enable/disable
      if (command.toLowerCase().includes('enable dj') || 
          command.toLowerCase().includes('turn on dj') ||
          command.toLowerCase().includes('activate dj')) {
        setAiDjEnabled(true);
        setAiResponse('AI DJ hosts enabled - they\'ll pop in every 4-5 songs');
        setIsProcessing(false);
        return;
      }

      if (command.toLowerCase().includes('disable dj') || 
          command.toLowerCase().includes('turn off dj') ||
          command.toLowerCase().includes('deactivate dj')) {
        setAiDjEnabled(false);
        ttsManager.clearQueue(); // Clear any pending DJ commentary
        setAiResponse('AI DJ hosts disabled');
        setIsProcessing(false);
        return;
      }

      // Handle lyrics commands
      if (command.toLowerCase().includes('show lyrics') || 
          command.toLowerCase().includes('display lyrics') ||
          command.toLowerCase().includes('lyrics')) {
        setShowLyrics(true);
        setAiResponse(currentLyrics ? 'Showing lyrics' : 'No lyrics available for this track');
        setIsProcessing(false);
        return;
      }

      if (command.toLowerCase().includes('hide lyrics') || 
          command.toLowerCase().includes('close lyrics')) {
        setShowLyrics(false);
        setAiResponse('Lyrics hidden');
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

      // Generate dialogue-style content for radio host/podcast format with humanizer principles
      const prompt = `You are creating a script for two radio hosts (Host 1 and Host 2) discussing the song "${track}" by ${artist}. 

IMPORTANT - Write naturally and avoid AI writing patterns:
- NO inflated language ("pivotal moment," "testament to," "stands as," "showcases")
- NO promotional words ("vibrant," "stunning," "groundbreaking," "renowned")
- NO vague attributions ("experts say," "observers note") - use specific sources if you mention them
- NO superficial -ing phrases ("symbolizing," "highlighting," "showcasing")
- Skip phrases like "cultural impact" or "legacy" unless you have something specific to say
- Vary sentence length - mix short and long
- Use "I" when it fits the conversational tone
- Real reactions, not just neutral reporting

Write a natural conversation. Format:

Host 1: [their line]
Host 2: [their line]

Include:
- Natural banter and building on each other
- Occasional humor or genuine reactions
- Specific facts about the song/production/artist (no vague claims)
- Personal takes when appropriate
- Mix of short punchy lines and longer thoughts

Keep each line 1-3 sentences. Aim for 8-12 exchanges. Be engaging but don't oversell anything.

Example of good style:
Host 1: So "${track}" by ${artist}. This one gets me every time.
Host 2: The guitar tone on this - I read Brian May built his guitar from fireplace wood. 
Host 1: Wait, seriously?
Host 2: Yeah. Called it the Red Special. Used it on every Queen album.`;

      const response = await aiAgent.processCommand(prompt);
      const story = response.message || 'No information available';
      
      setTrackStory(story);
      setAiResponse(`Story loaded for "${track}"`);

      // Pre-generate TTS audio if enabled - use dialogue format
      if (ttsManager.isAvailable()) {
        setIsGeneratingTTS(true);
        setTtsProgress('Generating podcast-style narration...');
        
        try {
          // Create cache key from track and artist
          const cacheKey = `${artist}-${track}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          
          // Parse dialogue format
          const dialogue = parseDialogue(story);
          
          if (dialogue.length > 0) {
            // Generate dialogue with alternating voices
            await ttsManager.queueDialogue(dialogue, cacheKey);
            setTtsProgress('Audio ready - podcast narration will play automatically');
            setAiResponse(`Podcast discussion ready for "${track}"`);
          } else {
            // Fallback to regular speech if parsing fails
            await ttsManager.queueLongSpeech(story, cacheKey);
            setTtsProgress('Audio ready - narration will play automatically');
            setAiResponse(`Story and narration ready for "${track}"`);
          }
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

  // Helper function to parse dialogue format
  const parseDialogue = (text: string): Array<{ speaker: string; text: string }> => {
    const lines = text.split('\n').filter(line => line.trim());
    const dialogue: Array<{ speaker: string; text: string }> = [];

    for (const line of lines) {
      // Match format: "Host 1: text" or "Host 2: text"
      const match = line.match(/^(Host [12]):\s*(.+)$/i);
      if (match) {
        dialogue.push({
          speaker: match[1],
          text: match[2].trim(),
        });
      }
    }

    return dialogue;
  };

  // AI DJ Commentary - triggers automatically between songs
  const triggerAiDjCommentary = async (track: EnrichedTrack) => {
    try {
      const artist = track.artist || track.albumArtist || 'Unknown Artist';
      const title = track.title || 'Unknown Track';
      const album = track.album || '';

      // Generate short, punchy DJ commentary with humanizer principles
      const introText = !djIntroduced 
        ? `This is your first time hearing from us! We're AI-generated hosts - think of us as your knowledgeable friends hanging out with you. We'll pop in every few songs to share some fun facts. Fair warning: we're AI, so we might get things wrong sometimes! But we'll do our best to keep it interesting.

` 
        : '';

      const prompt = `You are creating a SHORT radio DJ commentary (30-60 seconds when spoken) between two AI co-hosts about the song that just started playing: "${title}" by ${artist}${album ? ` from ${album}` : ''}.

${introText}HUMANIZER GUIDELINES - Write like a real human DJ, not AI:

AVOID these AI patterns:
- NO inflated importance ("pivotal," "testament to," "underscores," "stands as," "marks a shift")
- NO promotional language ("stunning," "vibrant," "renowned," "breathtaking," "indelible mark")
- NO vague claims ("experts believe," "many consider," "it's been said")
- NO superficial -ing phrases ("showcasing," "highlighting," "symbolizing," "reflecting")
- NO "broader trends" or "evolving landscape" talk
- NO em-dash overuse (one per segment max)
- NO "rule of three" patterns (listing three similar things)
- Skip empty phrases about "legacy" or "significance" unless specific

DO these human things:
- Vary sentence length and rhythm - mix short punchy lines with longer flowing ones
- Show real personality and opinions - "I love how..." or "This always gets me" instead of neutral reporting
- Use natural reactions - "Wait, seriously?" or "No way!" instead of "This is interesting"
- Be specific and concrete - actual production details, not vague importance claims
- Allow natural imperfections - casual asides, half-formed thoughts, honest uncertainty
- Acknowledge complexity and mixed feelings when appropriate
- Let personality show through - have opinions about the music

Format as quick back-and-forth:

Host 1: [1-2 sentences]
Host 2: [1-2 sentences]
Host 1: [1-2 sentences]
Host 2: [1 sentence closing]

Keep it:
- Conversational and fun (radio DJ energy, not Wikipedia)
- Short and punchy (4-6 exchanges max)
- Include ONE specific fact (production detail, artist story, or surprising trivia)
- Natural reactions ("Oh man, this track!" or "I didn't know that")
- Self-aware that you're AI if first time

Example GOOD style (has soul):
Host 1: Alright, here comes "${title}" by ${artist}!
Host 2: Fun fact - they recorded this in one take at 3am.
Host 1: No way, really?
Host 2: Yeah, the whole band was exhausted but it just worked.

Example BAD style (AI slop - AVOID):
Host 1: This song marks a pivotal moment in their career.
Host 2: It underscores their evolving sound and reflects broader trends.
Host 1: Indeed, it's a testament to their significance.
Host 2: A truly crucial contribution to the musical landscape.`;

      const response = await aiAgent.processCommand(prompt);
      const commentary = response.message || '';

      if (!djIntroduced) {
        setDjIntroduced(true);
      }

      // Parse and queue DJ commentary
      if (ttsManager.isAvailable() && commentary) {
        const dialogue = parseDialogue(commentary);
        
        if (dialogue.length > 0) {
          // Cache key based on track
          const cacheKey = `dj_${artist}_${title}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          
          // Queue in background - don't block playback
          ttsManager.queueDialogue(dialogue, cacheKey).catch(err => {
            console.error('Failed to queue DJ commentary:', err);
          });
          
          // Show subtle notification
          setAiResponse(`🎙️ AI DJs chiming in...`);
          setTimeout(() => setAiResponse(''), 3000);
        }
      }
    } catch (err) {
      console.error('AI DJ commentary failed:', err);
      // Fail silently - don't interrupt music
    }
  };

  // Keyboard shortcuts
  useInput((input, key) => {
    // Toggle lyrics with L key
    if (input.toLowerCase() === 'l' && !showTrackStory) {
      setShowLyrics(!showLyrics);
    }
  });

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

      {showLyrics && (
        <Lyrics
          lyrics={currentLyrics}
          currentTime={status?.elapsed || 0}
          currentLine={
            currentLyrics
              ? lyricsClient.getCurrentLine(currentLyrics, status?.elapsed || 0)
              : null
          }
          upcomingLines={
            currentLyrics
              ? lyricsClient.getUpcomingLines(currentLyrics, status?.elapsed || 0, 3)
              : []
          }
          onClose={() => setShowLyrics(false)}
        />
      )}

      <CommandInput
        onCommand={handleCommand}
        aiResponse={aiResponse}
        isProcessing={isProcessing}
      />
      
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Commands: "beyond the beat", "show lyrics", {aiDjEnabled ? '"disable dj"' : '"enable dj"'} | Press L for lyrics | Ctrl+C to quit
        </Text>
        {aiDjEnabled && ttsManager.isAvailable() && (
          <Text color="green" dimColor>
            🎙️ AI DJ hosts active - they'll pop in every 4-5 songs
          </Text>
        )}
      </Box>
    </Box>
  );
};
