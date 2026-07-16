import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from '../../config/config.validation';
import {
  AuthTokenPairDto,
  LoginResponseDto,
  RefreshResponseDto,
  RegisterResponseDto,
} from '../../core/dto/auth-response.dto';
import { AuthPlatform, AuthSessionTransport } from './session.types';
import type {
  AuthenticatedSession,
  AuthRequestLike,
  AuthResponseLike,
  AuthCookieOptionsLike,
  AuthSessionContext,
} from './session.types';
import {
  AuthErrorCode,
  type AuthErrorResponseDto,
} from '../../core/dto/auth-response.dto';

const PLATFORM_HEADER = 'x-auth-platform';

@Injectable()
export class AuthSessionService {
  private readonly accessTokenCookieName: string;
  private readonly refreshTokenCookieName: string;
  private readonly cookieDomain?: string;
  private readonly cookieSecure: boolean;
  private readonly cookieSameSite: 'lax' | 'strict' | 'none';
  private readonly refreshTokenTtlMilliseconds: number;

  constructor(configService: ConfigService<AppEnv, true>) {
    this.accessTokenCookieName = configService.getOrThrow(
      'AUTH_COOKIE_ACCESS_TOKEN_NAME',
    );
    this.refreshTokenCookieName = configService.getOrThrow(
      'AUTH_COOKIE_REFRESH_TOKEN_NAME',
    );
    this.cookieDomain = configService.get('AUTH_COOKIE_DOMAIN');
    this.cookieSecure = configService.getOrThrow('AUTH_COOKIE_SECURE');
    this.cookieSameSite = configService.getOrThrow('AUTH_COOKIE_SAME_SITE');
    this.refreshTokenTtlMilliseconds =
      configService.getOrThrow('AUTH_REFRESH_TOKEN_TTL_SECONDS') * 1000;
  }

  resolveSessionContext(request: AuthRequestLike): AuthSessionContext {
    const headerValue = request.headers[PLATFORM_HEADER];
    const normalizedValue = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (normalizedValue === AuthPlatform.Web) {
      return {
        platform: AuthPlatform.Web,
        transport: AuthSessionTransport.Cookie,
      };
    }

    if (normalizedValue === AuthPlatform.Native) {
      return {
        platform: AuthPlatform.Native,
        transport: AuthSessionTransport.Token,
      };
    }

    throw new BadRequestException({
      statusCode: 400,
      code: AuthErrorCode.InvalidAuthPlatform,
      message: `${PLATFORM_HEADER} must be one of: web, native`,
    } satisfies AuthErrorResponseDto);
  }

  createLoginResponse(
    sessionContext: AuthSessionContext,
    session: AuthenticatedSession,
  ): LoginResponseDto {
    const { transport } = sessionContext;

    if (transport === AuthSessionTransport.Cookie) {
      return {
        user: session.user,
      };
    }

    return {
      user: session.user,
      tokens: session.tokens,
    };
  }

  createRegisterResponse(
    sessionContext: AuthSessionContext,
    session: AuthenticatedSession,
  ): RegisterResponseDto {
    const { transport } = sessionContext;

    if (transport === AuthSessionTransport.Cookie) {
      return {
        user: session.user,
      };
    }

    return {
      user: session.user,
      tokens: session.tokens,
    };
  }

  createRefreshResponse(
    sessionContext: AuthSessionContext,
    tokens: AuthTokenPairDto,
  ): RefreshResponseDto {
    const { transport } = sessionContext;

    if (transport === AuthSessionTransport.Cookie) {
      return {};
    }

    return {
      tokens,
    };
  }

  setAuthCookies(response: AuthResponseLike, tokens: AuthTokenPairDto): void {
    response.cookie(
      this.accessTokenCookieName,
      tokens.accessToken,
      this.buildCookieOptions(tokens.expiresInSeconds * 1000),
    );
    response.cookie(
      this.refreshTokenCookieName,
      tokens.refreshToken,
      this.buildCookieOptions(this.refreshTokenTtlMilliseconds),
    );
  }

  clearAuthCookies(response: AuthResponseLike): void {
    response.clearCookie(this.accessTokenCookieName, this.buildCookieOptions());
    response.clearCookie(
      this.refreshTokenCookieName,
      this.buildCookieOptions(),
    );
  }

  getRefreshTokenFromRequest(
    request: AuthRequestLike,
    payloadRefreshToken?: string,
  ): string | undefined {
    const sessionContext = this.resolveSessionContext(request);

    if (sessionContext.transport === AuthSessionTransport.Cookie) {
      return this.getCookieValue(request, this.refreshTokenCookieName);
    }

    return payloadRefreshToken;
  }

  getAccessTokenFromRequest(request: AuthRequestLike): string | undefined {
    const authorization = request.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length).trim();
    }

    return this.getCookieValue(request, this.accessTokenCookieName);
  }

  private buildCookieOptions(maxAge?: number): AuthCookieOptionsLike {
    return {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: this.cookieSameSite,
      path: '/',
      domain: this.cookieDomain,
      maxAge,
    };
  }

  private getCookieValue(
    request: AuthRequestLike,
    cookieName: string,
  ): string | undefined {
    const rawCookieHeader = request.headers.cookie;

    if (!rawCookieHeader) {
      return undefined;
    }

    for (const cookie of rawCookieHeader.split(';')) {
      const [rawName, ...valueParts] = cookie.split('=');

      if (rawName?.trim() !== cookieName) {
        continue;
      }

      return decodeURIComponent(valueParts.join('=').trim());
    }

    return undefined;
  }
}
