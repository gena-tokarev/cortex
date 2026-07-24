import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import {
  AuthTokenPairDto,
  RefreshResponseDto,
} from '../../auth-core/dto/auth-response.dto';
import { AuthSessionService } from '../session.service';
import {
  AuthSessionTransport,
  type AuthRequestLike,
  type AuthResponseLike,
} from '../session.types';

@Injectable()
export class AuthRefreshInterceptor
  implements NestInterceptor<AuthTokenPairDto, RefreshResponseDto>
{
  constructor(private readonly authSessionService: AuthSessionService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<AuthTokenPairDto>,
  ): Observable<RefreshResponseDto> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthRequestLike>();
    const response = http.getResponse<AuthResponseLike>();
    const sessionContext = this.authSessionService.resolveSessionContext(request);

    return next.handle().pipe(
      map((tokens) => {
        if (sessionContext.transport === AuthSessionTransport.Cookie) {
          this.authSessionService.setAuthCookies(response, tokens);
        }

        return this.authSessionService.createRefreshResponse(
          sessionContext,
          tokens,
        );
      }),
    );
  }
}
