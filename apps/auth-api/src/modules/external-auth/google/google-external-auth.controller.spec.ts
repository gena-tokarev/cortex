import { GoogleExternalAuthController } from './google-external-auth.controller';
import type { ExternalAuthRedirectService } from '../external-auth-redirect.service';
import type { ExternalAuthService } from '../external-auth.service';

describe('GoogleExternalAuthController', () => {
  let externalAuthService: jest.Mocked<ExternalAuthService>;
  let externalAuthRedirectService: jest.Mocked<ExternalAuthRedirectService>;
  let controller: GoogleExternalAuthController;

  beforeEach(() => {
    externalAuthService = {
      createCompletionCode: jest.fn(),
    } as unknown as jest.Mocked<ExternalAuthService>;

    externalAuthRedirectService = {
      parseState: jest.fn(),
      createSuccessRedirect: jest.fn(),
      createErrorRedirect: jest.fn(),
    } as unknown as jest.Mocked<ExternalAuthRedirectService>;

    controller = new GoogleExternalAuthController(
      externalAuthService,
      externalAuthRedirectService,
    );
  });

  it('redirects successful callbacks to the client with a one-time code', async () => {
    externalAuthRedirectService.parseState.mockReturnValue({
      redirectUri: 'cortex://auth/callback',
      platform: 'native',
    });
    externalAuthService.createCompletionCode.mockResolvedValue('code-1');
    externalAuthRedirectService.createSuccessRedirect.mockReturnValue(
      'cortex://auth/callback?code=code-1&status=success',
    );

    const response = {
      redirect: jest.fn(),
    };

    await controller.callback(
      {
        user: { id: 'user-1', email: 'user@cortex.local', roles: [] },
        query: { state: 'state-1' },
      },
      response as never,
    );

    expect(externalAuthService.createCompletionCode).toHaveBeenCalledWith(
      { id: 'user-1', email: 'user@cortex.local', roles: [] },
      'cortex://auth/callback',
      'native',
    );
    expect(response.redirect).toHaveBeenCalledWith(
      'cortex://auth/callback?code=code-1&status=success',
    );
  });

  it('redirects failed callbacks with an error code', async () => {
    externalAuthRedirectService.parseState.mockReturnValue({
      redirectUri: 'http://localhost:3000/auth/callback',
      platform: 'web',
    });
    externalAuthRedirectService.createErrorRedirect.mockReturnValue(
      'http://localhost:3000/auth/callback?error=oauth_cancelled&status=error',
    );

    const response = {
      redirect: jest.fn(),
    };

    await controller.callback(
      {
        user: null,
        query: {
          state: 'state-1',
          error: 'access_denied',
        },
      },
      response as never,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/auth/callback?error=oauth_cancelled&status=error',
    );
  });
});
