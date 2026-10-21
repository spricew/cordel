import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import type { UserSummary } from '@cordel/types';
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
}
