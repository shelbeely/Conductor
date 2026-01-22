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
  isGeneratingTTS?: boolean;
  ttsProgress?: string;
  onClose?: () => void;
}

export const TrackStory: React.FC<TrackStoryProps> = ({ 
  story, 
  trackTitle, 
  artist,
  isGeneratingTTS = false,
  ttsProgress = '',
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

      {isGeneratingTTS && (
        <Box marginTop={1}>
          <Text color="yellow">🎤 {ttsProgress}</Text>
        </Box>
      )}

      {ttsProgress && !isGeneratingTTS && (
        <Box marginTop={1}>
          <Text color="green">✓ {ttsProgress}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Type "close story" to hide{ttsProgress && ' and stop narration'} | AI-generated content may be inaccurate
        </Text>
      </Box>
    </Box>
  );
};
