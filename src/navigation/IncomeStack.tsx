import React from 'react';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { NavigationState } from '@react-navigation/native';
import { useNavUiStore } from '../store/navUistore';
import type { IncomeStackParamList } from './types';

// Screens
import IncomeScreen from '../screens/income/IncomeScreen';

const Stack = createNativeStackNavigator<IncomeStackParamList>();

export default function IncomeStack(): React.JSX.Element {
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
      <Stack.Screen name="Income" component={IncomeScreen} />
    </Stack.Navigator>
  );
}

export type IncomeScreenProps<T extends keyof IncomeStackParamList> =
  NativeStackScreenProps<IncomeStackParamList, T>;