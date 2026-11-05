import { Module, Global } from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { PermissionService } from './permission.service.js';

// Global como PrismaModule: resolver roles es transversal
// (equipos, RBAC, guards, futuros módulos lo van a usar).
@Global()
@Module({
  providers: [RolesService, PermissionService],
  exports: [RolesService, PermissionService],
})
export class RolesModule {}
