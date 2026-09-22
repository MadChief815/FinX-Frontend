// navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';

export default function RootNavigator(): React.JSX.Element {
    const { isAuthenticated, isLoading, hydrate } = useAuthStore();

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <AppTabs /> : <AuthStack />}
        </NavigationContainer>
    );
}
