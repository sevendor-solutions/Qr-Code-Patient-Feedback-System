import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCategorySchema, UserRole } from '@esushrut/shared';

@ApiTags('Service Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all service categories for feedback & complaints' })
  async findAll(@Query('all') all?: string) {
    return this.categoriesService.findAll(all !== 'true');
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service category' })
  async create(@Body() body: any, @CurrentUser('id') userId: string) {
    const validated = CreateCategorySchema.parse(body);
    return this.categoriesService.create(validated, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing category' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.categoriesService.update(id, body);
  }
}
