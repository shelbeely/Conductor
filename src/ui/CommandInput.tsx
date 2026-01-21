/**
 * Command Input Component
 * Natural language command interface
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';

interface CommandInputProps {
  onCommand: (command: string) => void;
  aiResponse?: string;
  isProcessing?: boolean;
}

export const CommandInput: React.FC<CommandInputProps> = React.memo(({
  onCommand,
  aiResponse,
  isProcessing = false,
}) => {
  const [input, setInput] = useState('');
  // Use lazy state initialization for empty arrays
  const [history, setHistory] = useState<string[]>(() => []);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Memoize the input handler to avoid recreating on every render
  const handleInput = useCallback((inputChar: string, key: any) => {
    if (isProcessing) return;

    if (key.return) {
      if (input.trim()) {
        onCommand(input.trim());
        // Use functional setState to avoid closure issues
        setHistory(prev => [input.trim(), ...prev]);
        setInput('');
        setHistoryIndex(-1);
      }
    } else if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
    } else if (key.upArrow) {
      setHistoryIndex(prev => {
        if (prev < history.length - 1) {
          const newIndex = prev + 1;
          setInput(history[newIndex]);
          return newIndex;
        }
        return prev;
      });
    } else if (key.downArrow) {
      setHistoryIndex(prev => {
        if (prev > 0) {
          const newIndex = prev - 1;
          setInput(history[newIndex]);
          return newIndex;
        } else if (prev === 0) {
          setInput('');
          return -1;
        }
        return prev;
      });
    } else if (!key.ctrl && !key.meta) {
      setInput(prev => prev + inputChar);
    }
  }, [isProcessing, input, history, onCommand]);

  useInput(handleInput);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="green">
      <Box marginBottom={1}>
        <Text bold color="green">
          ♫ Command (Natural Language)
        </Text>
      </Box>

      {aiResponse && (
        <Box marginBottom={1} padding={1} borderStyle="single" borderColor="blue">
          <Text color="blue">AI: {aiResponse}</Text>
        </Box>
      )}

      <Box>
        <Text color="green">{'> '}</Text>
        <Text>{input}</Text>
        {isProcessing ? <Text color="yellow">⏳</Text> : <Text>_</Text>}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Type naturally: "play some jazz", "skip to next", "show queue"
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Keyboard: ↑↓ history, Enter to send, Ctrl+C to quit
        </Text>
      </Box>
    </Box>
  );
});
