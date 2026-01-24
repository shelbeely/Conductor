import React from 'react';
import { Box, Text } from 'ink';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  onBack?: () => void;
  onMenu?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ title, showBack = false, showMenu = false, onBack, onMenu }) => {
  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box flexGrow={1}>
        {showBack && (
          <Text color="yellow" bold>← </Text>
        )}
        <Text color="cyan" bold>{title}</Text>
      </Box>
      {showMenu && (
        <Text color="gray">⋯</Text>
      )}
    </Box>
  );
};

export default TopBar;
