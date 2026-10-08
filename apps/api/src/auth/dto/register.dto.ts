import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

// Describe la forma del body de
// POST /api/v1/auth/register y sus reglas. El ValidationPipe global lo
// revisa solo antes de que llegue al controlador: si algo falla,
// responde 400 sin ni un if.
export class RegisterDto {
  // Evita que al guardar un email, se pueda duplicar
  // usando el mismo correo pero con minusculas/mayusculas
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  public email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  public name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  public password!: string;
}
