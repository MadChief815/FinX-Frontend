import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import SplashScreen from '../screens/auth/SplashScreen';

// Debugging
import api from '../services/api';

export default function RootNavigator(): React.JSX.Element {
    
    const { isAuthenticated, isLoading } = useAuthStore();

    // Debugging
    console.log("BASE_URL: ", api.defaults.baseURL)

    if (isLoading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <AppTabs /> : <AuthStack />}
            {/* {<AppTabs />} */}
        </NavigationContainer>
    );
}
