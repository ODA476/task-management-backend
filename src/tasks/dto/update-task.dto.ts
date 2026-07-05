import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

// Define your TaskStatus enum inside the file if it's not imported globally
export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'Status must be a valid enum value (OPEN, IN_PROGRESS, DONE)',
  })
  status?: TaskStatus;
}
