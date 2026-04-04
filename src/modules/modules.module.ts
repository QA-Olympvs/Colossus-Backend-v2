import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { Module as ModuleEntity } from './entities/module.entity';
import { RoleModule } from './entities/role-module.entity';
import { Role } from '../roles/entities/role.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuleEntity, RoleModule, Role]),
    RolesModule,
  ],
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
