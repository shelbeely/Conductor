import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import Card from '../components/Card';
import ListRow from '../components/ListRow';

interface Track {
  title?: string;
  artist?: string;
  album?: string;
  file?: string;
}

interface Status {
  state: 'play' | 'pause' | 'stop';
  elapsed?: number;
  duration?: number;
}

interface HomeScreenProps {
  currentTrack: Track | null;
  status: Status | null;
  onShowQueue: () => void;
  onShowLyrics: () => void;
}

const formatTime = (seconds: number | undefined): string => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const HomeScreen: React.FC<HomeScreenProps> = ({
  currentTrack,
  status,
  onShowQueue,
  onShowLyrics,
}) => {
  const [selectedAction, setSelectedAction] = useState(0);
  const actionCount = 3;

  useInput((input, key) => {
    if (input === 'j' || key.downArrow) {
      setSelectedAction((prev) => Math.min(prev + 1, actionCount - 1));
    } else if (input === 'k' || key.upArrow) {
      setSelectedAction((prev) => Math.max(prev - 1, 0));
    } else if (key.return) {
      switch (selectedAction) {
        case 0:
          onShowQueue();
          break;
        case 1:
          onShowLyrics();
          break;
        case 2:
          // AI command - future feature
          break;
      }
    }
  });

  const stateIcon = status?.state === 'play' ? '▶' : status?.state === 'pause' ? '⏸' : '⏹';
  const progress = status?.duration
    ? Math.floor((status.elapsed || 0) / status.duration * 20)
    : 0;
  const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);

  return (
    <Box flexDirection="column" paddingX={1} paddingY={0}>
      <Card title="🎵 Now Playing">
        <Box flexDirection="column">
          {currentTrack ? (
            <>
              <Text bold>{currentTrack.title || 'Unknown Title'}</Text>
              <Text color="gray">{currentTrack.artist || 'Unknown Artist'}</Text>
              <Text dimColor>{currentTrack.album || 'Unknown Album'}</Text>
              <Box marginTop={1} flexDirection="column">
                <Text>{progressBar}</Text>
                <Box justifyContent="space-between">
                  <Text dimColor>{formatTime(status?.elapsed)}</Text>
                  <Text>{stateIcon}</Text>
                  <Text dimColor>{formatTime(status?.duration)}</Text>
                </Box>
              </Box>
            </>
          ) : (
            <Text dimColor>No track playing</Text>
          )}
        </Box>
      </Card>

      <Box flexDirection="column" marginTop={1}>
        <Text color="cyan" bold>Quick Actions</Text>
        <ListRow
          icon="📜"
          title="View Queue"
          subtitle="See upcoming tracks"
          showChevron
          isSelected={selectedAction === 0}
        />
        <ListRow
          icon="🎤"
          title="Show Lyrics"
          subtitle="View synchronized lyrics"
          showChevron
          isSelected={selectedAction === 1}
        />
        <ListRow
          icon="🤖"
          title="AI Command"
          subtitle="Natural language control"
          showChevron
          isSelected={selectedAction === 2}
        />
      </Box>

      <Box marginTop={1}>
        <Text dimColor color="gray">
          j/k: navigate • Enter: select • /: search
        </Text>
      </Box>
    </Box>
  );
};

export default HomeScreen;
