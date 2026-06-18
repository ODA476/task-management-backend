import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: 'The title of the task', example: 'Buy groceries' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, {message: 'Title must be at least 3 characters long'})
  title: string;

  @ApiProperty({ description: 'Detailed description of what needs to be done', example: 'Milk, eggs, and bread' })
  @IsNotEmpty()
  @IsString()
  description: string;
}
