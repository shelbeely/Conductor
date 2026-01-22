/**
 * Lyrics Display Component
 * Shows synced lyrics that scroll with playback and highlight current line
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { LyricsData, LyricsLine } from '../lyrics/lrclib';

interface LyricsProps {
  lyrics: LyricsData | null;
  currentTime: number;
  currentLine: LyricsLine | null;
  upcomingLines: LyricsLine[];
  onClose: () => void;
}

export const Lyrics: React.FC<LyricsProps> = ({
  lyrics,
  currentTime,
  currentLine,
  upcomingLines,
  onClose,
}) => {
  if (!lyrics) {
    return (
      <Box
        padding={1}
        borderStyle="round"
        borderColor="yellow"
        flexDirection="column"
      >
        <Box marginBottom={1}>
          <Text bold color="yellow">
            🎵 Lyrics
          </Text>
          <Text dimColor> (Press L to close)</Text>
        </Box>
        <Text color="gray">No lyrics available for this track</Text>
      </Box>
    );
  }

  // If no synced lyrics, show plain text
  if (!lyrics.parsedLines || lyrics.parsedLines.length === 0) {
    return (
      <Box
        padding={1}
        borderStyle="round"
        borderColor="yellow"
        flexDirection="column"
        width={70}
      >
        <Box marginBottom={1}>
          <Text bold color="yellow">
            🎵 Lyrics - {lyrics.trackName}
          </Text>
          <Text dimColor> (Press L to close)</Text>
        </Box>
        <Box flexDirection="column">
          {lyrics.plainLyrics?.split('\n').map((line, i) => (
            <Text key={i} color="white">
              {line}
            </Text>
          ))}
        </Box>
      </Box>
    );
  }

  // Find current line index for context
  const currentLineIndex = currentLine
    ? lyrics.parsedLines.findIndex(l => l.time === currentLine.time)
    : -1;

  // Show lines around the current line for scrolling effect
  const contextBefore = 2; // Lines to show before current
  const contextAfter = 5; // Lines to show after current
  
  const startIndex = Math.max(0, currentLineIndex - contextBefore);
  const endIndex = Math.min(
    lyrics.parsedLines.length,
    currentLineIndex + contextAfter + 1
  );

  const visibleLines = lyrics.parsedLines.slice(startIndex, endIndex);

  // Show synced lyrics with highlighting and auto-scroll
  return (
    <Box
      padding={1}
      borderStyle="round"
      borderColor="cyan"
      flexDirection="column"
      width={70}
    >
      <Box marginBottom={1} justifyContent="space-between">
        <Box>
          <Text bold color="cyan">
            🎵 Synced Lyrics - {lyrics.trackName}
          </Text>
        </Box>
        <Text dimColor>Press L to close</Text>
      </Box>

      <Box flexDirection="column" minHeight={10}>
        {visibleLines.map((line, i) => {
          const isCurrentLine = currentLine && line.time === currentLine.time;
          const isPastLine = line.time < currentTime;
          const isFutureLine = line.time > currentTime;

          return (
            <Box key={`${line.time}-${i}`} marginBottom={0}>
              {isCurrentLine ? (
                // Current line - bright cyan with arrow
                <Text bold color="cyan" backgroundColor="blue">
                  ▶ {line.text}
                </Text>
              ) : isPastLine ? (
                // Past lines - dim gray
                <Text color="gray" dimColor>
                  {line.text}
                </Text>
              ) : (
                // Future lines - white but not highlighted
                <Text color="white">
                  {line.text}
                </Text>
              )}
            </Box>
          );
        })}

        {/* Show indicator if there are more lines */}
        {endIndex < lyrics.parsedLines.length && (
          <Text color="gray" dimColor>
            ... ({lyrics.parsedLines.length - endIndex} more lines)
          </Text>
        )}
      </Box>

      {/* Progress indicator */}
      <Box marginTop={1} justifyContent="space-between">
        <Text dimColor>
          {formatTime(currentTime)} / {formatTime(lyrics.duration || 0)}
        </Text>
        {currentLineIndex >= 0 && (
          <Text dimColor>
            Line {currentLineIndex + 1} / {lyrics.parsedLines.length}
          </Text>
        )}
      </Box>
    </Box>
  );
};

// Helper to format time as mm:ss
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
