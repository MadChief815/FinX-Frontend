// navigation/MonthsStack.tsx
import React from 'react';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { NavigationState } from '@react-navigation/native';
import { useNavUiStore } from '../store/navUistore';
import type { MonthsStackParamList } from './types';

// Screens
import MonthListScreen from '../screens/months/MonthListScreen';
import MonthCreateScreen from '../screens/months/MonthCreateScreen';
import MonthDetailScreen from '../screens/months/MonthDetailScreen';
import SpendCreateScreen from '../screens/months/SpendCreateScreen';
import SubPageScreen from '../screens/months/SubPageScreen';
import SubSpendCreateScreen from '../screens/months/SubSpendCreateScreen';

const Stack = createNativeStackNavigator<MonthsStackParamList>();

export default function MonthsStack(): React.JSX.Element {
  const setActiveStackDepth = useNavUiStore((s) => s.setActiveStackDepth);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      screenListeners={{
        state: (e: { data: { state: NavigationState } }) => {
          const depth = e.data.state?.routes?.length ?? 1;
          setActiveStackDepth(depth);
        },
      }}
    >
      <Stack.Screen name="MonthList" component={MonthListScreen} />
      <Stack.Screen
        name="MonthCreate"
        component={MonthCreateScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="MonthDetail" component={MonthDetailScreen} />
      <Stack.Screen
        name="SpendCreate"
        component={SpendCreateScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="SubPage" component={SubPageScreen} />
      <Stack.Screen
        name="SubSpendCreate"
        component={SubSpendCreateScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

export type MonthsScreenProps<T extends keyof MonthsStackParamList> =
  NativeStackScreenProps<MonthsStackParamList, T>;
