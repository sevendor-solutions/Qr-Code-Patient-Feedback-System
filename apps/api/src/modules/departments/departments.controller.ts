import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all departments (optionally filtered by hospital)' })
  async findAll(@Query('hospitalId') hospitalId?: string) {
    return this.departmentsService.findAll(hospitalId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get department details by ID' })
  async findById(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }
}
