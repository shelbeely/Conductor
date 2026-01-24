import React from 'react';
import { Box, Text } from 'ink';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  borderColor?: string;
}

const Card: React.FC<CardProps> = ({ title, children, borderColor = 'cyan' }) => {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1} marginY={0}>
      {title && (
        <Box marginBottom={0}>
          <Text bold color={borderColor}>
            {title}
          </Text>
        </Box>
      )}
      {children}
    </Box>
  );
};

export default Card;
