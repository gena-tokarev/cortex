import type { AuthPlatform } from '../session/session.types';

export type ExternalAuthPlatform = AuthPlatform;

export interface ExternalAuthRedirectContext {
  redirectUri: string;
  platform: ExternalAuthPlatform;
}

export interface StoredExternalAuthCode extends ExternalAuthRedirectContext {
  userId: string;
}
