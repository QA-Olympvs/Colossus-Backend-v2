import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BranchesModule } from './branches/branches.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { CustomersModule } from './customers/customers.module';
import { CustomerDirectionsModule } from './customer-directions/customer-directions.module';
import { OrdersModule } from './orders/orders.module';
import { RoutesModule } from './routes/routes.module';
import { StorageModule } from './storage/storage.module';
import { ProductImagesModule } from './product-images/product-images.module';
import { ModulesModule } from './modules/modules.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000,
      max: 1000,
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DB_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
        timezone: 'UTC',
        dateStrings: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    BranchesModule,
    RolesModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    PermissionsModule,
    CustomersModule,
    CustomerDirectionsModule,
    OrdersModule,
    RoutesModule,
    StorageModule,
    ProductImagesModule,
    ModulesModule,
    WebsocketModule,
  ],
})
export class AppModule {}
