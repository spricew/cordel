import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { UserSummary } from '@cordel/types';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import {
  OrganizationsService,
  type CreatedOrganization,
} from './organizations.service.js';

@Controller('organizations')
export class OrganizationsController {
  public constructor(private readonly org: OrganizationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: UserSummary,
  ): Promise<CreatedOrganization> {
    return this.org.create(dto, user.id);
  }
}
