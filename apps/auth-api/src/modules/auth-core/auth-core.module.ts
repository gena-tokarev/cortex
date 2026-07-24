import { Module } from '@nestjs/common';
import { RolesGuard } from '@focoris/auth-nest';
import { EmailAuthModule } from '../email-auth/email-auth.module';
import { ExternalAuthModule } from '../external-auth/external-auth.module';
import { IdentityModule } from '../identity/identity.module';
import { PasskeyAuthModule } from '../passkey/passkey-auth.module';
import { SessionModule } from '../session/session.module';
import { TokenModule } from '../token/token.module';
import { AuthCoreController } from './auth-core.controller';
import { AuthCoreService } from './auth-core.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    EmailAuthModule,
    ExternalAuthModule,
    IdentityModule,
    PasskeyAuthModule,
    SessionModule,
    TokenModule,
  ],
  controllers: [AuthCoreController],
  providers: [AuthCoreService, JwtAuthGuard, RolesGuard],
})
export class AuthCoreModule {}
