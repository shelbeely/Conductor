import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import Card from '../components/Card';

const HelpScreen: React.FC = () => {
  const [section, setSection] = useState<'navigation' | 'shortcuts' | 'features'>('navigation');

  useInput((input) => {
    if (input === '1') {
      setSection('navigation');
    } else if (input === '2') {
      setSection('shortcuts');
    } else if (input === '3') {
      setSection('features');
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          ❓ Help & Controls
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          <Text color={section === 'navigation' ? 'green' : 'gray'}>[1] Navigation</Text>
          {' '}
          <Text color={section === 'shortcuts' ? 'green' : 'gray'}>[2] Shortcuts</Text>
          {' '}
          <Text color={section === 'features' ? 'green' : 'gray'}>[3] Features</Text>
        </Text>
      </Box>

      {section === 'navigation' && (
        <Card title="Navigation Keys" borderColor="green">
          <Box flexDirection="column">
            <Text><Text color="yellow">j/k</Text> - Move selection up/down</Text>
            <Text><Text color="yellow">Tab/Shift+Tab</Text> - Focus traversal</Text>
            <Text><Text color="yellow">Enter</Text> - Activate/open</Text>
            <Text><Text color="yellow">Esc or b</Text> - Go back</Text>
            <Text><Text color="yellow">1-5</Text> - Jump to bottom tabs</Text>
          </Box>
        </Card>
      )}

      {section === 'shortcuts' && (
        <Card title="Keyboard Shortcuts" borderColor="green">
          <Box flexDirection="column">
            <Text><Text color="yellow">/</Text> - Open search</Text>
            <Text><Text color="yellow">.</Text> - Context/actions menu</Text>
            <Text><Text color="yellow">?</Text> - Show this help</Text>
            <Text><Text color="yellow">Space</Text> - Play/pause</Text>
            <Text><Text color="yellow">n</Text> - Next track</Text>
            <Text><Text color="yellow">p</Text> - Previous track</Text>
          </Box>
        </Card>
      )}

      {section === 'features' && (
        <Card title="App Features" borderColor="green">
          <Box flexDirection="column">
            <Text><Text color="cyan">🎵 Now Playing</Text> - Current track info</Text>
            <Text><Text color="cyan">📜 Queue</Text> - Playlist management</Text>
            <Text><Text color="cyan">🔍 Search</Text> - Find music</Text>
            <Text><Text color="cyan">⚙ Settings</Text> - Configure app</Text>
            <Text><Text color="cyan">🤖 AI</Text> - Natural language control</Text>
          </Box>
        </Card>
      )}

      <Box marginTop={1}>
        <Text dimColor color="gray">
          1-3: switch section • b: back to app
        </Text>
      </Box>
    </Box>
  );
};

export default HelpScreen;
