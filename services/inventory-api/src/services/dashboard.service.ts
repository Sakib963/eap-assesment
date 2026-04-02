import db from '../config/database.js';

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

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const today = new Date().toISOString().slice(0, 10);

  const [
    ordersTodayResult,
    pendingResult,
    completedResult,
    revenueTodayResult,
    lowStockCountResult,
    lowStockProducts,
  ] = await Promise.all([
    db('orders').whereRaw('DATE(created_at) = DATE(?)', [today]).count('id as count').first(),
    db('orders').where('status', 'pending').count('id as count').first(),
    db('orders').whereIn('status', ['delivered', 'completed']).count('id as count').first(),
    db('orders').whereRaw('DATE(created_at) = DATE(?)', [today]).sum('total_amount as revenue').first(),
    db('products').whereRaw('current_stock <= min_stock_threshold').count('id as count').first(),
    db('products')
      .whereRaw('current_stock <= min_stock_threshold')
      .where('is_active', true)
      .select('id', 'name', 'current_stock', 'min_stock_threshold')
      .orderBy('current_stock', 'asc')
      .limit(10),
  ]);

  return {
    orders_today: Number(ordersTodayResult?.count ?? 0),
    pending_orders: Number(pendingResult?.count ?? 0),
    completed_orders: Number(completedResult?.count ?? 0),
    low_stock_count: Number(lowStockCountResult?.count ?? 0),
    revenue_today: Number(revenueTodayResult?.revenue ?? 0),
    low_stock_products: lowStockProducts.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      current_stock: Number(p.current_stock),
      min_stock_threshold: Number(p.min_stock_threshold),
      status: Number(p.current_stock) <= 0 ? 'out_of_stock' : 'low_stock',
    })),
  };
};
