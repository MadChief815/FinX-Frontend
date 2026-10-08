import {
  login as loginService,
  register as registerService,
} from '../services/auth.service';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../services/auth.service';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

function toAuthSession(response: AuthResponse): AuthSession {
  return {
    accessToken: response.access,
    refreshToken: response.refresh,
  };
}

export async function login(request: LoginRequest): Promise<AuthSession> {
  return toAuthSession(await loginService(request));
}

export async function register(request: RegisterRequest): Promise<AuthSession> {
  return toAuthSession(await registerService(request));
}
