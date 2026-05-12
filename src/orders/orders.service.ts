import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
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
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private calculateTotals(
    items: { unit_price: number; quantity: number; discount_amount?: number }[],
  ) {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal =
        item.unit_price * item.quantity - (item.discount_amount ?? 0);
      return sum + itemSubtotal;
    }, 0);
    return parseFloat(subtotal.toFixed(2));
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    const branch = await this.branchRepository.findOne({
      where: { id: dto.branch_id },
    });
    if (!branch) {
      throw new BadRequestException(
        `Referenced branch not found: ${dto.branch_id}`,
      );
    }

    if (dto.customer_id) {
      const customer = await this.customerRepository.findOne({
        where: { id: dto.customer_id },
      });
      if (!customer) {
        throw new BadRequestException(
          `Referenced customer not found: ${dto.customer_id}`,
        );
      }
    }

    const productIds = [...new Set(dto.items.map((item) => item.product_id))];
    const products = await this.productRepository.findByIds(productIds);
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.find((id) => !foundIds.has(id));
      throw new BadRequestException(`Referenced product not found: ${missing}`);
    }

    const subtotal = this.calculateTotals(dto.items);
    const discountAmount = dto.discount_amount ?? 0;
    const taxAmount = dto.tax_amount ?? 0;
    const deliveryFee = dto.delivery_fee ?? 0;
    const total = parseFloat(
      (subtotal - discountAmount + taxAmount + deliveryFee).toFixed(2),
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = this.orderRepository.create({
        ...dto,
        order_number: this.generateOrderNumber(),
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        delivery_fee: deliveryFee,
        total,
      });

      const savedOrder = await queryRunner.manager.save(order);

      const orderItems = dto.items.map((item) =>
        this.orderItemRepository.create({
          order_id: savedOrder.id,
          product_id: item.product_id,
          unit_price: item.unit_price,
          quantity: item.quantity,
          discount_amount: item.discount_amount ?? 0,
          subtotal: parseFloat(
            (
              item.unit_price * item.quantity -
              (item.discount_amount ?? 0)
            ).toFixed(2),
          ),
          notes: item.notes,
        }),
      );

      await queryRunner.manager.save(orderItems);

      await queryRunner.commitTransaction();

      const fullOrder = await this.findOne(savedOrder.id);

      this.eventEmitter.emit('order.created', {
        branchId: fullOrder.branch_id,
        order: {
          id: fullOrder.id,
          order_number: fullOrder.order_number,
          branch_id: fullOrder.branch_id,
          status: fullOrder.status,
          total: fullOrder.total,
          customer_id: fullOrder.customer_id,
          user_id: fullOrder.user_id,
          type: fullOrder.type,
          created_at: fullOrder.created_at,
        },
      });

      return fullOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof QueryFailedError) {
        const pgError = error.driverError as {
          code?: string;
          message?: string;
        };
        throw new BadRequestException(pgError.message || error.message);
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    user: any,
    branchId?: string,
    status?: OrderStatus,
  ): Promise<Order[]> {
    const where: Record<string, unknown> = { is_archived: false };

    const isAdmin = user?.roles?.some(
      (role: string) => role === 'super_admin' || role === 'admin',
    );

    if (isAdmin) {
      if (branchId) {
        where.branch_id = branchId;
      }
      // No branch filter if admin and no branchId param
    } else {
      where.branch_id = branchId ?? user?.branch_id;
    }

    if (status) where.status = status;
    return this.orderRepository.find({
      where,
      relations: ['items', 'items.product', 'payments', 'customer', 'branch'],
      order: { created_at: 'DESC' },
    });
  }

  async findMyOrders(customerId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customer_id: customerId, is_archived: false },
      relations: ['items', 'items.product', 'payments', 'branch'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.product',
        'payments',
        'customer',
        'branch',
        'user',
        'delivery_address',
      ],
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

    const previousStatus = order.status;

    order.status = dto.status;

    if (dto.status === OrderStatus.CANCELLED) {
      if (dto.cancelled_reason) order.cancelled_reason = dto.cancelled_reason;
      order.cancelled_at = new Date();
    }

    if (dto.status === OrderStatus.DELIVERED) {
      order.delivered_at = new Date();
    }

    const savedOrder = await this.orderRepository.save(order);

    this.eventEmitter.emit('order.status_changed', {
      branchId: savedOrder.branch_id,
      orderId: savedOrder.id,
      previousStatus,
      newStatus: savedOrder.status,
      assignedUserId: savedOrder.user_id,
    });

    return savedOrder;
  }

  async archive(id: string): Promise<Order> {
    const order = await this.findOne(id);
    const closedStatuses = [
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ];
    if (!closedStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Only delivered, cancelled or refunded orders can be archived',
      );
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

    const savedPayment = await this.paymentRepository.save(payment);

    this.eventEmitter.emit('order.payment_received', {
      branchId: order.branch_id,
      payment: {
        id: savedPayment.id,
        order_id: orderId,
        amount: savedPayment.amount,
        method: savedPayment.method,
        status: savedPayment.status,
        paid_at: savedPayment.paid_at,
      },
    });

    return savedPayment;
  }

  async findPayments(orderId: string): Promise<Payment[]> {
    await this.findOne(orderId);
    return this.paymentRepository.find({ where: { order_id: orderId } });
  }
}
