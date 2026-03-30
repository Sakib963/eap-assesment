/**
 * Shared TypeScript interfaces for Smart Inventory & Order Management System
 * Used by both frontend (web) and backend (api) services
 */

// ============== AUTH ==============
export interface User {
  id: string;
  email: string;
  password_hash?: string; // Only backend
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

// ============== PRODUCTS & CATEGORIES ==============
export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  current_stock: number;
  min_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============== ORDERS ==============
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  items: { product_id: string; quantity: number }[];
}

// ============== STOCK MANAGEMENT ==============
export interface RestockQueueItem {
  id: string;
  product_id: string;
  quantity_needed: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  created_at: string;
  completed_at?: string;
}

// ============== ACTIVITY LOG ==============
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string; // 'create_product', 'order_placed', 'stock_updated', etc.
  entity_type: 'product' | 'order' | 'stock' | 'category';
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
}

// ============== DASHBOARD ==============
export interface DashboardMetrics {
  orders_today: number;
  pending_orders: number;
  completed_orders: number;
  low_stock_products: number;
  total_revenue: number;
  restock_queue_count: number;
}

// ============== API RESPONSES ==============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
