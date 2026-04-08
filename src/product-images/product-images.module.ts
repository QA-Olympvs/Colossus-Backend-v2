import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { ProductImagesService } from './product-images.service';
import { ProductImagesController } from './product-images.controller';

@Module({
  imports: [ProductsModule],
  controllers: [ProductImagesController],
  providers: [ProductImagesService],
  exports: [ProductImagesService],
})
export class ProductImagesModule {}
