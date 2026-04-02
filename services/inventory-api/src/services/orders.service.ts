import db from '../config/database.js';
import type { Knex } from 'knex';
import { createHttpError } from '../middleware/error-handler.js';
import { syncRestockQueueForProducts } from './stock-rules.service.js';
import { logActivity } from './activity-log.service.js';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface OrderRow {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  delivery_instruction: string | null;
  discount_amount: string | number;
  status: string;
  total_amount: string | number;
  created_at: string;
  updated_at: string;
}

interface ProductLockRow {
  id: string;
  name: string;
  price: string | number;
  current_stock: number;
  min_stock_threshold: number;
  is_active: boolean;
}

export interface CreateOrderItemInput {
  product_id: string;
  quantity: number;
}

export interface CreateOrderInput {
  userId: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  delivery_instruction?: string | null;
  discount_amount?: number;
  items: CreateOrderItemInput[];
}

export interface OrderItemView {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderView {
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
  items?: OrderItemView[];
}

export interface OrderListFilters {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  fromDate?: string;
  toDate?: string;
}

const ordersColumnCache = new Map<string, Promise<boolean>>();
let supportsExtendedOrderStatusPromise: Promise<boolean> | null = null;

const supportsExtendedOrderStatus = async (): Promise<boolean> => {
  if (supportsExtendedOrderStatusPromise) {
    return supportsExtendedOrderStatusPromise;
  }

  supportsExtendedOrderStatusPromise = (async () => {
    try {
      const result = await db.raw(
        `
        SELECT pg_get_constraintdef(c.oid) AS definition
        FROM pg_constraint c
        WHERE c.conname = 'orders_status_check'
          AND c.conrelid = 'orders'::regclass
        LIMIT 1
        `
      );

      const row = result?.rows?.[0];
      const definition = String(row?.definition ?? '').toLowerCase();
      return definition.includes('confirmed') && definition.includes('shipped') && definition.includes('delivered');
    } catch {
      return false;
    }
  })();

  return supportsExtendedOrderStatusPromise;
};

const mapStatusForStorage = (status: OrderStatus, supportsExtended: boolean): string => {
  if (supportsExtended) {
    return status;
  }

  if (status === 'delivered') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
};

const normalizeStatusFromStorage = (status: string): OrderStatus => {
  if (status === 'completed') return 'delivered';
  if (status === 'confirmed') return 'confirmed';
  if (status === 'shipped') return 'shipped';
  if (status === 'delivered') return 'delivered';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
};

const hasOrdersColumn = async (columnName: string): Promise<boolean> => {
  const cached = ordersColumnCache.get(columnName);
  if (cached) {
    return cached;
  }

  const promise = db.schema.hasColumn('orders', columnName);
  ordersColumnCache.set(columnName, promise);
  return promise;
};

const customerNameSelect = (knexOrTrx: Knex | Knex.Transaction, hasColumn: boolean) => {
  if (hasColumn) {
    return 'o.customer_name';
  }

  return knexOrTrx.raw(`'Walk-in Customer'::text as customer_name`);
};

const customerPhoneSelect = (knexOrTrx: Knex | Knex.Transaction, hasColumn: boolean) => {
  if (hasColumn) {
    return 'o.customer_phone';
  }

  return knexOrTrx.raw(`''::text as customer_phone`);
};

const customerAddressSelect = (knexOrTrx: Knex | Knex.Transaction, hasColumn: boolean) => {
  if (hasColumn) {
    return 'o.customer_address';
  }

  return knexOrTrx.raw('NULL::text as customer_address');
};

const deliveryInstructionSelect = (knexOrTrx: Knex | Knex.Transaction, hasColumn: boolean) => {
  if (hasColumn) {
    return 'o.delivery_instruction';
  }

  return knexOrTrx.raw('NULL::text as delivery_instruction');
};

const discountAmountSelect = (knexOrTrx: Knex | Knex.Transaction, hasColumn: boolean) => {
  if (hasColumn) {
    return 'o.discount_amount';
  }

  return knexOrTrx.raw('0::numeric as discount_amount');
};

const mapOrder = (row: OrderRow & { items_count?: string | number }): OrderView => ({
  id: row.id,
  user_id: row.user_id,
  customer_name: row.customer_name,
  customer_phone: row.customer_phone,
  customer_address: row.customer_address,
  delivery_instruction: row.delivery_instruction,
  discount_amount: Number(row.discount_amount ?? 0),
  subtotal_amount: Number(row.total_amount) + Number(row.discount_amount ?? 0),
  status: normalizeStatusFromStorage(String(row.status ?? 'pending')),
  total_amount: Number(row.total_amount),
  items_count: Number(row.items_count ?? 0),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const ensureNoDuplicates = (items: CreateOrderItemInput[]): void => {
  const ids = items.map((item) => item.product_id);
  const uniqueCount = new Set(ids).size;

  if (uniqueCount !== ids.length) {
    throw createHttpError(
      409,
      'Duplicate product entries are not allowed in the same order',
      'DUPLICATE_PRODUCT_IN_ORDER'
    );
  }
};

const loadProductsForOrder = async (
  trx: Knex.Transaction,
  productIds: string[]
): Promise<Map<string, ProductLockRow>> => {
  const rows = await trx<ProductLockRow>('products')
    .whereIn('id', productIds)
    .select('id', 'name', 'price', 'current_stock', 'min_stock_threshold', 'is_active')
    .forUpdate();

  return new Map(rows.map((row) => [row.id, row]));
};

const ensureProductsAvailable = (
  items: CreateOrderItemInput[],
  products: Map<string, ProductLockRow>
): void => {
  for (const item of items) {
    const product = products.get(item.product_id);
    if (!product || !product.is_active) {
      throw createHttpError(
        409,
        'One or more selected products are unavailable or inactive',
        'PRODUCT_UNAVAILABLE'
      );
    }

    if (item.quantity > product.current_stock) {
      throw createHttpError(
        409,
        `Insufficient stock for ${product.name}. Available quantity: ${product.current_stock}`,
        'INSUFFICIENT_STOCK',
        {
          product_id: product.id,
          product_name: product.name,
          requested_quantity: item.quantity,
          available_quantity: product.current_stock,
        }
      );
    }
  }
};

export const listOrders = async (
  filters: OrderListFilters
): Promise<{ items: OrderView[]; total: number; page: number; pageSize: number }> => {
  const supportsExtendedStatuses = await supportsExtendedOrderStatus();
  const customerNameAvailable = await hasOrdersColumn('customer_name');
  const customerPhoneAvailable = await hasOrdersColumn('customer_phone');
  const customerAddressAvailable = await hasOrdersColumn('customer_address');
  const deliveryInstructionAvailable = await hasOrdersColumn('delivery_instruction');
  const discountAmountAvailable = await hasOrdersColumn('discount_amount');
  const { page, pageSize, status, fromDate, toDate } = filters;
  const offset = (page - 1) * pageSize;

  const baseQuery = db('orders as o').modify((builder) => {
    if (status) {
      builder.where('o.status', mapStatusForStorage(status, supportsExtendedStatuses));
    }

    if (fromDate) {
      builder.whereRaw('DATE(o.created_at) >= DATE(?)', [fromDate]);
    }

    if (toDate) {
      builder.whereRaw('DATE(o.created_at) <= DATE(?)', [toDate]);
    }
  });

  const countResult = await baseQuery.clone().count<{ count: string }>('o.id as count').first();

  const rows = (await baseQuery
    .clone()
    .leftJoin('order_items as oi', 'oi.order_id', 'o.id')
    .select(
      'o.id',
      'o.user_id',
      customerNameSelect(db, customerNameAvailable),
      customerPhoneSelect(db, customerPhoneAvailable),
      customerAddressSelect(db, customerAddressAvailable),
      deliveryInstructionSelect(db, deliveryInstructionAvailable),
      discountAmountSelect(db, discountAmountAvailable),
      'o.status',
      'o.total_amount',
      'o.created_at',
      'o.updated_at'
    )
    .count<{ items_count: string }>('oi.id as items_count')
    .groupBy('o.id')
    .orderBy('o.created_at', 'desc')
    .offset(offset)
    .limit(pageSize)) as unknown as Array<Record<string, unknown>>;

  return {
    items: rows.map((row) =>
      mapOrder({
        id: String(row.id),
        user_id: String(row.user_id),
        customer_name: String(row.customer_name ?? ''),
        customer_phone: String(row.customer_phone ?? ''),
        customer_address: row.customer_address ? String(row.customer_address) : null,
        delivery_instruction: row.delivery_instruction ? String(row.delivery_instruction) : null,
        discount_amount: Number(row.discount_amount ?? 0),
        status: String(row.status ?? 'pending'),
        total_amount: Number(row.total_amount ?? 0),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
        items_count: Number(row.items_count ?? 0),
      })
    ),
    total: Number(countResult?.count ?? 0),
    page,
    pageSize,
  };
};

export const getOrderById = async (id: string): Promise<OrderView | null> => {
  const customerNameAvailable = await hasOrdersColumn('customer_name');
  const customerPhoneAvailable = await hasOrdersColumn('customer_phone');
  const customerAddressAvailable = await hasOrdersColumn('customer_address');
  const deliveryInstructionAvailable = await hasOrdersColumn('delivery_instruction');
  const discountAmountAvailable = await hasOrdersColumn('discount_amount');
  const orderRow = (await db('orders as o')
    .leftJoin('order_items as oi', 'oi.order_id', 'o.id')
    .select(
      'o.id',
      'o.user_id',
      customerNameSelect(db, customerNameAvailable),
      customerPhoneSelect(db, customerPhoneAvailable),
      customerAddressSelect(db, customerAddressAvailable),
      deliveryInstructionSelect(db, deliveryInstructionAvailable),
      discountAmountSelect(db, discountAmountAvailable),
      'o.status',
      'o.total_amount',
      'o.created_at',
      'o.updated_at'
    )
    .count<{ items_count: string }>('oi.id as items_count')
    .groupBy('o.id')
    .where('o.id', id)
    .first()) as (OrderRow & { items_count: string }) | undefined;

  if (!orderRow) {
    return null;
  }

  const items = await db('order_items as oi')
    .join('products as p', 'p.id', 'oi.product_id')
    .select('oi.id', 'oi.product_id', 'oi.quantity', 'oi.unit_price', 'p.name as product_name')
    .where('oi.order_id', id)
    .orderBy('oi.created_at', 'asc');

  return {
    ...mapOrder(orderRow),
    items: items.map((item) => ({
      id: String(item.id),
      product_id: String(item.product_id),
      product_name: String(item.product_name),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      line_total: Number(item.unit_price) * Number(item.quantity),
    })),
  };
};

export const createOrder = async (input: CreateOrderInput): Promise<OrderView> => {
  if (!input.items.length) {
    throw createHttpError(400, 'At least one order item is required', 'EMPTY_ORDER_ITEMS');
  }

  ensureNoDuplicates(input.items);
  const customerNameAvailable = await hasOrdersColumn('customer_name');
  const customerPhoneAvailable = await hasOrdersColumn('customer_phone');
  const customerAddressAvailable = await hasOrdersColumn('customer_address');
  const deliveryInstructionAvailable = await hasOrdersColumn('delivery_instruction');
  const discountAmountAvailable = await hasOrdersColumn('discount_amount');

  const orderId = await db.transaction(async (trx) => {
    const productIds = input.items.map((item) => item.product_id);
    const products = await loadProductsForOrder(trx, productIds);

    ensureProductsAvailable(input.items, products);

    const subtotalAmount = input.items.reduce((sum, item) => {
      const product = products.get(item.product_id) as ProductLockRow;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const discountAmount = Math.max(0, Number(input.discount_amount ?? 0));
    if (discountAmount > subtotalAmount) {
      throw createHttpError(
        400,
        'Discount amount cannot exceed order subtotal',
        'INVALID_DISCOUNT'
      );
    }

    const totalAmount = subtotalAmount - discountAmount;

    const orderInsertPayload: Record<string, unknown> = {
      user_id: input.userId,
      status: 'pending',
      total_amount: totalAmount,
    };

    if (customerNameAvailable) {
      orderInsertPayload['customer_name'] = input.customer_name;
    }
    if (customerPhoneAvailable) {
      orderInsertPayload['customer_phone'] = input.customer_phone;
    }
    if (customerAddressAvailable) {
      orderInsertPayload['customer_address'] = input.customer_address ?? null;
    }
    if (deliveryInstructionAvailable) {
      orderInsertPayload['delivery_instruction'] = input.delivery_instruction ?? null;
    }
    if (discountAmountAvailable) {
      orderInsertPayload['discount_amount'] = discountAmount;
    }

    const inserted = await trx<OrderRow>('orders')
      .insert(orderInsertPayload)
      .returning(['id']);

    const createdOrderId = (inserted[0] as { id: string }).id;

    await trx('order_items').insert(
      input.items.map((item) => {
        const product = products.get(item.product_id) as ProductLockRow;
        return {
          order_id: createdOrderId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: Number(product.price),
        };
      })
    );

    for (const item of input.items) {
      const updatedRows = await trx('products')
        .where({ id: item.product_id })
        .andWhere('current_stock', '>=', item.quantity)
        .update({
          current_stock: trx.raw('current_stock - ?', [item.quantity]),
          updated_at: trx.fn.now(),
        });

      if (!updatedRows) {
        const product = products.get(item.product_id);
        throw createHttpError(
          409,
          `Insufficient stock for ${product?.name ?? 'product'}. Available quantity is no longer sufficient`,
          'INSUFFICIENT_STOCK_RACE'
        );
      }
    }

    const refreshedProducts = await trx<ProductLockRow>('products')
      .whereIn('id', productIds)
      .select('id', 'current_stock', 'min_stock_threshold', 'is_active');

    await syncRestockQueueForProducts(trx, refreshedProducts);

    return createdOrderId;
  });

  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error('ORDER_CREATE_FAILED');
  }

  void logActivity({
    user_id: input.userId,
    action: `Order #${orderId} created by user`,
    entity_type: 'order',
    entity_id: orderId,
    details: { customer_name: input.customer_name, items_count: input.items.length },
  });

  return order;
};

export const updateOrderStatus = async (
  orderId: string,
  nextStatus: OrderStatus,
  userId?: string | null
): Promise<OrderView | null> => {
  const supportsExtendedStatuses = await supportsExtendedOrderStatus();
  const nextStatusForStorage = mapStatusForStorage(nextStatus, supportsExtendedStatuses);

  const updated = await db.transaction(async (trx) => {
    const order = await trx<OrderRow>('orders').where({ id: orderId }).forUpdate().first();
    if (!order) {
      return false;
    }

    const currentNormalizedStatus = normalizeStatusFromStorage(String(order.status));

    if (currentNormalizedStatus === nextStatus) {
      return true;
    }

    if (currentNormalizedStatus === 'cancelled') {
      throw createHttpError(409, 'Cancelled orders cannot be updated', 'ORDER_ALREADY_CANCELLED');
    }

    if (currentNormalizedStatus === 'delivered') {
      throw createHttpError(409, 'Delivered orders cannot be updated', 'ORDER_ALREADY_DELIVERED');
    }

    const items = await trx('order_items')
      .where({ order_id: orderId })
      .select('product_id', 'quantity');

    const affectedProductIds = new Set<string>();

    if (nextStatus === 'cancelled') {
      for (const item of items) {
        affectedProductIds.add(String(item.product_id));
        await trx('products')
          .where({ id: item.product_id })
          .update({
            current_stock: trx.raw('current_stock + ?', [item.quantity]),
            updated_at: trx.fn.now(),
          });
      }
    }

    await trx<OrderRow>('orders')
      .where({ id: orderId })
      .update({
        status: nextStatusForStorage,
        updated_at: trx.fn.now(),
      });

    if (affectedProductIds.size > 0) {
      const productRows = await trx<ProductLockRow>('products')
        .whereIn('id', Array.from(affectedProductIds))
        .select('id', 'current_stock', 'min_stock_threshold', 'is_active');

      await syncRestockQueueForProducts(trx, productRows);
    }

    return true;
  });

  if (!updated) {
    return null;
  }

  void logActivity({
    user_id: userId ?? null,
    action: `Order #${orderId} status changed to ${nextStatus}`,
    entity_type: 'order',
    entity_id: orderId,
    details: { status: nextStatus },
  });

  return getOrderById(orderId);
};
