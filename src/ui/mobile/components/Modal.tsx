import React from 'react';
import { Box, Text } from 'ink';

interface ModalProps {
  title?: string;
  children: React.ReactNode;
  visible: boolean;
  onClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, children, visible }) => {
  if (!visible) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="bold"
      borderColor="yellow"
      paddingX={1}
      paddingY={1}
    >
      {title && (
        <Box marginBottom={1}>
          <Text bold color="yellow">
            {title}
          </Text>
        </Box>
      )}
      {children}
      <Box marginTop={1}>
        <Text dimColor color="gray">
          Press Esc to close
        </Text>
      </Box>
    </Box>
  );
};

export default Modal;
