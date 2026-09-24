import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as ExpoSplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/auth/SplashScreen';
import { useAuthStore } from './src/store/authStore';
import { showErrorToast } from './src/utils/toast';

// Fonts
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

void ExpoSplashScreen.preventAutoHideAsync();

export default function App(): React.JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({
    InterRegular: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
  });
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (fontError) {
      showErrorToast('Fonts failed to load. Using default fonts instead.');
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void ExpoSplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}