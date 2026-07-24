import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { AppEnv } from '../../config/config.validation';
import {
  AuthErrorCode,
  AuthErrorResponseDto,
} from '../auth-core/dto/auth-response.dto';
import { decodeBase64UrlJson, encodeBase64UrlJson } from '@focoris/encoding';
import { AuthPlatform } from '../session/session.types';
import type {
  ExternalAuthPlatform,
  ExternalAuthRedirectContext,
} from './external-auth.types';

type QueryValue = string | string[] | undefined;

@Injectable()
export class ExternalAuthRedirectService {
  private readonly stateSecret: string;
  private readonly allowedWebRedirectUris: string[];
  private readonly allowedNativeRedirectUris: string[];

  constructor(configService: ConfigService<AppEnv, true>) {
    this.stateSecret =
      configService.get('AUTH_EXTERNAL_AUTH_STATE_SECRET') ??
      configService.getOrThrow('AUTH_ACCESS_TOKEN_SECRET');
    this.allowedWebRedirectUris = this.parseAllowList(
      configService.getOrThrow('GOOGLE_ALLOWED_WEB_REDIRECT_URIS'),
    );
    this.allowedNativeRedirectUris = this.parseAllowList(
      configService.getOrThrow('GOOGLE_ALLOWED_NATIVE_REDIRECT_URIS'),
    );
  }

  createState(
    query: {
      redirectUri?: QueryValue;
    },
    platform: ExternalAuthPlatform,
  ): string {
    const redirectUri = this.getSingleQueryValue(
      query.redirectUri,
      'redirectUri',
    );

    this.assertAllowedRedirectUri(redirectUri, platform);

    const context = {
      redirectUri,
      platform,
    } satisfies ExternalAuthRedirectContext;
    const payload = encodeBase64UrlJson(context);
    const signature = this.sign(payload);

    return `${payload}.${signature}`;
  }

  parseState(state: QueryValue): ExternalAuthRedirectContext {
    const encodedState = this.getSingleQueryValue(state, 'state');
    const [payload, signature] = encodedState.split('.');

    if (!payload || !signature || !this.isValidSignature(payload, signature)) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: AuthErrorCode.InvalidExternalAuthRequest,
        message: 'Invalid external auth state',
      } satisfies AuthErrorResponseDto);
    }

    let context: ExternalAuthRedirectContext;

    try {
      context = decodeBase64UrlJson<ExternalAuthRedirectContext>(payload);
    } catch {
      throw new UnauthorizedException({
        statusCode: 401,
        code: AuthErrorCode.InvalidExternalAuthRequest,
        message: 'Invalid external auth state',
      } satisfies AuthErrorResponseDto);
    }

    this.assertAllowedRedirectUri(context.redirectUri, context.platform);

    return context;
  }

  createSuccessRedirect(
    context: ExternalAuthRedirectContext,
    code: string,
  ): string {
    const url = new URL(context.redirectUri);
    url.searchParams.set('code', code);
    url.searchParams.set('status', 'success');

    return url.toString();
  }

  createErrorRedirect(
    context: ExternalAuthRedirectContext,
    errorCode: string,
  ): string {
    const url = new URL(context.redirectUri);
    url.searchParams.set('error', errorCode);
    url.searchParams.set('status', 'error');

    return url.toString();
  }

  private assertAllowedRedirectUri(
    redirectUri: string,
    platform: ExternalAuthPlatform,
  ): void {
    const parsedUri = this.parseUrl(redirectUri);

    const isAllowed =
      platform === AuthPlatform.Web
        ? this.isAllowedWebRedirectUri(parsedUri)
        : this.isAllowedNativeRedirectUri(parsedUri.toString());

    if (!isAllowed) {
      throw new BadRequestException({
        statusCode: 400,
        code: AuthErrorCode.InvalidExternalAuthRequest,
        message: 'redirectUri is not allowed',
      } satisfies AuthErrorResponseDto);
    }
  }

  private isAllowedWebRedirectUri(candidate: URL): boolean {
    return this.allowedWebRedirectUris.some((entry) => {
      const allowed = this.parseUrl(entry);

      if (this.isOriginOnlyUrl(allowed)) {
        return candidate.origin === allowed.origin;
      }

      return candidate.toString() === allowed.toString();
    });
  }

  private isAllowedNativeRedirectUri(candidate: string): boolean {
    return this.allowedNativeRedirectUris.some((entry) => {
      if (entry.endsWith('*')) {
        return candidate.startsWith(entry.slice(0, -1));
      }

      return candidate === this.parseUrl(entry).toString();
    });
  }

  private parseAllowList(value: string): string[] {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  private getSingleQueryValue(value: QueryValue, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        code: AuthErrorCode.InvalidExternalAuthRequest,
        message: `${fieldName} is required`,
      } satisfies AuthErrorResponseDto);
    }

    return value.trim();
  }

  private parseUrl(value: string): URL {
    try {
      return new URL(value);
    } catch {
      throw new BadRequestException({
        statusCode: 400,
        code: AuthErrorCode.InvalidExternalAuthRequest,
        message: 'redirectUri must be a valid URL',
      } satisfies AuthErrorResponseDto);
    }
  }

  private isOriginOnlyUrl(url: URL): boolean {
    return url.pathname === '/' && !url.search && !url.hash;
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.stateSecret)
      .update(payload)
      .digest('base64url');
  }

  private isValidSignature(payload: string, signature: string): boolean {
    const expectedSignature = this.sign(payload);
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  }
}
