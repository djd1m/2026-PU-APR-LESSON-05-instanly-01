import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  name: string;
}

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(['member', 'owner'])
  role?: 'member' | 'owner' = 'member';
}
