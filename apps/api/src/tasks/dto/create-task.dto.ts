import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { Priority, TaskStatus } from '@cordel/types';

export const TASK_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'DONE',
  'BLOCKED',
] as const satisfies readonly TaskStatus[];
export const TASK_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
] as const satisfies readonly Priority[];

export class CreateTaskDto {
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
  @IsString({ message: 'El responsable debe ser un id de usuario' })
  public assigneeId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha límite debe ser una fecha ISO' })
  public dueDate?: string;

  @IsOptional()
  @IsEnum(TASK_PRIORITIES, {
    message: 'La prioridad debe ser LOW, MEDIUM, HIGH o URGENT',
  })
  public priority?: Priority;

  @IsOptional()
  @IsEnum(TASK_STATUSES, {
    message: 'El estado debe ser PENDING, IN_PROGRESS, DONE o BLOCKED',
  })
  public status?: TaskStatus;
}
