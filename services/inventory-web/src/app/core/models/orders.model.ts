export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
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
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  delivery_instruction: string | null;
  discount_amount: number;
  subtotal_amount: number;
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
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  delivery_instruction?: string | null;
  discount_amount?: number;
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

export interface RestockProductPayload {
  quantity_added: number;
}

export interface RestockListParams {
  page?: number;
  pageSize?: number;
  status?: RestockStatus;
  priority?: RestockPriority;
}

export interface LowStockProduct {
  id: string;
  name: string;
  current_stock: number;
  min_stock_threshold: number;
  status: 'out_of_stock' | 'low_stock';
}

export interface DashboardMetrics {
  orders_today: number;
  pending_orders: number;
  completed_orders: number;
  low_stock_count: number;
  revenue_today: number;
  low_stock_products: LowStockProduct[];
}

export interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityLogListParams {
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
}
