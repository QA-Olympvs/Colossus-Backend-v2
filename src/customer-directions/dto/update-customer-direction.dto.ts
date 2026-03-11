import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDirectionDto } from './create-customer-direction.dto';

export class UpdateCustomerDirectionDto extends PartialType(
  CreateCustomerDirectionDto,
) {}
