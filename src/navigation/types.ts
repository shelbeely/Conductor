import React from 'react';

export type ScreenId = 'home' | 'queue' | 'search' | 'settings' | 'help';

export interface Screen {
  id: ScreenId;
  title: string;
  component: React.ComponentType<any>;
}

export interface NavigationState {
  stack: ScreenId[];
  currentScreen: ScreenId;
}

export interface NavigationContextType {
  state: NavigationState;
  push: (screenId: ScreenId) => void;
  pop: () => void;
  replace: (screenId: ScreenId) => void;
  canGoBack: () => boolean;
}
