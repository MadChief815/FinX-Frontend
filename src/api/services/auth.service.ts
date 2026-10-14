import api from '../../services/api';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  id?: number;
  email?: string;
  username?: string;
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('login/', request);
  return response.data;
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('register/', request);
  return response.data;
}
