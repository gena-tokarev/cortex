import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AuthErrorCode,
  AuthErrorResponseDto,
} from '../auth-core/dto/auth-response.dto';
import { IdentityService } from '../identity/identity.service';
import type { IdentityUser } from '../identity/identity.types';
import { TokenService } from '../token/token.service';
import { ExternalAuthCodeStore } from './store/external-auth-code.store';
import type { ExternalAuthPlatform } from './external-auth.types';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from '../../config/config.validation';
import type { AuthenticatedSession } from '../session/session.types';

@Injectable()
export class ExternalAuthService {
  private readonly externalAuthCodeTtlSeconds: number;

  constructor(
    private readonly identityService: IdentityService,
    private readonly tokenService: TokenService,
    private readonly externalAuthCodeStore: ExternalAuthCodeStore,
    configService: ConfigService<AppEnv, true>,
  ) {
    this.externalAuthCodeTtlSeconds = configService.getOrThrow(
      'AUTH_EXTERNAL_AUTH_CODE_TTL_SECONDS',
    );
  }

  login(user: IdentityUser): Promise<AuthenticatedSession> {
    return this.tokenService.login(user);
  }

  async createCompletionCode(
    user: IdentityUser,
    redirectUri: string,
    platform: ExternalAuthPlatform,
  ): Promise<string> {
    return this.externalAuthCodeStore.create(
      {
        userId: user.id,
        redirectUri,
        platform,
      },
      this.externalAuthCodeTtlSeconds,
    );
  }

  async exchangeCompletionCode(code: string): Promise<AuthenticatedSession> {
    const storedCode = await this.externalAuthCodeStore.consume(code);

    if (!storedCode) {
      throw new BadRequestException({
        statusCode: 400,
        code: AuthErrorCode.InvalidExternalAuthCode,
        message: 'Invalid external auth code',
      } satisfies AuthErrorResponseDto);
    }

    const user = await this.identityService.findUserById(storedCode.userId);

    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        code: AuthErrorCode.InvalidExternalAuthCode,
        message: 'Invalid external auth code',
      } satisfies AuthErrorResponseDto);
    }

    return this.login(user);
  }
}
