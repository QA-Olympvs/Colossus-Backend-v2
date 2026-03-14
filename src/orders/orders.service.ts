import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private calculateTotals(items: { unit_price: number; quantity: number; discount_amount?: number }[]) {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.unit_price * item.quantity - (item.discount_amount ?? 0);
      return sum + itemSubtotal;
    }, 0);
    return parseFloat(subtotal.toFixed(2));
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    const subtotal = this.calculateTotals(dto.items);
    const discountAmount = dto.discount_amount ?? 0;
    const taxAmount = dto.tax_amount ?? 0;
    const deliveryFee = dto.delivery_fee ?? 0;
    const total = parseFloat((subtotal - discountAmount + taxAmount + deliveryFee).toFixed(2));

    const order = this.orderRepository.create({
      ...dto,
      order_number: this.generateOrderNumber(),
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      delivery_fee: deliveryFee,
      total,
    });

    const savedOrder = await this.orderRepository.save(order);

    const orderItems = dto.items.map((item) =>
      this.orderItemRepository.create({
        order_id: savedOrder.id,
        product_id: item.product_id,
        unit_price: item.unit_price,
        quantity: item.quantity,
        discount_amount: item.discount_amount ?? 0,
        subtotal: parseFloat((item.unit_price * item.quantity - (item.discount_amount ?? 0)).toFixed(2)),
        notes: item.notes,
      }),
    );

    await this.orderItemRepository.save(orderItems);

    return this.findOne(savedOrder.id);
  }

  async findAll(userBranchId?: string, branchId?: string, status?: OrderStatus): Promise<Order[]> {
    const where: Record<string, unknown> = { is_archived: false };
    
    // Si el usuario tiene branch_id, solo puede ver órdenes de su sucursal
    if (userBranchId) {
      where.branch_id = userBranchId;
    } else if (branchId) {
      // Usuario global puede filtrar por branch_id específico
      where.branch_id = branchId;
    }
    
    if (status) where.status = status;
    return this.orderRepository.find({
      where,
      relations: ['items', 'items.product', 'payments', 'customer'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'payments', 'customer', 'branch', 'user', 'delivery_address'],
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_number: orderNumber },
      relations: ['items', 'items.product', 'payments', 'customer'],
    });
    if (!order) throw new NotFoundException(`Order ${orderNumber} not found`);
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);

    const cancelStatuses = [OrderStatus.CANCELLED, OrderStatus.REFUNDED];
    if (cancelStatuses.includes(order.status)) {
      throw new BadRequestException(`Cannot update a ${order.status} order`);
    }

    order.status = dto.status;

    if (dto.status === OrderStatus.CANCELLED) {
      if (dto.cancelled_reason) order.cancelled_reason = dto.cancelled_reason;
      order.cancelled_at = new Date();
    }

    return this.orderRepository.save(order);
  }

  async archive(id: string): Promise<Order> {
    const order = await this.findOne(id);
    const closedStatuses = [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED];
    if (!closedStatuses.includes(order.status)) {
      throw new BadRequestException('Only delivered, cancelled or refunded orders can be archived');
    }
    order.is_archived = true;
    return this.orderRepository.save(order);
  }

  async addPayment(orderId: string, dto: CreatePaymentDto): Promise<Payment> {
    const order = await this.findOne(orderId);

    const totalPaid = order.payments
      .filter((p) => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    if (totalPaid >= Number(order.total)) {
      throw new BadRequestException('Order is already fully paid');
    }

    const payment = this.paymentRepository.create({
      order_id: orderId,
      method: dto.method,
      amount: dto.amount,
      reference: dto.reference,
      status: PaymentStatus.COMPLETED,
      paid_at: new Date(),
    });

    return this.paymentRepository.save(payment);
  }

  async findPayments(orderId: string): Promise<Payment[]> {
    await this.findOne(orderId);
    return this.paymentRepository.find({ where: { order_id: orderId } });
  }
}
