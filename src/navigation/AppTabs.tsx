import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavUiStore } from '../store/navUistore';
import DashboardStack from './DashboardStack';
import MonthsStack from './MonthsStack';
import LoansStack from './LoansStack';
import IncomeStack from './IncomeStack';
import TrashScreen from '../screens/trash/TrashScreen';
import type { AppTabsParamList } from './types';

const Tab = createMaterialTopTabNavigator<AppTabsParamList>();

const icons: Record<keyof AppTabsParamList, string> = {
    Dashboard: 'home-outline',
    Months: 'calendar-outline',
    Loans: 'cash-outline',
    Income: 'trending-up-outline',
    Trash: 'trash-outline',
};

export default function AppTabs(): React.JSX.Element {
    const insets = useSafeAreaInsets();
    // Swiping only makes sense at the root of whichever tab is active.
    // Once a nested stack (e.g. Months) is drilled in, this drops to false
    // and the pager stops intercepting the gesture.
    const swipeEnabled = useNavUiStore((s) => s.activeStackDepth <= 1);

    return (
        <Tab.Navigator
            tabBarPosition="bottom"
            swipeEnabled={swipeEnabled}
            screenOptions={({ route }) => ({
                tabBarShowLabel: true,
                tabBarIndicatorStyle: { height: 0 },
                tabBarStyle: {
                    backgroundColor: '#fff',
                    elevation: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#eee',
                    height: 56 + insets.bottom,
                    paddingBottom: insets.bottom,
                },
                tabBarLabelStyle: { fontSize: 11, textTransform: 'none' },
                tabBarIcon: ({ color }: { color: string }) => (
                    <Icon name={icons[route.name as keyof AppTabsParamList]} size={22} color={color} />
                ),
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#9ca3af',
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardStack} />
            <Tab.Screen name="Months" component={MonthsStack} />
            <Tab.Screen name="Loans" component={LoansStack} />
            <Tab.Screen name="Income" component={IncomeStack} />
            <Tab.Screen name="Trash" component={TrashScreen} />
        </Tab.Navigator>
    );
}
