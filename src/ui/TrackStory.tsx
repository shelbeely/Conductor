/**
 * TrackStory Component
 * Displays contextual information about the current track
 * Similar to YouTube's "Beyond the Beat" feature
 */

import React from 'react';
import { Box, Text } from 'ink';

interface TrackStoryProps {
  story: string;
  trackTitle?: string;
  artist?: string;
  onClose?: () => void;
}

export const TrackStory: React.FC<TrackStoryProps> = ({ 
  story, 
  trackTitle, 
  artist,
  onClose 
}) => {
  if (!story) return null;

  return (
    <Box 
      flexDirection="column" 
      borderStyle="round" 
      borderColor="cyan"
      padding={1}
      marginBottom={1}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">
          📖 Beyond the Beat
        </Text>
        {trackTitle && (
          <Text color="gray"> | {trackTitle} {artist ? `by ${artist}` : ''}</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text wrap="wrap">{story}</Text>
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Type "close story" to hide | AI-generated content may be inaccurate
        </Text>
      </Box>
    </Box>
  );
};
