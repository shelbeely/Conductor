/**
 * Queue Component
 * Displays and manages the playback queue
 */

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import humanizeDuration from 'humanize-duration';
import type { TrackInfo } from '../mpd/client';

interface QueueProps {
  queue: TrackInfo[];
  currentPosition?: number;
  maxItems?: number;
}

// Hoist helper functions outside component to avoid re-creation
const formatTrack = (track: TrackInfo): string => {
  const title = track.title || 'Unknown';
  const artist = track.artist || 'Unknown Artist';
  return `${title} - ${artist}`;
};

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatHumanDuration = (seconds?: number): string => {
  if (!seconds || seconds < 60) return '';
  return humanizeDuration(seconds * 1000, { 
    largest: 1,
    round: true,
    units: ['h', 'm']
  });
};

export const Queue: React.FC<QueueProps> = React.memo(({
  queue,
  currentPosition,
  maxItems = 10,
}) => {
  // Memoize derived state to avoid recalculating on every render
  const displayQueue = useMemo(() => queue.slice(0, maxItems), [queue, maxItems]);
  const hasMore = useMemo(() => queue.length > maxItems, [queue.length, maxItems]);

  if (queue.length === 0) {
    return (
      <Box flexDirection="column" padding={1} borderStyle="round" borderColor="yellow">
        <Text bold color="yellow">
          ♫ Queue
        </Text>
        <Text dimColor>Queue is empty</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="yellow">
      <Box marginBottom={1}>
        <Text bold color="yellow">
          ♫ Queue ({queue.length} tracks)
        </Text>
      </Box>

      {displayQueue.map((track, index) => {
        const isCurrent = track.pos === currentPosition;
        const position = (track.pos ?? index) + 1;

        return (
          <Box key={track.id || index} marginBottom={0}>
            <Text color={isCurrent ? 'green' : 'gray'}>
              {isCurrent ? '▶ ' : '  '}
            </Text>
            <Text color={isCurrent ? 'white' : 'gray'} bold={isCurrent}>
              {position}.{' '}
            </Text>
            <Text color={isCurrent ? 'white' : 'gray'} bold={isCurrent}>
              {formatTrack(track).substring(0, 50)}
            </Text>
            {track.time && (
              <Text color="gray" dimColor>
                {' '}[{formatDuration(track.time)}]
              </Text>
            )}
          </Box>
        );
      })}

      {hasMore && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            ... and {queue.length - maxItems} more tracks
          </Text>
        </Box>
      )}
    </Box>
  );
});
