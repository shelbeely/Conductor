/**
 * Command Input Component
 * Natural language command interface
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface CommandInputProps {
  onCommand: (command: string) => void;
  aiResponse?: string;
  isProcessing?: boolean;
}

export const CommandInput: React.FC<CommandInputProps> = ({
  onCommand,
  aiResponse,
  isProcessing = false,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useInput((inputChar, key) => {
    if (isProcessing) return;

    if (key.return) {
      if (input.trim()) {
        onCommand(input.trim());
        setHistory([input.trim(), ...history]);
        setInput('');
        setHistoryIndex(-1);
      }
    } else if (key.backspace || key.delete) {
      setInput(input.slice(0, -1));
    } else if (key.upArrow) {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (key.downArrow) {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (!key.ctrl && !key.meta) {
      setInput(input + inputChar);
    }
  });

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
};
