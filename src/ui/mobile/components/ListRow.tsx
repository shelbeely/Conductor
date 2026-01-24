import React from 'react';
import { Box, Text } from 'ink';

interface ListRowProps {
  icon?: string;
  title: string;
  subtitle?: string;
  showChevron?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

const ListRow: React.FC<ListRowProps> = ({
  icon,
  title,
  subtitle,
  showChevron = false,
  isSelected = false,
}) => {
  return (
    <Box
      paddingX={1}
      paddingY={0}
      borderStyle={isSelected ? 'round' : undefined}
      borderColor={isSelected ? 'green' : undefined}
    >
      {icon && (
        <Box marginRight={1}>
          <Text>{icon}</Text>
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1}>
        <Text bold={isSelected} color={isSelected ? 'green' : 'white'}>
          {title}
        </Text>
        {subtitle && (
          <Text dimColor color="gray">
            {subtitle}
          </Text>
        )}
      </Box>
      {showChevron && (
        <Text color="gray">›</Text>
      )}
    </Box>
  );
};

export default ListRow;
