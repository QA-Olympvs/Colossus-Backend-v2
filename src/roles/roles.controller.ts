import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create a new role',
    description: 'Creates a new role with specified permissions. Requires authentication and appropriate permissions.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Role created successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "MANAGER",
        description: "Store manager with full access to branch operations",
        is_active: true,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request - Role already exists or invalid data' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get all roles',
    description: 'Retrieves a list of all available roles in the system. Requires authentication.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Roles retrieved successfully',
    schema: {
      example: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "ADMIN",
          description: "System administrator with full access",
          is_active: true,
          user_count: 2,
          permissions_count: 15,
          created_at: "2024-01-15T10:30:00Z"
        },
        {
          id: "456e7890-e89b-12d3-a456-426614174001",
          name: "MANAGER",
          description: "Store manager with branch-level access",
          is_active: true,
          user_count: 5,
          permissions_count: 10,
          created_at: "2024-01-15T11:00:00Z"
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get role by ID',
    description: 'Retrieves a specific role by its unique identifier including associated permissions and users.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role retrieved successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "ADMIN",
        description: "System administrator with full access",
        is_active: true,
        permissions: [
          {
            id: "789e0123-e89b-12d3-a456-426614174000",
            name: "users:manage",
            description: "Manage user accounts"
          },
          {
            id: "890e1234-e89b-12d3-a456-426614174001",
            name: "products:manage",
            description: "Manage products and inventory"
          }
        ],
        users: [
          {
            id: "345e6789-e89b-12d3-a456-426614174000",
            email: "admin@mitienda.com",
            first_name: "Admin",
            last_name: "User"
          }
        ],
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'Role UUID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update role',
    description: 'Updates role information. Only provided fields will be updated. Requires authentication and appropriate permissions.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role updated successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "ADMIN",
        description: "System administrator with full access - updated description",
        is_active: true,
        updated_at: "2024-01-20T16:00:00Z"
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'Role UUID to update',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Delete role',
    description: 'Permanently deletes a role from the system. Cannot delete if role has assigned users.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role deleted successfully',
    schema: {
      example: {
        message: "Role deleted successfully",
        deletedRole: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "TEMP_ROLE",
          description: "Temporary role that was deleted"
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete role with assigned users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'Role UUID to delete',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
