import { Transform } from 'class-transformer';
import { IsBase64, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateAttachmentDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre del archivo debe ser texto' })
  @MinLength(1, { message: 'El nombre del archivo está vacío' })
  @MaxLength(255, { message: 'El nombre no puede superar 255 caracteres' })
  public fileName!: string;

  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'El tipo de archivo debe ser texto' })
  @MaxLength(100, { message: 'El tipo de archivo no puede superar 100 caracteres' })
  @Matches(/^[\w.+-]+\/[\w.+-]+$/, {
    message: 'El tipo de archivo no es válido (forma tipo/subtipo)',
  })
  public mimeType!: string;

  @IsBase64({}, { message: 'El contenido no es base64 válido' })
  @IsString({ message: 'El contenido debe venir codificado en base64' })
  public contentBase64!: string;
}
