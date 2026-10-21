import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTeamDto } from './dto/create-team.dto.js';

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
}
