import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The token sent to the user email link' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newSecurePassword123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}
