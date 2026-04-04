import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryRoute } from './entities/delivery-route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { Order } from '../orders/entities/order.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(DeliveryRoute)
    private readonly routeRepository: Repository<DeliveryRoute>,
    @InjectRepository(RouteStop)
    private readonly stopRepository: Repository<RouteStop>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
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
    updateStopStatusDto: UpdateStopStatusDto,
  ): Promise<RouteStop> {
    const route = await this.findOne(routeId);

    const stop = await this.stopRepository.findOne({
      where: { id: stopId, route_id: routeId },
      relations: ['customer_direction'],
    });
    if (!stop) {
      throw new NotFoundException(
        `Stop #${stopId} not found in route #${routeId}`,
      );
    }

    if (updateStopStatusDto.status === 'completed') {
      this.validateDeliveryProximity(stop, updateStopStatusDto);
      await this.validateDeliveryPhoto(
        route.assigned_user_id,
        updateStopStatusDto,
      );
      stop.completed_at = new Date();

      // Save delivery photo to order if provided
      if (updateStopStatusDto.delivery_photo_url) {
        await this.saveDeliveryPhotoToOrder(
          stop,
          updateStopStatusDto.delivery_photo_url,
        );
      }
    }

    stop.status = updateStopStatusDto.status;
    const savedStop = await this.stopRepository.save(stop);

    await this.tryCompleteRoute(routeId);

    return savedStop;
  }

  async remove(id: string): Promise<void> {
    const route = await this.findOne(id);
    await this.routeRepository.remove(route);
  }

  private validateDeliveryProximity(
    stop: RouteStop,
    updateStopStatusDto: UpdateStopStatusDto,
  ): void {
    if (
      updateStopStatusDto.current_latitude == null ||
      updateStopStatusDto.current_longitude == null
    ) {
      throw new BadRequestException(
        'Se requiere current_latitude y current_longitude para marcar una parada como completada.',
      );
    }

    const targetLatitude = this.getTargetLatitude(stop);
    const targetLongitude = this.getTargetLongitude(stop);

    if (targetLatitude == null || targetLongitude == null) {
      throw new BadRequestException(
        'La parada no tiene coordenadas de destino para validar cercania.',
      );
    }

    const maxDistanceMeters = updateStopStatusDto.max_distance_m ?? 120;
    const distanceMeters = this.calculateDistanceMeters(
      updateStopStatusDto.current_latitude,
      updateStopStatusDto.current_longitude,
      targetLatitude,
      targetLongitude,
    );

    if (distanceMeters > maxDistanceMeters) {
      throw new BadRequestException(
        `No se puede completar la parada: distancia actual ${Math.round(distanceMeters)}m, limite ${maxDistanceMeters}m.`,
      );
    }
  }

  private async validateDeliveryPhoto(
    assignedUserId: string,
    updateStopStatusDto: UpdateStopStatusDto,
  ): Promise<void> {
    // Get the user's branch to check requires_delivery_photo
    const user = await this.orderRepository.manager.query(
      `SELECT b.requires_delivery_photo 
       FROM users u 
       JOIN branches b ON u.branch_id = b.id 
       WHERE u.id = $1`,
      [assignedUserId],
    );

    if (user.length > 0 && user[0].requires_delivery_photo === true) {
      if (!updateStopStatusDto.delivery_photo_url) {
        throw new BadRequestException(
          'Se requiere una foto de entrega para completar esta parada.',
        );
      }
    }
  }

  private async saveDeliveryPhotoToOrder(
    stop: RouteStop,
    deliveryPhotoUrl: string,
  ): Promise<void> {
    if (stop.order_id) {
      await this.orderRepository.update(stop.order_id, {
        delivery_photo_url: deliveryPhotoUrl,
      });
    }
  }

  private getTargetLatitude(stop: RouteStop): number | null {
    const fromStop = stop.latitude != null ? Number(stop.latitude) : null;
    if (fromStop != null) return fromStop;

    const fromDirection =
      stop.customer_direction?.latitude != null
        ? Number(stop.customer_direction.latitude)
        : null;
    return fromDirection;
  }

  private getTargetLongitude(stop: RouteStop): number | null {
    const fromStop = stop.longitude != null ? Number(stop.longitude) : null;
    if (fromStop != null) return fromStop;

    const fromDirection =
      stop.customer_direction?.longitude != null
        ? Number(stop.customer_direction.longitude)
        : null;
    return fromDirection;
  }

  private calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadiusMeters = 6371000;
    const toRadians = (value: number) => (value * Math.PI) / 180;

    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  private async tryCompleteRoute(routeId: string): Promise<void> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops'],
    });

    if (!route || route.stops.length === 0) return;

    const allCompleted = route.stops.every(
      (stop) => stop.status === 'completed',
    );
    if (allCompleted && route.status !== 'completed') {
      route.status = 'completed';
      route.completed_at = new Date();
      await this.routeRepository.save(route);
    }
  }
}
