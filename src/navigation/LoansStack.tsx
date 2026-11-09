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
import LoansCreateScreen from '../screens/loans/LoansCreateScreen';
import LoanDetailScreen from '../screens/loans/LoanDetailScreen';

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
      initialRouteName='Loans'
    >
      <Stack.Screen
        name="Loans"
        component={LoansScreen}
      />
      <Stack.Screen
        name="LoansCreate"
        component={LoansCreateScreen}
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.7],
          sheetGrabberVisible: false,
          sheetCornerRadius: 20,
        }}
      />
      <Stack.Screen
        name="LoanDetail"
        component={LoanDetailScreen}
        options={{ 
          presentation: 'formSheet',
          sheetAllowedDetents: [0.63],
          sheetGrabberVisible: false,
          sheetCornerRadius: 20,
        }}
      />
    </Stack.Navigator>
  );
}

export type LoansScreenProps<T extends keyof LoansStackParamList> =
  NativeStackScreenProps<LoansStackParamList, T>;