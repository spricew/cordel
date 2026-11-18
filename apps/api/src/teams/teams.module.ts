import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';

@Module({
  imports: [AuditModule], // TEAM_CREATED
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
