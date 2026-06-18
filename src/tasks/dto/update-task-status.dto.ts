import { IsEnum } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus, {
    message: `Status must be a valid value: ${Object.values(TaskStatus).join(', ')}`,
  })
  status: TaskStatus;
}
