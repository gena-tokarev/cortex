import { AuthErrorCode } from '../auth-core/dto/auth-response.dto';
import { AuthPlatform, AuthSessionTransport } from './session.types';
import { AuthSessionService } from './session.service';

describe('AuthSessionService', () => {
  function createService(): AuthSessionService {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'AUTH_COOKIE_DOMAIN') {
          return undefined;
        }

        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        switch (key) {
          case 'AUTH_COOKIE_ACCESS_TOKEN_NAME':
            return 'cortex_access_token';
          case 'AUTH_COOKIE_REFRESH_TOKEN_NAME':
            return 'cortex_refresh_token';
          case 'AUTH_COOKIE_SECURE':
            return false;
          case 'AUTH_COOKIE_SAME_SITE':
            return 'lax';
          case 'AUTH_REFRESH_TOKEN_TTL_SECONDS':
            return 604800;
          default:
            throw new Error(`Unexpected config key: ${key}`);
        }
      }),
    };

    return new AuthSessionService(configService as never);
  }

  it('resolves web requests to cookie session mode', () => {
    const service = createService();

    expect(
      service.resolveSessionContext({
        headers: {
          'x-auth-platform': 'web',
        },
      }),
    ).toEqual({
      platform: AuthPlatform.Web,
      transport: AuthSessionTransport.Cookie,
    });
  });

  it('resolves native requests to token session mode', () => {
    const service = createService();

    expect(
      service.resolveSessionContext({
        headers: {
          'x-auth-platform': 'native',
        },
      }),
    ).toEqual({
      platform: AuthPlatform.Native,
      transport: AuthSessionTransport.Token,
    });
  });

  it('rejects missing auth platform headers', () => {
    const service = createService();

    try {
      service.resolveSessionContext({
        headers: {},
      });
      fail('Expected resolveSessionContext to throw');
    } catch (error) {
      expect(error).toMatchObject({
        response: {
          code: AuthErrorCode.InvalidAuthPlatform,
        },
      });
    }
  });
});
