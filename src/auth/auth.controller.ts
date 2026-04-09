import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticates a user with email and password. Returns JWT token for authenticated sessions.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      example: {
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        token_type: "Bearer",
        expires_in: "7d",
        user: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          email: "admin@mitienda.com",
          roles: ["ADMIN"],
          branch_id: "a5664473-a72c-426b-8162-72de03b573a5"
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ 
    summary: 'User registration',
    description: 'Creates a new user account. Requires email, password, and user details.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "newuser@mitienda.com",
        first_name: "John",
        last_name: "Doe",
        roles: ["USER"],
        branch_id: "a5664473-a72c-426b-8162-72de03b573a5",
        created_at: "2024-01-15T10:30:00Z"
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - User already exists or invalid data' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get user profile',
    description: 'Retrieves the current authenticated user\'s profile information.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "admin@mitienda.com",
        first_name: "Admin",
        last_name: "User",
        roles: ["ADMIN"],
        permissions: ["users:manage", "products:manage", "orders:manage"],
        branch_id: "a5664473-a72c-426b-8162-72de03b573a5"
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  profile(@CurrentUser() user: unknown) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get current user details',
    description: 'Retrieves detailed information about the current authenticated user including roles and permissions.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User details retrieved successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "admin@mitienda.com",
        first_name: "Admin",
        last_name: "User",
        phone: "+1234567890",
        is_active: true,
        roles: ["ADMIN"],
        permissions: ["users:manage", "products:manage", "orders:manage", "categories:manage"],
        branch: {
          id: "a5664473-a72c-426b-8162-72de03b573a5",
          name: "Sucursal Principal",
          address: "Calle Principal #123"
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }
}
