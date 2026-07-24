import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Profile,
  Strategy,
} from 'passport-google-oauth20';
import type { AppEnv } from '../../../config/config.validation';
import { GoogleExternalAuthService } from './google-external-auth.service';
import type { IdentityUser } from '../../identity/identity.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly googleExternalAuthService: GoogleExternalAuthService,
    configService: ConfigService<AppEnv, true>,
  ) {
    super({
      clientID: configService.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<IdentityUser> {
    return this.googleExternalAuthService.resolveUser(profile);
  }
}
