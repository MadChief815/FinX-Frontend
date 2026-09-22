import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set) => ({
    token: null,
    isAuthenticated: false,
    isLoading: true,
    hydrate: async () => {
        const token = await SecureStore.getItemAsync('accessToken');
        set({ token, isAuthenticated: !!token, isLoading: false });
    },
    login: async (token) => {
        await SecureStore.setItemAsync('accessToken', token);
        set({ token, isAuthenticated: true });
    },
    logout: async () => {
        await SecureStore.deleteItemAsync('accessToken');
        set({ token: null, isAuthenticated: false });
    },
}));