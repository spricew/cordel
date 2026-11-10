import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import type { Invitation, Membership, UserSummary } from '@cordel/types';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RequirePermission } from '../roles/require-permission.decorator.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import { InvitationsService } from './invitations.service.js';

/* Invitaciones: escribir exige la matriz (`member:invite` — OWNER y
 * ADMIN de la org). Aceptar es personal: tu sesión + el token del
 * email, sin permisos de por medio. */
@Controller()
export class InvitationsController {
  public constructor(private readonly invitations: InvitationsService) {}

  @RequirePermission('member:invite', 'slug')
  @Post('organizations/:slug/invitations')
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Param('slug') slug: string,
    @CurrentUser() user: UserSummary,
    @Body() dto: CreateInvitationDto,
  ): Promise<Invitation> {
    return this.invitations.create(slug, user.id, dto);
  }

  @RequirePermission('member:invite', 'slug')
  @Get('organizations/:slug/invitations')
  public listPending(@Param('slug') slug: string): Promise<Invitation[]> {
    return this.invitations.listPending(slug);
  }

  @RequirePermission('member:invite', 'slug')
  @Delete('organizations/:slug/invitations/:invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async revoke(
    @Param('slug') slug: string,
    @Param('invitationId') invitationId: string,
  ): Promise<void> {
    await this.invitations.revoke(slug, invitationId);
  }

  @Post('me/invitations/accept')
  public accept(
    @CurrentUser() user: UserSummary,
    @Body() dto: AcceptInvitationDto,
  ): Promise<Membership> {
    return this.invitations.accept(user.id, dto);
  }
}
