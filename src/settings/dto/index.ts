import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  IsIn,
  Min,
  Max,
  MinLength,
  IsEmail,
} from 'class-validator';

export class UpdateSettingsDto {
  // AI
  @IsOptional()
  @IsString()
  openai_api_key?: string;

  @IsOptional()
  @IsString()
  openai_model?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(4000)
  ai_max_tokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  ai_temperature?: number;

  // Sending defaults
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  sending_start_hour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  sending_end_hour?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  daily_limit_per_account?: number;

  // SMTP defaults
  @IsOptional()
  @IsString()
  default_smtp_host?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  default_smtp_port?: number;

  // Email provider
  @IsOptional()
  @IsString()
  @IsIn(['smtp', 'resend'])
  email_provider?: string;

  @IsOptional()
  @IsString()
  resend_api_key?: string;

  @IsOptional()
  @IsString()
  resend_from_email?: string;

  // Tracking
  @IsOptional()
  @IsString()
  tracking_domain?: string;

  // Compliance
  @IsOptional()
  @IsBoolean()
  auto_unsubscribe_link?: boolean;

  @IsOptional()
  @IsString()
  sender_company_name?: string;

  @IsOptional()
  @IsString()
  sender_contact_info?: string;
}

export class TestSmtpDto {
  @IsString()
  @MinLength(1)
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  @MinLength(1)
  username: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class TestOpenaiDto {
  @IsString()
  @MinLength(1)
  api_key: string;
}

export class TestResendDto {
  @IsString()
  @MinLength(1)
  api_key: string;
}
