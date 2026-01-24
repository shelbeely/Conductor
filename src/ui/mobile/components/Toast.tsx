import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onDismiss?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  const colors = {
    info: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red',
  };

  const icons = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✗',
  };

  return (
    <Box borderStyle="round" borderColor={colors[type]} paddingX={1}>
      <Text color={colors[type]} bold>
        {icons[type]} {message}
      </Text>
    </Box>
  );
};

export default Toast;
