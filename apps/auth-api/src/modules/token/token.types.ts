import type { AuthUserDto } from '../auth-core/dto/auth-response.dto';

export interface TokenUser {
  id: string;
  email: string;
  roles: AuthUserDto['roles'];
}
