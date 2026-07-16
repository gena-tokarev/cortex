import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthPlatform } from '../session/session.types';
import { ExternalAuthRedirectService } from './external-auth-redirect.service';

describe('ExternalAuthRedirectService', () => {
  let service: ExternalAuthRedirectService;

  beforeEach(() => {
    service = new ExternalAuthRedirectService({
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'AUTH_EXTERNAL_AUTH_STATE_SECRET') {
          return 'external-auth-state-secret';
        }

        return undefined;
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'AUTH_ACCESS_TOKEN_SECRET':
            return 'access-token-secret';
          case 'GOOGLE_ALLOWED_WEB_REDIRECT_URIS':
            return 'http://localhost:3000,https://app.focoris.com/auth/callback';
          case 'GOOGLE_ALLOWED_NATIVE_REDIRECT_URIS':
            return 'focoris://auth/callback,myapp://oauth/*';
          default:
            throw new Error(`Unexpected config lookup: ${key}`);
        }
      }),
    } as never);
  });

  it('accepts an allowed web redirect and preserves it through state', () => {
    const state = service.createState({
      redirectUri: 'https://app.focoris.com/auth/callback',
    }, AuthPlatform.Web);

    expect(service.parseState(state)).toEqual({
      redirectUri: 'https://app.focoris.com/auth/callback',
      platform: 'web',
    });
  });

  it('accepts an allowed native redirect and preserves it through state', () => {
    const state = service.createState({
      redirectUri: 'focoris://auth/callback',
    }, AuthPlatform.Native);

    expect(service.parseState(state)).toEqual({
      redirectUri: 'focoris://auth/callback',
      platform: 'native',
    });
  });

  it('rejects an unapproved redirect uri', () => {
    expect(() =>
      service.createState({
        redirectUri: 'https://evil.example.com/auth/callback',
      }, AuthPlatform.Web),
    ).toThrow(BadRequestException);
  });

  it('rejects a tampered state payload', () => {
    const state = service.createState({
      redirectUri: 'focoris://auth/callback',
    }, AuthPlatform.Native);

    expect(() => service.parseState(`${state}x`)).toThrow(UnauthorizedException);
  });

  it('adds a code to success redirects', () => {
    expect(
      service.createSuccessRedirect(
        {
          redirectUri: 'focoris://auth/callback?source=google',
          platform: 'native',
        },
        'code-123',
      ),
    ).toBe('focoris://auth/callback?source=google&code=code-123&status=success');
  });
});
