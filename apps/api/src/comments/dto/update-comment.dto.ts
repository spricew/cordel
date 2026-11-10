import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'El comentario debe ser texto' })
  @MinLength(1, { message: 'El comentario está vacío' })
  @MaxLength(2000, { message: 'El comentario no puede superar 2000 caracteres' })
  public body?: string;
}
