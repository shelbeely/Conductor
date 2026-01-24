import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface SearchScreenProps {
  onSearch?: (query: string) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  useInput((input, key) => {
    if (key.backspace || key.delete) {
      setQuery((prev) => prev.slice(0, -1));
    } else if (key.return) {
      if (onSearch) {
        onSearch(query);
      }
    } else if (!key.ctrl && !key.meta && input) {
      setQuery((prev) => prev + input);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box flexDirection="column" marginBottom={1}>
        <Text color="cyan" bold>
          Search Music
        </Text>
        <Box marginTop={1} borderStyle="round" borderColor="cyan" paddingX={1}>
          <Text color="yellow">🔍 </Text>
          <Text>{query || 'Type to search...'}</Text>
          <Text color="gray">│</Text>
        </Box>
      </Box>

      {results.length > 0 ? (
        <Box flexDirection="column">
          <Text color="cyan">Results:</Text>
          {results.map((result, idx) => (
            <Text key={idx} dimColor>
              {result}
            </Text>
          ))}
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text dimColor>
            Search by:
          </Text>
          <Text dimColor>  • Song title</Text>
          <Text dimColor>  • Artist name</Text>
          <Text dimColor>  • Album name</Text>
          <Text dimColor>  • Genre or mood</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor color="gray">
          Type to search • Enter: confirm • b: back
        </Text>
      </Box>
    </Box>
  );
};

export default SearchScreen;
