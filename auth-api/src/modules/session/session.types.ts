import type {
  AuthTokenPairDto,
  AuthUserDto,
} from '../../core/dto/auth-response.dto';

export enum AuthPlatform {
  Web = 'web',
  Native = 'native',
}

export enum AuthSessionTransport {
  Token = 'token',
  Cookie = 'cookie',
}

export interface AuthenticatedSession {
  user: AuthUserDto;
  tokens: AuthTokenPairDto;
}

export interface AuthSessionContext {
  platform: AuthPlatform;
  transport: AuthSessionTransport;
}

export interface AuthRequestLike {
  headers: {
    authorization?: string;
    cookie?: string;
    'x-auth-platform'?: string | string[];
  };
}

export interface AuthCookieOptionsLike {
  domain?: string;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
}

export interface AuthResponseLike {
  clearCookie(name: string, options?: AuthCookieOptionsLike): void;
  cookie(name: string, value: string, options?: AuthCookieOptionsLike): void;
}
