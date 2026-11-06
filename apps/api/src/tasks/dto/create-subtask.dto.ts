import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TASK_PRIORITIES, TASK_STATUSES } from './create-task.dto.js';
import type { Priority, TaskStatus } from '@cordel/types';

export class CreateSubtaskDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El título debe ser texto' })
  @MinLength(1, { message: 'El título es obligatorio' })
  @MaxLength(150, { message: 'El título no puede superar 150 caracteres' })
  public title!: string;

  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  public description?: string;

  @IsOptional()
  @IsEnum(TASK_STATUSES, {
    message: 'El estado debe ser PENDING, IN_PROGRESS, DONE o BLOCKED',
  })
  public status?: TaskStatus;

  @IsOptional()
  @IsEnum(TASK_PRIORITIES, {
    message: 'La prioridad debe ser LOW, MEDIUM, HIGH o URGENT',
  })
  public priority?: Priority;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha límite debe ser una fecha ISO' })
  public dueDate?: string;

  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'El motivo del bloqueo debe ser texto' })
  @MinLength(1, { message: 'El motivo del bloqueo está vacío' })
  public blockedReason?: string;
}
