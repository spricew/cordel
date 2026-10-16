import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import type { UserSummary, MembershipWithUser, Organization } from '@cordel/types';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import {
  OrganizationsService,
  type CreatedOrganization,
} from './organizations.service.js';

@Controller('organizations')
export class OrganizationsController {
  public constructor(private readonly org: OrganizationsService) {}

  @Get()
  public listMine(@CurrentUser() user: UserSummary): Promise<Organization[]> {
    return this.org.listMine(user.id);
  }

  @Get(':slug')
  public findBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Organization> {
    return this.org.findBySlug(slug, user.id);
  }
  
  @Get(':slug/members')
  public findMembersBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user: UserSummary,
  ): Promise<MembershipWithUser[]> {
    return this.org.findMembersBySlug(slug, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: UserSummary,
  ): Promise<CreatedOrganization> {
    return this.org.create(dto, user.id);
  }
}
