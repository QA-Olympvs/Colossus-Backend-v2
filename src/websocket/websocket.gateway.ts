import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: ['http://localhost:4200', 'https://api.example.com'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private readonly jwtService: JwtService) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket): Promise<boolean> {
    this.logger.log(`Client attempting to connect: ${client.id}`);

    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect(true);
        return false;
      }

      this.logger.debug(`Token received, verifying...`);

      const payload = await this.jwtService.verifyAsync(token);

      client.data.user = payload;
      client.data.branchId = payload.branch_id;
      client.data.userId = payload.sub;
      client.data.roles = payload.roles || [];

      this.joinRooms(client);

      this.logger.log(
        `Client connected: ${client.id} | User: ${payload.sub} | Branch: ${payload.branch_id}`,
      );

      client.emit('connection_established', {
        userId: payload.sub,
        branchId: payload.branch_id,
        roles: payload.roles,
      });

      return true;
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect(true);
      return false;
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: string };
    if (auth?.token) {
      this.logger.debug(`Token found in auth`);
      return auth.token;
    }

    const query = client.handshake.query as { token?: string };
    if (query?.token) {
      this.logger.debug(`Token found in query`);
      return query.token;
    }

    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      this.logger.debug(`Token found in authorization header`);
      return authHeader.substring(7);
    }

    return null;
  }

  private joinRooms(client: Socket): void {
    const { branchId, userId, roles } = client.data;

    if (branchId) {
      client.join(`branch:${branchId}`);
      this.logger.debug(`Client ${client.id} joined room: branch:${branchId}`);
    }

    if (userId) {
      client.join(`user:${userId}`);
      this.logger.debug(`Client ${client.id} joined room: user:${userId}`);
    }

    if (roles?.includes('admin') || roles?.includes('superadmin')) {
      client.join('admins');
      this.logger.debug(`Client ${client.id} joined room: admins`);
    }
  }

  @SubscribeMessage('join_branch')
  handleJoinBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() branchId: string,
  ): void {
    if (client.data.branchId === branchId) {
      client.join(`branch:${branchId}`);
      this.logger.debug(
        `Client ${client.id} explicitly joined branch:${branchId}`,
      );
    }
  }

  @SubscribeMessage('leave_branch')
  handleLeaveBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() branchId: string,
  ): void {
    client.leave(`branch:${branchId}`);
    this.logger.debug(`Client ${client.id} left branch:${branchId}`);
  }

  // ==================== ORDER EVENTS ====================

  emitOrderCreated(branchId: string, order: Record<string, unknown>): void {
    this.server.to(`branch:${branchId}`).emit('order_created', order);
    this.logger.debug(`Emitted order_created to branch:${branchId}`);
  }

  emitOrderUpdated(branchId: string, order: Record<string, unknown>): void {
    this.server.to(`branch:${branchId}`).emit('order_updated', order);
    this.logger.debug(`Emitted order_updated to branch:${branchId}`);
  }

  emitOrderStatusChanged(
    branchId: string,
    orderId: string,
    previousStatus: string,
    newStatus: string,
    assignedUserId?: string,
  ): void {
    const payload = {
      id: orderId,
      branch_id: branchId,
      previous_status: previousStatus,
      new_status: newStatus,
      timestamp: new Date(),
    };

    this.server.to(`branch:${branchId}`).emit('order_status_changed', payload);

    if (assignedUserId) {
      this.server
        .to(`user:${assignedUserId}`)
        .emit('order_status_changed', payload);
      this.logger.debug(
        `Emitted order_status_changed to user:${assignedUserId}`,
      );
    }

    this.logger.debug(`Emitted order_status_changed to branch:${branchId}`);
  }

  // ==================== PRODUCT EVENTS ====================

  emitProductCreated(branchId: string, product: Record<string, unknown>): void {
    this.server.to(`branch:${branchId}`).emit('product_created', product);
    this.logger.debug(`Emitted product_created to branch:${branchId}`);
  }

  emitProductUpdated(branchId: string, product: Record<string, unknown>): void {
    this.server.to(`branch:${branchId}`).emit('product_updated', product);
    this.logger.debug(`Emitted product_updated to branch:${branchId}`);
  }

  emitProductDeleted(branchId: string, productId: string): void {
    this.server
      .to(`branch:${branchId}`)
      .emit('product_deleted', { id: productId });
    this.logger.debug(`Emitted product_deleted to branch:${branchId}`);
  }

  // ==================== PAYMENT EVENTS ====================

  emitPaymentReceived(
    branchId: string,
    payment: Record<string, unknown>,
  ): void {
    this.server.to(`branch:${branchId}`).emit('payment_received', payment);
    this.logger.debug(`Emitted payment_received to branch:${branchId}`);
  }

  emitPaymentStatusChanged(
    branchId: string,
    paymentId: string,
    orderId: string,
    previousStatus: string,
    newStatus: string,
  ): void {
    const payload = {
      id: paymentId,
      order_id: orderId,
      previous_status: previousStatus,
      new_status: newStatus,
      timestamp: new Date(),
    };

    this.server
      .to(`branch:${branchId}`)
      .emit('payment_status_changed', payload);
    this.logger.debug(`Emitted payment_status_changed to branch:${branchId}`);
  }

  // ==================== CUSTOMER EVENTS ====================

  emitCustomerCreated(
    branchId: string,
    customer: Record<string, unknown>,
  ): void {
    this.server.to(`branch:${branchId}`).emit('customer_created', customer);
    this.logger.debug(`Emitted customer_created to branch:${branchId}`);
  }

  emitCustomerUpdated(
    branchId: string,
    customer: Record<string, unknown>,
  ): void {
    this.server.to(`branch:${branchId}`).emit('customer_updated', customer);
    this.logger.debug(`Emitted customer_updated to branch:${branchId}`);
  }

  // ==================== EVENT LISTENERS ====================

  @OnEvent('order.created')
  handleOrderCreated(payload: {
    branchId: string;
    order: Record<string, unknown>;
  }): void {
    this.server
      .to(`branch:${payload.branchId}`)
      .emit('order_created', payload.order);
    this.logger.debug(
      `Event order.created -> emitted to branch:${payload.branchId}`,
    );
  }

  @OnEvent('order.status_changed')
  handleOrderStatusChanged(payload: {
    branchId: string;
    orderId: string;
    previousStatus: string;
    newStatus: string;
    assignedUserId?: string;
  }): void {
    const wsPayload = {
      id: payload.orderId,
      branch_id: payload.branchId,
      previous_status: payload.previousStatus,
      new_status: payload.newStatus,
      timestamp: new Date(),
    };

    this.server
      .to(`branch:${payload.branchId}`)
      .emit('order_status_changed', wsPayload);

    if (payload.assignedUserId) {
      this.server
        .to(`user:${payload.assignedUserId}`)
        .emit('order_status_changed', wsPayload);
      this.logger.debug(
        `Event order.status_changed -> emitted to user:${payload.assignedUserId}`,
      );
    }

    this.logger.debug(
      `Event order.status_changed -> emitted to branch:${payload.branchId}`,
    );
  }

  @OnEvent('order.payment_received')
  handlePaymentReceived(payload: {
    branchId: string;
    payment: Record<string, unknown>;
  }): void {
    this.server
      .to(`branch:${payload.branchId}`)
      .emit('payment_received', payload.payment);
    this.logger.debug(
      `Event order.payment_received -> emitted to branch:${payload.branchId}`,
    );
  }

  @OnEvent('product.created')
  handleProductCreated(payload: {
    branchId: string;
    product: Record<string, unknown>;
  }): void {
    this.server
      .to(`branch:${payload.branchId}`)
      .emit('product_created', payload.product);
    this.logger.debug(
      `Event product.created -> emitted to branch:${payload.branchId}`,
    );
  }

  @OnEvent('product.updated')
  handleProductUpdated(payload: {
    branchId: string;
    product: Record<string, unknown>;
  }): void {
    this.server
      .to(`branch:${payload.branchId}`)
      .emit('product_updated', payload.product);
    this.logger.debug(
      `Event product.updated -> emitted to branch:${payload.branchId}`,
    );
  }

  @OnEvent('product.deleted')
  handleProductDeleted(payload: { branchId: string; productId: string }): void {
    this.server
      .to(`branch:${payload.branchId}`)
      .emit('product_deleted', { id: payload.productId });
    this.logger.debug(
      `Event product.deleted -> emitted to branch:${payload.branchId}`,
    );
  }

  @OnEvent('customer.created')
  handleCustomerCreated(payload: { customer: Record<string, unknown> }): void {
    this.server.to('admins').emit('customer_created', payload.customer);
    this.logger.debug(`Event customer.created -> emitted to admins`);
  }

  @OnEvent('customer.updated')
  handleCustomerUpdated(payload: { customer: Record<string, unknown> }): void {
    this.server.to('admins').emit('customer_updated', payload.customer);
    this.logger.debug(`Event customer.updated -> emitted to admins`);
  }
}
