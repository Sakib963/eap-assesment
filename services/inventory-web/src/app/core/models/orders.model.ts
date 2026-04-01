export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type RestockPriority = 'low' | 'medium' | 'high';
export type RestockStatus = 'pending' | 'completed';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  items_count: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  fromDate?: string;
  toDate?: string;
}

export interface CreateOrderPayload {
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

export interface RestockQueueItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity_needed: number;
  priority: RestockPriority;
  status: RestockStatus;
  current_stock: number;
  min_stock_threshold: number;
  created_at: string;
  completed_at: string | null;
}

export interface RestockListParams {
  page?: number;
  pageSize?: number;
  status?: RestockStatus;
  priority?: RestockPriority;
}
