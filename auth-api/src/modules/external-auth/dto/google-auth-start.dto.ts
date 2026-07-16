import { IsString, MinLength } from 'class-validator';

export class GoogleAuthStartDto {
  @IsString()
  @MinLength(1)
  redirectUri!: string;
}
