import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';

// PrismaService llega solo: PrismaModule es @Global y no hay que importarlo.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
