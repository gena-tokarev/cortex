import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { IdentityUser } from '../../identity/identity.types';

interface GoogleAuthRequest {
  externalAuthError?: unknown;
  user?: IdentityUser | null;
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override handleRequest<TUser = IdentityUser | null>(
    err: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest<GoogleAuthRequest>();
    request.externalAuthError = err;
    request.user = (user ?? null) as IdentityUser | null;

    return user;
  }
}
