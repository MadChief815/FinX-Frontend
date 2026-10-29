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

function isDefinitiveRefreshFailure(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    [400, 401, 403].includes(error.response?.status ?? 0)
  );
}

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  if (isAuthenticationRequest(config.url)) {
    config.headers.delete('Authorization');
    return config;
  }

  const { token, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !token) {
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
    if (!originalRequest || isAuthenticationRequest(originalRequest.url)) {
      return Promise.reject(error);
    }

    const authState = useAuthStore.getState();
    const currentAuthorization = authState.token
      ? `Bearer ${authState.token}`
      : null;

    if (originalRequest._retry) {
      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (
      authState.isAuthenticated &&
      currentAuthorization &&
      originalRequest.headers.get('Authorization') !== currentAuthorization
    ) {
      originalRequest._retry = true;
      originalRequest.headers.set('Authorization', currentAuthorization);
      return api(originalRequest);
    }

    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    if (!refreshPromise) {
      refreshPromise = api
        .post<TokenRefreshResponse>('token/refresh/', {
          refresh: refreshToken,
        })
        .then(async ({ data }) => {
          if (typeof data.access !== 'string' || !data.access.trim()) {
            throw new Error('Token refresh response did not include a valid access token.');
          }

          const currentAuthState = useAuthStore.getState();
          if (currentAuthState.refreshToken !== refreshToken) {
            if (currentAuthState.isAuthenticated && currentAuthState.token) {
              return currentAuthState.token;
            }
            throw new Error('The authentication session changed during token refresh.');
          }

          await useAuthStore.getState().updateTokens(
            data.access,
            data.refresh || refreshToken,
          );
          return data.access;
        })
        .catch(async (refreshError: unknown) => {
          if (isDefinitiveRefreshFailure(refreshError)) {
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
