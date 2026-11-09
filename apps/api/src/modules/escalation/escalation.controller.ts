import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EscalationService } from './escalation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateEscalationMatrixSchema, UserRole } from '@esushrut/shared';

@ApiTags('Escalation Matrix')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('escalation')
export class EscalationController {
  constructor(private readonly escalationService: EscalationService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_HEAD, UserRole.FEEDBACK_OFFICER)
  @ApiOperation({ summary: 'Get escalation matrix rules' })
  async findAll(@Query('departmentId') departmentId?: string) {
    return this.escalationService.findAll(departmentId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new SLA escalation level rule' })
  async create(@Body() body: any, @CurrentUser('id') userId: string) {
    const validated = CreateEscalationMatrixSchema.parse(body);
    return this.escalationService.create(validated, userId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an existing escalation rule' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.escalationService.update(id, body);
  }

  @Post('run-cron')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger SLA auto-escalation evaluation' })
  async runCron() {
    return this.escalationService.processSlaEscalations();
  }
}
