import { IsString, IsEmail, IsInt, IsIn, Min, Max } from 'class-validator';

export class CreateAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['yandex', 'mailru', 'custom'])
  provider: string;

  @IsString()
  smtp_host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  smtp_port: number;

  @IsString()
  smtp_username: string;

  @IsString()
  smtp_password: string;

  @IsString()
  imap_host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  imap_port: number;
}
