import axios from 'axios';
import { useAuthStore } from '../store/authStore';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

const api = axios.create({
  // baseURL: process.env.EXPO_PUBLIC_API_URL,
  baseURL: process.env.EXPO_PUBLIC_EMULATOR_API_URL,
  timeout: 10000,
});

const authenticationEndpointSuffixes = [
  '/login',
  '/signin',
  '/sign-in',
  '/sign_in',
  '/register',
  '/signup',
  '/token/refresh',
];

function isAuthenticationRequest(url?: string): boolean {
  const path = (url ?? '')
    .split('?')[0]
    .replace(/\/+$/, '')
    .toLowerCase();
  return authenticationEndpointSuffixes.some(
    (endpoint) => path === endpoint.slice(1) || path.endsWith(endpoint),
  );
}

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  if (isAuthenticationRequest(config.url)) {
    config.headers.delete('Authorization');
    return config;
  }

  const token = useAuthStore.getState().token;
  if (!token) {
    return Promise.reject(
      new Error('An access token is required for this request.')
    );
  }

  config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    if (
      !originalRequest ||
      isAuthenticationRequest(originalRequest.url) ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = api
        .post<TokenRefreshResponse>('/api/v1/token/refresh/', {
          refresh: refreshToken,
        })
        .then(async ({ data }) => {
          await useAuthStore
            .getState()
            .updateTokens(data.access, data.refresh ?? refreshToken);
          return data.access;
        })
        .catch(async (refreshError: unknown) => {
          if (
            axios.isAxiosError(refreshError) &&
            (refreshError.response?.status === 400 ||
              refreshError.response?.status === 401)
          ) {
            await useAuthStore.getState().logout();
          }
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const token = await refreshPromise;
      originalRequest.headers.set('Authorization', `Bearer ${token}`);
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;
