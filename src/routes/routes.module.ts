import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryRoute } from './entities/delivery-route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { Order } from '../orders/entities/order.entity';
import { Branch } from '../branches/entities/branch.entity';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { StorageModule } from '../storage/storage.module';
import { ModulesModule } from '../modules/modules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryRoute, RouteStop, Order, Branch]),
    StorageModule,
    ModulesModule,
  ],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}
