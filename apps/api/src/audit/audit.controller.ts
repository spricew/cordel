import { Controller, DefaultValuePipe, Get, ParseIntPipe, Param, Query } from '@nestjs/common';
import type { AuditLog, UserSummary } from '@cordel/types';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RequirePermission } from '../roles/require-permission.decorator.js';
import { AuditService } from './audit.service.js';

/* Solo lectura, y solo para OWNER/ADMIN (`audit:read`): la bitácora
 * es un asunto de gestión, no de miembros. El slug de la ruta delimita
 * la organización — nadie ve logs de otra. */
@Controller('organizations')
export class AuditController {
  public constructor(private readonly audit: AuditService) {}

  @RequirePermission('audit:read', 'slug')
  @Get(':slug/audit-logs')
  public list(
    @CurrentUser() user: UserSummary,
    @Param('slug') slug: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<AuditLog[]> {
    return this.audit.list(slug, limit);
  }
}
