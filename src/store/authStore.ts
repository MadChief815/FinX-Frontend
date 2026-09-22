
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hydrate: () => Promise<void>;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create < AuthState > ((set) => ({
    token: null,
    isAuthenticated: false,
    isLoading: true,
    hydrate: async () => {
        const token = await SecureStore.getItemAsync('accessToken');
        set({ token, isAuthenticated: !!token, isLoading: false });
    },
    login: async (token: string) => {
        await SecureStore.setItemAsync('accessToken', token);
        set({ token, isAuthenticated: true });
    },
    logout: async () => {
        await SecureStore.deleteItemAsync('accessToken');
        set({ token: null, isAuthenticated: false });
    },
}));
