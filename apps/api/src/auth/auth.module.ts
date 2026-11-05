import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SessionGuard } from './session.guard.js';
import { PermissionGuard } from '../roles/permission.guard.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    // Orden de la cadena: autenticación (401) ANTES que autorización.
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AuthModule {}
