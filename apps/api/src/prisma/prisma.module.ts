import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

// * @Global: cualquier módulo (health, auth, tasks...) inyecta PrismaService
// * sin importar este módulo. Hay una sola conexión en toda la API.
@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule {}
