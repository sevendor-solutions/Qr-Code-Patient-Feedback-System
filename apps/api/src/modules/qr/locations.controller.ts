import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateLocationSchema, UserRole } from '@esushrut/shared';

@ApiTags('QR Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active locations (optionally filtered by department)' })
  async findAll(@Query('departmentId') departmentId?: string) {
    return this.locationsService.findAll(departmentId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new QR location / counter' })
  async create(@Body() body: any, @CurrentUser('id') userId: string) {
    const validated = CreateLocationSchema.parse(body);
    return this.locationsService.create(validated, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing location' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.locationsService.update(id, body);
  }
}
