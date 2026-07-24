import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { IdentityUser } from '../../identity/identity.types';
import { ExternalAuthRedirectService } from '../external-auth-redirect.service';
import { ExternalAuthService } from '../external-auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleAuthStartGuard } from './google-auth-start.guard';

interface RedirectResponse {
  redirect(url: string): void;
}

interface GoogleCallbackRequest {
  user: IdentityUser | null;
  query: {
    state?: string;
    error?: string;
  };
  externalAuthError?: unknown;
}

@Controller('external-auth/google')
export class GoogleExternalAuthController {
  constructor(
    private readonly externalAuthService: ExternalAuthService,
    private readonly externalAuthRedirectService: ExternalAuthRedirectService,
  ) {}

  @UseGuards(GoogleAuthStartGuard)
  @Get()
  login(): void {}

  @UseGuards(GoogleAuthGuard)
  @Get('callback')
  async callback(
    @Req() request: GoogleCallbackRequest,
    @Res() response: RedirectResponse,
  ): Promise<void> {
    const redirectContext = this.externalAuthRedirectService.parseState(
      request.query.state,
    );

    if (request.user) {
      const code = await this.externalAuthService.createCompletionCode(
        request.user,
        redirectContext.redirectUri,
        redirectContext.platform,
      );

      response.redirect(
        this.externalAuthRedirectService.createSuccessRedirect(
          redirectContext,
          code,
        ),
      );
      return;
    }

    response.redirect(
      this.externalAuthRedirectService.createErrorRedirect(
        redirectContext,
        this.getCallbackErrorCode(request),
      ),
    );
  }

  private getCallbackErrorCode(request: GoogleCallbackRequest): string {
    if (request.query.error === 'access_denied') {
      return 'oauth_cancelled';
    }

    return 'oauth_failed';
  }
}
