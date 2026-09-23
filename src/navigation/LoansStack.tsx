import React from 'react';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { NavigationState } from '@react-navigation/native';
import { useNavUiStore } from '../store/navUistore';
import type { LoansStackParamList } from './types';

// Screens
import LoansScreen from '../screens/loans/LoansScreen';

const Stack = createNativeStackNavigator<LoansStackParamList>();

export default function LoansStack(): React.JSX.Element {
  const setActiveStackDepth = useNavUiStore((state) => state.setActiveStackDepth);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      screenListeners={{
        state: (event: { data: { state: NavigationState } }) => {
          setActiveStackDepth(event.data.state?.routes?.length ?? 1);
        },
      }}
    >
      <Stack.Screen name="Loans" component={LoansScreen} />
    </Stack.Navigator>
  );
}

export type LoansScreenProps<T extends keyof LoansStackParamList> =
  NativeStackScreenProps<LoansStackParamList, T>;