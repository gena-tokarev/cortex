import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import {
  LoginResponseDto,
  RegisterResponseDto,
} from '../../auth-core/dto/auth-response.dto';
import { AuthSessionService } from '../session.service';
import {
  AuthSessionTransport,
  type AuthenticatedSession,
  type AuthRequestLike,
  type AuthResponseLike,
} from '../session.types';

@Injectable()
export class AuthSessionInterceptor
  implements
    NestInterceptor<
      AuthenticatedSession,
      LoginResponseDto | RegisterResponseDto
    >
{
  constructor(private readonly authSessionService: AuthSessionService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<AuthenticatedSession>,
  ): Observable<LoginResponseDto | RegisterResponseDto> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthRequestLike>();
    const response = http.getResponse<AuthResponseLike>();
    const sessionContext = this.authSessionService.resolveSessionContext(request);

    return next.handle().pipe(
      map((session) => {
        if (sessionContext.transport === AuthSessionTransport.Cookie) {
          this.authSessionService.setAuthCookies(response, session.tokens);
        }

        return this.authSessionService.createLoginResponse(
          sessionContext,
          session,
        );
      }),
    );
  }
}
