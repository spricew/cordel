import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTeamDto } from './dto/create-team.dto.js';
import type { Team } from '@cordel/types';

export interface CreatedTeam {
  id: string;
  name: string;
  slug: string;
}

@Injectable()
export class TeamsService {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(
    orgSlug: string,
    dto: CreateTeamDto,
    userId: string,
  ): Promise<CreatedTeam> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, organization: { slug: orgSlug } },
      include: { organization: true },
    });
    if (membership === null) {
      throw new NotFoundException('Organización no encontrada');
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Solo OWNER o ADMIN pueden crear equipos en esta organización',
      );
    }

    const slugTaken = await this.prisma.team.findFirst({
      where: { organizationId: membership.organizationId, slug: dto.slug },
    });
    if (slugTaken !== null) {
      throw new ConflictException('Slug ya registrado');
    }

    // el organizationId viene de la membership, no del body ni cliente.
    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        organizationId: membership.organizationId,
        members: { create: { userId, role: 'OWNER' } },
      },
    });
    return {
      id: team.id,
      name: team.name,
      slug: team.slug,
    };
  }

  private toTeam(team: {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Team {
    return {
      id: team.id,
      organizationId: team.organizationId,
      name: team.name,
      slug: team.slug,
      description: team.description,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
  }

  public async list(orgSlug: string, userId: string): Promise<Team[]> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, organization: { slug: orgSlug } },
    });
    if (membership === null) {
      throw new NotFoundException('Organización no encontrada');
    }

    const teams = await this.prisma.team.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { slug: 'asc' },
    });

    return teams.map((t) => this.toTeam(t));
  }

  public async findBySlug(
    orgSlug: string,
    teamSlug: string,
    userId: string,
  ): Promise<Team> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, organization: { slug: orgSlug } },
    });
    if (membership === null) {
      throw new NotFoundException('Organización no encontrada');
    }

    const team = await this.prisma.team.findFirst({
      where: { organizationId: membership.organizationId, slug: teamSlug },
    });
    if (team === null) {
      throw new NotFoundException('Equipo no encontrado');
    }

    return this.toTeam(team);
  }
}
