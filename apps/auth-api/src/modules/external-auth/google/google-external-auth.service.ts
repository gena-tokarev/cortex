import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import type { Profile } from 'passport-google-oauth20';
import {
  AuthErrorCode,
  AuthErrorResponseDto,
} from '../../auth-core/dto/auth-response.dto';
import { IdentityService } from '../../identity/identity.service';
import type { IdentityUser } from '../../identity/identity.types';

@Injectable()
export class GoogleExternalAuthService {
  constructor(private readonly identityService: IdentityService) {}

  async resolveUser(profile: Profile): Promise<IdentityUser> {
    const providerUserId = profile.id.trim();
    const existingUser = await this.identityService.findUserByIdentity(
      AuthProvider.google,
      providerUserId,
    );

    if (existingUser) {
      return existingUser;
    }

    const email = this.getEmail(profile);

    return this.identityService.createUserWithIdentity({
      email,
      identity: {
        provider: AuthProvider.google,
        providerUserId,
        email,
        emailVerified: profile.emails?.some((entry) => entry.verified) ?? false,
        displayName: profile.displayName,
      },
    });
  }

  private getEmail(profile: Profile): string {
    const email =
      profile.emails?.find((entry) => entry.verified)?.value ??
      profile.emails?.[0]?.value;

    if (!email) {
      throw new BadRequestException({
        statusCode: 400,
        code: AuthErrorCode.InvalidCredentials,
        message: 'External identity did not provide an email address',
      } satisfies AuthErrorResponseDto);
    }

    return this.identityService.normalizeEmail(email);
  }
}
