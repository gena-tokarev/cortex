import {
  Body,
  Controller,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ExternalAuthCodeExchangeDto } from './dto/external-auth-code-exchange.dto';
import { ExternalAuthService } from './external-auth.service';
import { AuthSessionInterceptor } from '../session/interceptors/auth-session.interceptor';
import type { AuthenticatedSession } from '../session/session.types';

@Controller('external-auth')
export class ExternalAuthController {
  constructor(private readonly externalAuthService: ExternalAuthService) {}

  @Post('exchange')
  @UseInterceptors(AuthSessionInterceptor)
  exchangeCode(
    @Body() payload: ExternalAuthCodeExchangeDto,
  ): Promise<AuthenticatedSession> {
    return this.externalAuthService.exchangeCompletionCode(payload.code);
  }
}
