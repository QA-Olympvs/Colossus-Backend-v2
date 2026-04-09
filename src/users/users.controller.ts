import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Creates a new user account with roles and permissions. Requires authentication and appropriate permissions.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "newuser@mitienda.com",
        first_name: "John",
        last_name: "Doe",
        phone: "+1234567890",
        is_active: true,
        roles: ["USER"],
        branch_id: "a5664473-a72c-426b-8162-72de03b573a5",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request - User already exists or invalid data' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieves a list of users. Can filter by branch ID. Requires authentication and appropriate permissions.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    schema: {
      example: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          email: "admin@mitienda.com",
          first_name: "Admin",
          last_name: "User",
          phone: "+1234567890",
          is_active: true,
          roles: ["ADMIN"],
          branch: {
            id: "a5664473-a72c-426b-8162-72de03b573a5",
            name: "Sucursal Principal"
          },
          created_at: "2024-01-15T10:30:00Z",
          last_login: "2024-01-20T15:45:00Z"
        }
      ]
    }
  })
  @ApiQuery({ 
    name: 'branchId', 
    required: false, 
    description: 'Filter by branch ID',
    example: 'a5664473-a72c-426b-8162-72de03b573a5'
  })
  @ApiQuery({ 
    name: 'role', 
    required: false, 
    description: 'Filter by role name',
    example: 'ADMIN'
  })
  findAll(@Query('branchId') branchId?: string, @Query('role') role?: string) {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by their unique identifier including roles, permissions, and branch information.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "admin@mitienda.com",
        first_name: "Admin",
        last_name: "User",
        phone: "+1234567890",
        is_active: true,
        roles: ["ADMIN"],
        permissions: ["users:manage", "products:manage", "orders:manage"],
        branch: {
          id: "a5664473-a72c-426b-8162-72de03b573a5",
          name: "Sucursal Principal",
          address: "Calle Principal #123"
        },
        created_at: "2024-01-15T10:30:00Z",
        last_login: "2024-01-20T15:45:00Z",
        login_count: 45
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update user',
    description: 'Updates user information. Only provided fields will be updated. Requires authentication and appropriate permissions.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "admin@mitienda.com",
        first_name: "Admin",
        last_name: "User (Updated)",
        phone: "+1234567890",
        is_active: true,
        roles: ["ADMIN"],
        updated_at: "2024-01-20T16:00:00Z"
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID to update',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Delete user',
    description: 'Permanently deletes a user from the system. Cannot delete if user has associated orders or critical data.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully',
    schema: {
      example: {
        message: "User deleted successfully",
        deletedUser: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          email: "user@mitienda.com",
          first_name: "John",
          last_name: "Doe"
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete user with associated orders' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID to delete',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/assign-role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Assign role to user',
    description: 'Assigns a specific role to a user. Requires authentication and appropriate permissions.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role assigned successfully',
    schema: {
      example: {
        message: "Role assigned successfully",
        user: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          email: "user@mitienda.com",
          roles: ["USER", "MANAGER"]
        },
        assignedRole: {
          id: "456e7890-e89b-12d3-a456-426614174000",
          name: "MANAGER"
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  assignRole(@Param('id') id: string, @Body() assignRoleDto: AssignRoleDto) {
    return this.usersService.assignRole(id, assignRoleDto);
  }

  @Post(':id/remove-role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Remove role from user',
    description: 'Removes a specific role from a user. Requires authentication and appropriate permissions.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role removed successfully',
    schema: {
      example: {
        message: "Role removed successfully",
        user: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          email: "user@mitienda.com",
          roles: ["USER"]
        },
        removedRole: {
          id: "456e7890-e89b-12d3-a456-426614174000",
          name: "MANAGER"
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  removeRole(@Param('id') userId: string, @Body() assignRoleDto: AssignRoleDto) {
    return this.usersService.removeRole(userId, assignRoleDto.role_id);
  }
}
