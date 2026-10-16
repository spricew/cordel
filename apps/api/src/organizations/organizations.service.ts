import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { Organization } from '@cordel/types';
import type { CreateOrganizationDto } from './dto/create-organization.dto.js';

export interface CreatedOrganization {
  id: string;
  name: string;
  slug: string;
}

// Crea la organización y deja al creador como OWNER en la misma
// operación (escritura anidada: o salen ambas filas o no sale ninguna).
// El dueño sale del token, nunca del body. Respeta el límite free.
@Injectable()
export class OrganizationsService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  public async create(
    dto: CreateOrganizationDto,
    ownerId: string,
  ): Promise<CreatedOrganization> {
    const slugTaken = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });
    if (slugTaken !== null) {
      throw new ConflictException('Slug ya registrado');
    }

    const limit = this.config.getOrThrow<number>(
      'FREE_MAX_ORGANIZATIONS_PER_USER',
    );
    const mine = await this.prisma.membership.count({
      where: { userId: ownerId },
    });
    if (mine >= limit) {
      throw new ForbiddenException('Límite de organizaciones alcanzado');
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        ownerId,
        members: { create: { userId: ownerId, role: 'OWNER' } },
      },
    });
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    };
  }

  public async listMine(ownerId: string): Promise<Organization[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId: ownerId },
      include: { organization: true },
      orderBy: { organization: { name: 'asc' } },
    });

    return memberships.map(({ organization }) => ({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      ownerId: organization.ownerId,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    }));
  }
}
