import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import ListRow from '../components/ListRow';
import Card from '../components/Card';

interface SettingsScreenProps {
  aiProvider?: string;
  ttsEnabled?: boolean;
  visualizerEnabled?: boolean;
  onToggleTTS?: () => void;
  onToggleVisualizer?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  aiProvider,
  ttsEnabled = false,
  visualizerEnabled = false,
  onToggleTTS,
  onToggleVisualizer,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const settingsCount = 3;

  useInput((input, key) => {
    if (input === 'j' || key.downArrow) {
      setSelectedIndex((prev) => Math.min(prev + 1, settingsCount - 1));
    } else if (input === 'k' || key.upArrow) {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (key.return) {
      if (selectedIndex === 1 && onToggleTTS) {
        onToggleTTS();
      } else if (selectedIndex === 2 && onToggleVisualizer) {
        onToggleVisualizer();
      }
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          ⚙ Settings
        </Text>
      </Box>

      <Card title="AI Configuration">
        <Box flexDirection="column">
          <Text>Provider: <Text color="green">{aiProvider || 'Not configured'}</Text></Text>
          <Text dimColor>Configure in .env or setup wizard</Text>
        </Box>
      </Card>

      <Box flexDirection="column" marginTop={1}>
        <Text color="cyan" bold>Features</Text>
        <ListRow
          icon={ttsEnabled ? '🔊' : '🔇'}
          title="Text-to-Speech"
          subtitle={ttsEnabled ? 'Enabled' : 'Disabled'}
          isSelected={selectedIndex === 1}
        />
        <ListRow
          icon={visualizerEnabled ? '📊' : '📉'}
          title="Visualizer"
          subtitle={visualizerEnabled ? 'Enabled' : 'Disabled'}
          isSelected={selectedIndex === 2}
        />
      </Box>

      <Box marginTop={1}>
        <Text dimColor color="gray">
          j/k: navigate • Enter: toggle • b: back
        </Text>
      </Box>
    </Box>
  );
};

export default SettingsScreen;
