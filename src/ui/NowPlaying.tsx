/**
 * Now Playing Component
 * Displays current track information
 */

import React from 'react';
import { Box, Text } from 'ink';
import humanizeDuration from 'humanize-duration';
import type { TrackInfo, PlayerStatus } from '../mpd/client';
import type { EnrichedTrack } from '../metadata/musicbrainz';

interface NowPlayingProps {
  track: EnrichedTrack | TrackInfo | null;
  status: PlayerStatus | null;
  showAlbumArt?: boolean;
  albumArtAscii?: string;
}

// Hoist helper functions outside component to avoid re-creation on every render
const formatTime = (seconds?: number): string => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatHumanDuration = (seconds?: number): string => {
  if (!seconds) return '';
  return humanizeDuration(seconds * 1000, { 
    largest: 2,
    round: true,
    units: ['h', 'm', 's']
  });
};

const getStateSymbol = (state?: string): string => {
  switch (state) {
    case 'play':
      return '▶';
    case 'pause':
      return '⏸';
    case 'stop':
      return '⏹';
    default:
      return '⏹';
  }
};

const progressBar = (elapsed?: number, duration?: number): string => {
  if (!elapsed || !duration) return '─'.repeat(40);
  
  const width = 40;
  const progress = Math.floor((elapsed / duration) * width);
  return '━'.repeat(progress) + '─'.repeat(width - progress);
};

export const NowPlaying: React.FC<NowPlayingProps> = React.memo(({
  track,
  status,
  showAlbumArt = false,
  albumArtAscii,
}) => {
  if (!track) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="yellow">
          ♫ Now Playing
        </Text>
        <Text dimColor>No track playing</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ♫ Now Playing
        </Text>
      </Box>

      <Box flexDirection="row" gap={2}>
        {showAlbumArt && albumArtAscii && (
          <Box flexDirection="column" marginRight={2}>
            <Text>{albumArtAscii}</Text>
          </Box>
        )}

        <Box flexDirection="column" flexGrow={1}>
          <Box marginBottom={1}>
            <Text bold color="white">
              {track.title || 'Unknown Title'}
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text color="gray">
              by{' '}
            </Text>
            <Text color="green">
              {track.artist || track.albumArtist || 'Unknown Artist'}
            </Text>
          </Box>

          {track.album && (
            <Box marginBottom={1}>
              <Text color="gray">
                from{' '}
              </Text>
              <Text color="blue">
                {track.album}
              </Text>
              {track.date && (
                <Text color="gray">
                  {' '}({track.date})
                </Text>
              )}
            </Box>
          )}

          {track.genre && (
            <Box marginBottom={1}>
              <Text color="gray">
                Genre:{' '}
              </Text>
              <Text color="magenta">{track.genre}</Text>
            </Box>
          )}

          {status && (
            <Box flexDirection="column" marginTop={1}>
              <Box>
                <Text color="yellow">
                  {getStateSymbol(status.state)}{' '}
                </Text>
                <Text>
                  {formatTime(status.elapsed)} / {formatTime(status.duration)}
                </Text>
                {status.duration && status.duration > 60 && (
                  <Text color="gray" dimColor>
                    {' '}({formatHumanDuration(status.duration)})
                  </Text>
                )}
                <Text color="gray">
                  {' '}Vol: {status.volume}%
                </Text>
              </Box>

              <Box marginTop={1}>
                <Text color="cyan">
                  {progressBar(status.elapsed, status.duration)}
                </Text>
              </Box>

              <Box marginTop={1}>
                {status.repeat && <Text color="green">[Repeat] </Text>}
                {status.random && <Text color="yellow">[Random] </Text>}
                {status.single && <Text color="blue">[Single] </Text>}
                {status.consume && <Text color="red">[Consume] </Text>}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Show enriched metadata if available */}
      {('artistInfo' in track && track.artistInfo) && (
        <Box marginTop={1} flexDirection="column">
          <Text color="gray" dimColor>
            ─────────────────────────────────
          </Text>
          <Text color="gray">
            Artist Info:{' '}
          </Text>
          <Text color="cyan">
            {track.artistInfo.name}
            {track.artistInfo.country && ` (${track.artistInfo.country})`}
          </Text>
        </Box>
      )}
    </Box>
  );
});
