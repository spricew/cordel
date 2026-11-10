import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El comentario debe ser texto' })
  @MinLength(1, { message: 'El comentario está vacío' })
  @MaxLength(2000, { message: 'El comentario no puede superar 2000 caracteres' })
  public body!: string;
}
