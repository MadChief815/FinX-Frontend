import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast } from 'react-native-toast-message';
import type { ToastConfig } from 'react-native-toast-message';
import * as ExpoSplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/auth/SplashScreen';
import { useAuthStore } from './src/store/authStore';
import { showErrorToast } from './src/utils/toast';
import { Colors } from './src/utils/Colors';
import { s } from './src/utils/Responsive';

// Fonts
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

void ExpoSplashScreen.preventAutoHideAsync();

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        width: '92%',
        alignSelf: 'flex-end',
        marginRight: s(12),
        backgroundColor: '#ffffff',
        borderLeftColor: Colors.brand.plum,
      }}
      text1Style={{ color: Colors.brand.deepPlum }}
      text2Style={{ color: Colors.brand.plum }}
    />
  ),
};

export default function App(): React.JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({
    InterRegular: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
  });
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate().catch((error: unknown) => {
      showErrorToast(
        error instanceof Error ? error.message : 'Unable to restore your saved session.',
        'Session error',
      );
    });
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
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}