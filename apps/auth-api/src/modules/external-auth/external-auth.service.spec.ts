import { ExternalAuthService } from './external-auth.service';
import type { IdentityService } from '../identity/identity.service';
import type { TokenService } from '../token/token.service';
import type { IdentityUser } from '../identity/identity.types';
import type { ExternalAuthCodeStore } from './external-auth-code.store';

describe('ExternalAuthService', () => {
  let identityService: jest.Mocked<IdentityService>;
  let tokenService: jest.Mocked<TokenService>;
  let externalAuthCodeStore: jest.Mocked<ExternalAuthCodeStore>;
  let service: ExternalAuthService;

  beforeEach(() => {
    identityService = {
      findUserByIdentity: jest.fn(),
      findUserById: jest.fn(),
      createUserWithIdentity: jest.fn(),
      normalizeEmail: jest.fn((email: string) => email.toLowerCase().trim()),
    } as unknown as jest.Mocked<IdentityService>;

    tokenService = {
      login: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    externalAuthCodeStore = {
      create: jest.fn(),
      consume: jest.fn(),
    } as unknown as jest.Mocked<ExternalAuthCodeStore>;

    service = new ExternalAuthService(
      identityService,
      tokenService,
      externalAuthCodeStore,
      {
        getOrThrow: jest.fn().mockImplementation((key: string) => {
          if (key === 'AUTH_EXTERNAL_AUTH_CODE_TTL_SECONDS') {
            return 300;
          }

          throw new Error(`Unexpected config lookup: ${key}`);
        }),
      } as never,
    );
  });

  it('creates a one-time completion code', async () => {
    const user: IdentityUser = {
      id: 'user-3',
      email: 'code@cortex.local',
      roles: [],
    };

    externalAuthCodeStore.create.mockResolvedValue('external-code');

    await expect(
      service.createCompletionCode(
        user,
        'cortex://auth/callback',
        'native',
      ),
    ).resolves.toBe('external-code');

    expect(externalAuthCodeStore.create).toHaveBeenCalledWith(
      {
        userId: 'user-3',
        redirectUri: 'cortex://auth/callback',
        platform: 'native',
      },
      300,
    );
  });

  it('exchanges a valid one-time code for tokens', async () => {
    const user: IdentityUser = {
      id: 'user-4',
      email: 'exchange@cortex.local',
      roles: [],
    };
    const loginResponse = {
      user: { id: user.id, email: user.email, roles: [] },
      tokens: {
        accessToken: 'access',
        refreshToken: 'refresh',
        tokenType: 'Bearer' as const,
        expiresInSeconds: 300,
      },
    };

    externalAuthCodeStore.consume.mockResolvedValue({
      userId: 'user-4',
      redirectUri: 'http://localhost:3000/auth/callback',
      platform: 'web',
    });
    identityService.findUserById.mockResolvedValue(user);
    tokenService.login.mockResolvedValue(loginResponse);

    await expect(service.exchangeCompletionCode('external-code')).resolves.toBe(
      loginResponse,
    );

    expect(externalAuthCodeStore.consume).toHaveBeenCalledWith('external-code');
    expect(identityService.findUserById).toHaveBeenCalledWith('user-4');
    expect(tokenService.login).toHaveBeenCalledWith(user);
  });

  it('rejects an unknown one-time code', async () => {
    externalAuthCodeStore.consume.mockResolvedValue(null);

    await expect(service.exchangeCompletionCode('missing-code')).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'AUTH_INVALID_EXTERNAL_AUTH_CODE',
      }),
    });
  });
});
