/**
 * Visualizer Component
 * Simple audio visualizer for the TUI
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface VisualizerProps {
  isPlaying: boolean;
  volume: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, volume }) => {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(20).fill(0));
      return;
    }

    const interval = setInterval(() => {
      // Generate pseudo-random bars based on volume
      const newBars = Array(20)
        .fill(0)
        .map(() => Math.random() * (volume / 100) * 10);
      setBars(newBars);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, volume]);

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
};
