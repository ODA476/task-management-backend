import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTaskDescriptionDto {
  @IsNotEmpty()
  @IsString()
  description: string;
}
