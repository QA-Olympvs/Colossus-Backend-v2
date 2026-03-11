import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerDirection } from './entities/customer-direction.entity';
import { CustomerDirectionsService } from './customer-directions.service';
import { CustomerDirectionsController } from './customer-directions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerDirection])],
  controllers: [CustomerDirectionsController],
  providers: [CustomerDirectionsService],
  exports: [CustomerDirectionsService],
})
export class CustomerDirectionsModule {}
