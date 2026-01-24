import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import ListRow from '../components/ListRow';

interface Track {
  title?: string;
  artist?: string;
  album?: string;
  file?: string;
}

interface QueueScreenProps {
  queue: Track[];
  currentIndex: number;
  onSelectTrack?: (index: number) => void;
}

const QueueScreen: React.FC<QueueScreenProps> = ({ queue, currentIndex, onSelectTrack }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const maxVisible = 12; // Show up to 12 items at once

  useInput((input, key) => {
    if (input === 'j' || key.downArrow) {
      setSelectedIndex((prev) => {
        const next = Math.min(prev + 1, queue.length - 1);
        if (next >= scrollOffset + maxVisible) {
          setScrollOffset(next - maxVisible + 1);
        }
        return next;
      });
    } else if (input === 'k' || key.upArrow) {
      setSelectedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        if (next < scrollOffset) {
          setScrollOffset(next);
        }
        return next;
      });
    } else if (key.return && onSelectTrack) {
      onSelectTrack(selectedIndex);
    }
  });

  const visibleQueue = queue.slice(scrollOffset, scrollOffset + maxVisible);
  const hasMore = queue.length > scrollOffset + maxVisible;
  const hasPrev = scrollOffset > 0;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          Queue ({queue.length} tracks)
        </Text>
      </Box>

      {queue.length === 0 ? (
        <Text dimColor>Queue is empty</Text>
      ) : (
        <>
          {hasPrev && (
            <Text dimColor color="gray">
              ↑ {scrollOffset} more above...
            </Text>
          )}
          
          {visibleQueue.map((track, idx) => {
            const actualIndex = scrollOffset + idx;
            const isPlaying = actualIndex === currentIndex;
            const isSelected = actualIndex === selectedIndex;

            return (
              <ListRow
                key={actualIndex}
                icon={isPlaying ? '▶' : '♪'}
                title={track.title || 'Unknown Title'}
                subtitle={`${track.artist || 'Unknown'} - ${track.album || 'Unknown'}`}
                isSelected={isSelected}
              />
            );
          })}

          {hasMore && (
            <Text dimColor color="gray">
              ↓ {queue.length - scrollOffset - maxVisible} more below...
            </Text>
          )}
        </>
      )}

      <Box marginTop={1}>
        <Text dimColor color="gray">
          j/k: navigate • Enter: play track • b: back
        </Text>
      </Box>
    </Box>
  );
};

export default QueueScreen;
