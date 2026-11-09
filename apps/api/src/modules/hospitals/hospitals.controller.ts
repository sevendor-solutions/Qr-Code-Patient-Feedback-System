import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active hospitals' })
  async findAll() {
    return this.hospitalsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get hospital details by ID' })
  async findById(@Param('id') id: string) {
    return this.hospitalsService.findById(id);
  }
}
