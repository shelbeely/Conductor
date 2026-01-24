import React, { createContext, useContext, useState, useCallback } from 'react';
import { NavigationState, NavigationContextType, ScreenId } from './types';

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  initialScreen?: ScreenId;
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  initialScreen = 'home',
  children,
}) => {
  const [state, setState] = useState<NavigationState>({
    stack: [initialScreen],
    currentScreen: initialScreen,
  });

  const push = useCallback((screenId: ScreenId) => {
    setState((prev) => ({
      stack: [...prev.stack, screenId],
      currentScreen: screenId,
    }));
  }, []);

  const pop = useCallback(() => {
    setState((prev) => {
      if (prev.stack.length <= 1) return prev;
      const newStack = prev.stack.slice(0, -1);
      return {
        stack: newStack,
        currentScreen: newStack[newStack.length - 1],
      };
    });
  }, []);

  const replace = useCallback((screenId: ScreenId) => {
    setState((prev) => {
      const newStack = [...prev.stack];
      newStack[newStack.length - 1] = screenId;
      return {
        stack: newStack,
        currentScreen: screenId,
      };
    });
  }, []);

  const canGoBack = useCallback(() => {
    return state.stack.length > 1;
  }, [state.stack.length]);

  const value: NavigationContextType = {
    state,
    push,
    pop,
    replace,
    canGoBack,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
