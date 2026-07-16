import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { IdentityModule } from '../identity/identity.module';
import { SessionModule } from '../session/session.module';
import { TokenModule } from '../token/token.module';
import { ExternalAuthCodeStore } from './external-auth-code.store';
import { ExternalAuthController } from './external-auth.controller';
import { ExternalAuthRedirectService } from './external-auth-redirect.service';
import { ExternalAuthService } from './external-auth.service';
import { GoogleAuthGuard } from './google/google-auth.guard';
import { GoogleAuthStartGuard } from './google/google-auth-start.guard';
import { GoogleStrategy } from './google/google.strategy';

@Module({
  imports: [PassportModule, IdentityModule, SessionModule, TokenModule],
  controllers: [ExternalAuthController],
  providers: [
    ExternalAuthService,
    ExternalAuthCodeStore,
    ExternalAuthRedirectService,
    GoogleAuthGuard,
    GoogleAuthStartGuard,
    GoogleStrategy,
  ],
  exports: [ExternalAuthService],
})
export class ExternalAuthModule {}
