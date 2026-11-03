import { Module, Global } from '@nestjs/common';
import { RolesService } from './roles.service.js';

// Global como PrismaModule: resolver roles es transversal
// (equipos, RBAC, guards, futuros módulos lo van a usar).
@Global()
@Module({
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
