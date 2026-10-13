import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import {
    createMaterialTopTabNavigator,
    type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useNavUiStore } from '../store/navUistore';
import type { AppTabsParamList } from './types';
import { ms, vs } from '../utils/Responsive';

// Stacks
import DashboardStack from './DashboardStack';
import MonthsStack from './MonthsStack';
import LoansStack from './LoansStack';
import IncomeStack from './IncomeStack';

const Tab = createMaterialTopTabNavigator<AppTabsParamList>();

const COLORS = {
    primary: '#610088',
    pill: '#EBD6F5',
    inactive: '#7A6B85',
    background: '#FFFFFF',
    border: '#EFE6F4',
};

// How much the icon grows when its tab is active
const ACTIVE_ICON_SCALE = 1.2;

// Filled icon when active, outline icon when inactive, plus a label
const tabConfig: Record<
    keyof AppTabsParamList,
    { label: string; active: string; inactive: string }
> = {
    Dashboard: { label: 'Home', active: 'home', inactive: 'home-outline' },
    Months: { label: 'Months', active: 'calendar', inactive: 'calendar-outline' },
    Loans: { label: 'Loans', active: 'wallet', inactive: 'wallet-outline' },
    Income: { label: 'Income', active: 'trending-up', inactive: 'trending-up-outline' },
};

type TabItemProps = {
    routeName: keyof AppTabsParamList;
    focused: boolean;
    onPress: () => void;
    onLongPress: () => void;
    accessibilityLabel?: string;
};

function TabItem({
    routeName,
    focused,
    onPress,
    onLongPress,
    accessibilityLabel,
}: TabItemProps): React.JSX.Element {
    const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;
    const config = tabConfig[routeName];

    useEffect(() => {
        Animated.spring(progress, {
            toValue: focused ? 1 : 0,
            useNativeDriver: true,
            friction: 6,
            tension: 140,
        }).start();
    }, [focused, progress]);

    const pillScaleX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 1],
    });

    const iconScale = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, ACTIVE_ICON_SCALE],
    });

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={accessibilityLabel}
            android_ripple={{ color: COLORS.pill, borderless: true, radius: ms(40) }}
            style={styles.tabItem}
        >
            <View style={styles.iconWrapper}>
                <Animated.View
                    style={[
                        styles.pill,
                        { opacity: progress, transform: [{ scaleX: pillScaleX }] },
                    ]}
                />
                <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                    {routeName === 'Income' && focused ? (
                        <FontAwesome6
                            name="arrow-trend-up"
                            size={ms(22)}
                            color={COLORS.primary}
                        />
                    ) : (
                        <Ionicons
                            name={focused ? config.active : config.inactive}
                            size={ms(22)}
                            color={focused ? COLORS.primary : COLORS.inactive}
                        />
                    )}
                </Animated.View>
            </View>

            <Text
                numberOfLines={1}
                style={[
                    styles.label,
                    {
                        color: focused ? COLORS.primary : COLORS.inactive,
                        fontWeight: focused ? '700' : '500',
                    },
                ]}
            >
                {config.label}
            </Text>
        </Pressable>
    );
}

function CustomTabBar({
    state,
    descriptors,
    navigation,
}: MaterialTopTabBarProps): React.JSX.Element {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.bar,
                { paddingBottom: Math.max(insets.bottom, vs(8)) },
            ]}
        >
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const focused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
                        navigation.navigate(route.name, undefined, { merge: true });
                    }
                };

                const onLongPress = () => {
                    navigation.emit({ type: 'tabLongPress', target: route.key });
                };

                return (
                    <TabItem
                        key={route.key}
                        routeName={route.name as keyof AppTabsParamList}
                        focused={focused}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                    />
                );
            })}
        </View>
    );
}

export default function AppTabs(): React.JSX.Element {
    // Disable swiping when navigating deeper into a nested stack
    const swipeEnabled = useNavUiStore((st) => st.activeStackDepth <= 1);

    return (
        <Tab.Navigator
            tabBarPosition="bottom"
            swipeEnabled={swipeEnabled}
            tabBar={(props) => <CustomTabBar {...props} />}
        >
            <Tab.Screen name="Dashboard" component={DashboardStack} />
            <Tab.Screen name="Months" component={MonthsStack} />
            <Tab.Screen name="Loans" component={LoansStack} />
            <Tab.Screen name="Income" component={IncomeStack} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: COLORS.border,
        paddingTop: vs(8),
        elevation: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        width: ms(60),
        height: ms(32),
        alignItems: 'center',
        justifyContent: 'center',
    },
    pill: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: ms(16),
        backgroundColor: COLORS.pill,
    },
    label: {
        marginTop: vs(3),
        fontSize: ms(11),
    },
});