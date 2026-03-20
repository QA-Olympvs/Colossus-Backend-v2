import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryRoute } from './entities/delivery-route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(DeliveryRoute)
    private readonly routeRepository: Repository<DeliveryRoute>,
    @InjectRepository(RouteStop)
    private readonly stopRepository: Repository<RouteStop>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<DeliveryRoute> {
    const { stops, ...routeData } = createRouteDto;

    const route = this.routeRepository.create({
      ...routeData,
      stops: stops.map((stop) => this.stopRepository.create(stop)),
    });

    return this.routeRepository.save(route);
  }

  async findAll(businessId?: string): Promise<DeliveryRoute[]> {
    const where: Record<string, unknown> = {};
    if (businessId) where.business_id = businessId;

    return this.routeRepository.find({
      where,
      relations: ['assigned_user', 'stops', 'stops.customer_direction'],
      order: { created_at: 'DESC', stops: { stop_order: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<DeliveryRoute> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['assigned_user', 'stops', 'stops.customer_direction'],
      order: { stops: { stop_order: 'ASC' } },
    });
    if (!route) throw new NotFoundException(`Route #${id} not found`);
    return route;
  }

  async findByAssignedUser(userId: string): Promise<DeliveryRoute[]> {
    return this.routeRepository.find({
      where: { assigned_user_id: userId },
      relations: ['assigned_user', 'stops', 'stops.customer_direction'],
      order: { created_at: 'DESC', stops: { stop_order: 'ASC' } },
    });
  }

  async update(
    id: string,
    updateRouteDto: UpdateRouteDto,
  ): Promise<DeliveryRoute> {
    const route = await this.findOne(id);
    const { stops, ...routeData } = updateRouteDto;

    Object.assign(route, routeData);

    if (stops) {
      await this.stopRepository.delete({ route_id: id });
      route.stops = stops.map((stop) =>
        this.stopRepository.create({ ...stop, route_id: id }),
      );
    }

    return this.routeRepository.save(route);
  }

  async updateStatus(id: string, status: string): Promise<DeliveryRoute> {
    const route = await this.findOne(id);
    route.status = status;

    if (status === 'in_progress' && !route.started_at) {
      route.started_at = new Date();
    }
    if (status === 'completed') {
      route.completed_at = new Date();
    }

    return this.routeRepository.save(route);
  }

  async updateStopStatus(
    routeId: string,
    stopId: string,
    status: string,
  ): Promise<RouteStop> {
    await this.findOne(routeId);

    const stop = await this.stopRepository.findOne({
      where: { id: stopId, route_id: routeId },
    });
    if (!stop)
      throw new NotFoundException(
        `Stop #${stopId} not found in route #${routeId}`,
      );

    stop.status = status;
    if (status === 'completed') {
      stop.completed_at = new Date();
    }

    return this.stopRepository.save(stop);
  }

  async remove(id: string): Promise<void> {
    const route = await this.findOne(id);
    await this.routeRepository.remove(route);
  }
}
