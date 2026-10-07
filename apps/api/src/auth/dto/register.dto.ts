import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

// Describe la forma del body de
// POST /api/v1/auth/register y sus reglas. El ValidationPipe global lo
// revisa solo antes de que llegue al controlador: si algo falla,
// responde 400 sin ni un if.
export class RegisterDto {
    @IsEmail()
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
