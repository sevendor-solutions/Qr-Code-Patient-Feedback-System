import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser, LoginSchema, RefreshTokenSchema } from '@esushrut/shared';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin/Staff Login' })
  @ApiResponse({ status: 200, description: 'JWT tokens and user profile' })
  async login(@Body() body: any, @Req() req: Request) {
    const validated = LoginSchema.parse(body);
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.login(validated.username, validated.password, ip, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT access token' })
  async refresh(@Body() body: any) {
    const validated = RefreshTokenSchema.parse(body);
    return this.authService.refreshTokens(validated.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  async getProfile(@CurrentUser() user: AuthUser) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token and logout' })
  async logout(@CurrentUser('id') userId: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.logout(userId, ip, userAgent);
  }
}
