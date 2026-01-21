/**
 * Visualizer Component
 * Simple audio visualizer for the TUI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from 'ink';

interface VisualizerProps {
  isPlaying: boolean;
  volume: number;
}

// Hoist helper functions outside component
const renderBar = (height: number): string => {
  const maxHeight = 8;
  const barHeight = Math.min(Math.floor(height), maxHeight);
  
  if (barHeight === 0) return '▁';
  if (barHeight === 1) return '▂';
  if (barHeight === 2) return '▃';
  if (barHeight === 3) return '▄';
  if (barHeight === 4) return '▅';
  if (barHeight === 5) return '▆';
  if (barHeight === 6) return '▇';
  return '█';
};

const getBarColor = (height: number): string => {
  if (height < 3) return 'green';
  if (height < 6) return 'yellow';
  return 'red';
};

// Lazy initialization for initial bar state
const createInitialBars = () => Array(20).fill(0);

export const Visualizer: React.FC<VisualizerProps> = React.memo(({ isPlaying, volume }) => {
  // Use lazy state initialization to avoid creating array on every render
  const [bars, setBars] = useState<number[]>(createInitialBars);

  // Memoize bar generation function
  const generateBars = useCallback(() => {
    return Array(20)
      .fill(0)
      .map(() => Math.random() * (volume / 100) * 10);
  }, [volume]);

  useEffect(() => {
    if (!isPlaying) {
      setBars(createInitialBars());
      return;
    }

    const interval = setInterval(() => {
      setBars(generateBars());
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, generateBars]);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="magenta">
      <Box marginBottom={1}>
        <Text bold color="magenta">
          ♫ Visualizer
        </Text>
      </Box>

      <Box>
        {bars.map((height, index) => (
          <Text key={index} color={getBarColor(height)}>
            {renderBar(height)}
          </Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {isPlaying ? '♫ Playing' : '⏸ Paused'}
        </Text>
      </Box>
    </Box>
  );
});
