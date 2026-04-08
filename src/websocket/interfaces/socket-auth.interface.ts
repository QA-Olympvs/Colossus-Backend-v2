import { JwtPayload } from '../../auth/strategies/jwt.strategy';

export interface SocketAuthPayload {
  token: string;
}

export interface AuthenticatedSocket {
  id: string;
  data: {
    user: JwtPayload;
    branchId: string;
    userId: string;
    roles: string[];
  };
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: unknown) => void;
}

export interface OrderEventPayload {
  id: string;
  order_number: string;
  branch_id: string;
  status: string;
  total: number;
  customer_id?: string;
  user_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductEventPayload {
  id: string;
  branch_id: string;
  name: string;
  price: number;
  is_active: boolean;
}

export interface PaymentEventPayload {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  status: string;
  paid_at?: Date;
}

export interface CustomerEventPayload {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}
