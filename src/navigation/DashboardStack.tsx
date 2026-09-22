import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { NavigationState } from '@react-navigation/native';
import { useNavUiStore } from '../store/navUistore';
import type { DashboardStackParamList } from './types';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

function DashboardScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Dashboard screen placeholder</Text>
    </SafeAreaView>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
});