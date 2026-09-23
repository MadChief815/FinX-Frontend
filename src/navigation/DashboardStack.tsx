import React from 'react';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { NavigationState } from '@react-navigation/native';
import { useNavUiStore } from '../store/navUistore';
import type { DashboardStackParamList } from './types';

// Screens
import DashboardScreen from "../screens/dashboard/Dashboard";

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStack(): React.JSX.Element {
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
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}

export type DashboardScreenProps<T extends keyof DashboardStackParamList> =
  NativeStackScreenProps<DashboardStackParamList, T>;