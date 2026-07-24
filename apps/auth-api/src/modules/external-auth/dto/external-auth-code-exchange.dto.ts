import { IsString, MinLength } from 'class-validator';

export class ExternalAuthCodeExchangeDto {
  @IsString()
  @MinLength(1)
  code!: string;
}
