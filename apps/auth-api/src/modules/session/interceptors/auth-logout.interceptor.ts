import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import type { LogoutResponseDto } from '../../auth-core/dto/auth-response.dto';
import { AuthSessionService } from '../session.service';
import {
  AuthSessionTransport,
  type AuthRequestLike,
  type AuthResponseLike,
} from '../session.types';

@Injectable()
export class AuthLogoutInterceptor
  implements NestInterceptor<LogoutResponseDto, LogoutResponseDto>
{
  constructor(private readonly authSessionService: AuthSessionService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<LogoutResponseDto>,
  ): Observable<LogoutResponseDto> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthRequestLike>();
    const response = http.getResponse<AuthResponseLike>();
    const sessionContext = this.authSessionService.resolveSessionContext(request);

    return next.handle().pipe(
      map((result) => {
        if (sessionContext.transport === AuthSessionTransport.Cookie) {
          this.authSessionService.clearAuthCookies(response);
        }

        return result;
      }),
    );
  }
}
