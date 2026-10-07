import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService, type RegisteredUser } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";

// Traduce HTTP a llamadas al servicio. No sabe de base de
// datos ni de hashes; solo recibe el DTO (ya validado) y devuelve.
// Vive en POST /api/v1/auth/register (prefijo global + "auth").
@Controller("auth")
export class AuthController {
    public constructor(private readonly auth: AuthService) {}

    @Post("register")
    @HttpCode(HttpStatus.CREATED)
    public register(@Body() dto: RegisterDto): Promise<RegisteredUser> {
        return this.auth.register(dto);
    }
}
