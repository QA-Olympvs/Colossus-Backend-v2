import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    const existing = await this.businessRepository.findOne({
      where: [{ slug: createBusinessDto.slug }, { email: createBusinessDto.email }],
    });
    if (existing) throw new ConflictException('Business with this slug or email already exists');
    const business = this.businessRepository.create(createBusinessDto);
    return this.businessRepository.save(business);
  }

  async findAll(): Promise<Business[]> {
    return this.businessRepository.find({ where: { is_active: true } });
  }

  async findOne(id: string): Promise<Business> {
    const business = await this.businessRepository.findOne({ where: { id }, relations: ['branches'] });
    if (!business) throw new NotFoundException(`Business #${id} not found`);
    return business;
  }

  async update(id: string, updateBusinessDto: UpdateBusinessDto): Promise<Business> {
    const business = await this.findOne(id);
    Object.assign(business, updateBusinessDto);
    return this.businessRepository.save(business);
  }

  async remove(id: string): Promise<void> {
    const business = await this.findOne(id);
    business.is_active = false;
    await this.businessRepository.save(business);
  }
}
