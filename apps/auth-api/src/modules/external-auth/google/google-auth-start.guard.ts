import { ExecutionContext, Injectable } from '@nestjs/common';
import { ExternalAuthRedirectService } from '../external-auth-redirect.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { AuthSessionService } from '../../session/session.service';
import type { AuthRequestLike } from '../../session/session.types';

interface GoogleAuthStartRequest {
  query: {
    redirectUri?: string | string[];
  };
}

@Injectable()
export class GoogleAuthStartGuard extends GoogleAuthGuard {
  constructor(
    private readonly externalAuthRedirectService: ExternalAuthRedirectService,
    private readonly authSessionService: AuthSessionService,
  ) {
    super();
  }

  override getAuthenticateOptions(
    context: ExecutionContext,
  ): Record<string, unknown> {
    const request = context.switchToHttp().getRequest<
      GoogleAuthStartRequest & AuthRequestLike
    >();
    const sessionContext = this.authSessionService.resolveSessionContext(request);

    return {
      session: false,
      prompt: 'select_account',
      state: this.externalAuthRedirectService.createState(
        request.query,
        sessionContext.platform,
      ),
    };
  }
}
