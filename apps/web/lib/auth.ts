export const AUTH_PLATFORM_HEADER = 'x-auth-platform';
export const WEB_AUTH_PLATFORM = 'web';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
}

export interface LoginResponse {
  user: AuthUser;
  tokens?: AuthTokenPair;
}

export function getAuthApiBaseUrl(): string {
  return process.env.AUTH_API_URL ?? 'http://localhost:3001';
}
