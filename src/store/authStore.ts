
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hydrate: () => Promise<void>;
    login: (token: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create < AuthState > ((set) => ({
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    hydrate: async () => {
        try {
            const [token, refreshToken] = await Promise.all([
                SecureStore.getItemAsync('accessToken'),
                SecureStore.getItemAsync('refreshToken'),
            ]);
            set({ token, refreshToken, isAuthenticated: !!token, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },
    login: async (token: string, refreshToken: string) => {
        await Promise.all([
            SecureStore.setItemAsync('accessToken', token),
            SecureStore.setItemAsync('refreshToken', refreshToken),
        ]);
        set({ token, refreshToken, isAuthenticated: true });
    },
    logout: async () => {
        await Promise.all([
            SecureStore.deleteItemAsync('accessToken'),
            SecureStore.deleteItemAsync('refreshToken'),
        ]);
        set({ token: null, refreshToken: null, isAuthenticated: false });
    },
}));
