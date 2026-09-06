import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar Sesión (Login)',
    description: 'Autentica a un usuario mediante correo y contraseña. Retorna Access Token, Refresh Token y las membresías activas por academia con sus respectivos roles.',
  })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'Autenticado con éxito' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar Tokens (Refresh Token)',
    description: 'Genera un nuevo par de Access Token y Refresh Token a partir de un refresh token válido no revocado.',
  })
  @ApiResponse({ status: 200, description: 'Tokens renovados' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar Sesión (Logout)',
    description: 'Invalida el refresh token del usuario añadiéndolo a la lista negra en Redis.',
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente' })
  async logout(@Body() body: { refreshToken?: string }) {
    return await this.authService.logout(body?.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Perfil de Usuario Autenticado',
    description: 'Retorna los datos personales del usuario y la lista de academias donde posee membresía activa con sus roles.',
  })
  @ApiResponse({ status: 200, description: 'Datos del perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return await this.authService.getProfile(user.userId);
  }
}
