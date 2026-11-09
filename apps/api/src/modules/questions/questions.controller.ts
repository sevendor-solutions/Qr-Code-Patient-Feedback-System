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
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateQuestionSchema, UserRole } from '@esushrut/shared';

@ApiTags('Questions Master')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active feedback questions' })
  async findAll(@Query('all') all?: string) {
    return this.questionsService.findAll(all !== 'true');
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new question in the Question Master' })
  async create(@Body() body: any, @CurrentUser('id') userId: string) {
    const validated = CreateQuestionSchema.parse(body);
    return this.questionsService.create(validated, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing question' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.questionsService.update(id, body);
  }
}
