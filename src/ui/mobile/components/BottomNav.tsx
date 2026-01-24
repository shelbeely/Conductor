import React from 'react';
import { Box, Text } from 'ink';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  shortcut: string; // 1-5
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ items, activeId, onNavigate }) => {
  return (
    <Box borderStyle="round" borderColor="cyan" flexDirection="column">
      <Box justifyContent="space-around" width="100%">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <Box key={item.id} flexDirection="column" alignItems="center" paddingX={1}>
              <Text color={isActive ? 'green' : 'gray'} bold={isActive}>
                {item.icon}
              </Text>
              <Text color={isActive ? 'green' : 'gray'} dimColor={!isActive}>
                {item.label}
              </Text>
              <Text color="gray" dimColor>
                [{item.shortcut}]
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default BottomNav;
