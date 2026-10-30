import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import type { Team, TeamMemberWithUser, UserSummary } from '@cordel/types';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { TeamsService, type CreatedTeam } from './teams.service.js';

// POST /api/v1/organizations/:slug/teams — el equipo vive dentro de una org.
// La organización sale de la ruta, el actor sale del token, nunca del body.
@Controller('organizations')
export class TeamsController {
  public constructor(private readonly teams: TeamsService) {}

  @Post(':slug/teams')
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Param('slug') slug: string,
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: UserSummary,
  ): Promise<CreatedTeam> {
    return this.teams.create(slug, dto, user.id);
  }

  @Get(':slug/teams')
  public list(
    @Param('slug') slug: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Team[]> {
    return this.teams.list(slug, user.id);
  }

  @Get(':slug/teams/:teamSlug')
  public findBySlug(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Team> {
    return this.teams.findBySlug(slug, teamSlug, user.id);
  }

  // GET /api/v1/organizations/:slug/teams/:teamSlug/members — 4 segmentos.
  @Get(':slug/teams/:teamSlug/members')
  public findMembers(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @CurrentUser() user: UserSummary,
  ): Promise<TeamMemberWithUser[]> {
    return this.teams.findMembers(slug, teamSlug, user.id);
  }
}
