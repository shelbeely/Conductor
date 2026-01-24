import React from 'react';
import { Screen, ScreenId } from './types';
import { useNavigation } from './NavigationContext';

interface RouterProps {
  screens: Screen[];
  screenProps?: any;
}

const Router: React.FC<RouterProps> = ({ screens, screenProps }) => {
  const { state } = useNavigation();
  
  const currentScreen = screens.find((screen) => screen.id === state.currentScreen);
  
  if (!currentScreen) {
    return null;
  }

  const ScreenComponent = currentScreen.component;
  
  return <ScreenComponent {...screenProps} />;
};

export default Router;
