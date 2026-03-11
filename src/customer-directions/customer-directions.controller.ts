import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CustomerDirectionsService } from './customer-directions.service';
import { CreateCustomerDirectionDto } from './dto/create-customer-direction.dto';
import { UpdateCustomerDirectionDto } from './dto/update-customer-direction.dto';

@Controller('customer-directions')
export class CustomerDirectionsController {
  constructor(
    private readonly customerDirectionsService: CustomerDirectionsService,
  ) {}

  @Post()
  create(@Body() createCustomerDirectionDto: CreateCustomerDirectionDto) {
    return this.customerDirectionsService.create(createCustomerDirectionDto);
  }

  @Get()
  findAll(@Query('customerId') customerId?: string) {
    return this.customerDirectionsService.findAll(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerDirectionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDirectionDto: UpdateCustomerDirectionDto,
  ) {
    return this.customerDirectionsService.update(
      id,
      updateCustomerDirectionDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerDirectionsService.remove(id);
  }
}
