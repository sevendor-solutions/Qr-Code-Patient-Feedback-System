import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@esushrut/shared';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_HEAD)
  @ApiOperation({ summary: 'Get all hospital staff and users' })
  async findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
