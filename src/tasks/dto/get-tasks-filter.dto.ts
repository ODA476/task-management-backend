import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { TaskStatus } from "../entities/task.entity";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class GetTaskFilterDto {
  @ApiPropertyOptional({ enum: TaskStatus, description: 'Filter tasks by their current status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ description: 'Search keywords within the title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'The page number to fetch', default: 1 })
  @IsOptional()
  @Type(() => Number) // Convert the incoming string to a Number
  @IsInt()
  @Min(1) // page > 0
  page?: number = 1; // Default to page 1 if not provided

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number) // Convert the incoming string to a Number
  @IsInt()
  @Min(1)
  limit?: number = 10; // Default to 10 items if not provided
}
