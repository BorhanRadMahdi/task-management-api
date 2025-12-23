import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus, TaskPriority } from '../entities/task.entity';

export class FilterTaskDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsString()
  @IsOptional()
  search?: string;
}
