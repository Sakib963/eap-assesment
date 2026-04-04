import type { Knex } from 'knex';
import {
  customerAddresses,
  firstNames,
  instructions,
  lastNames,
  orderStatusCycle,
  pickOrderLines,
  seededRandom,
  toDate,
  toId,
  type SeededProductState,
} from '../seed-data/index.js';

export async function seed(knex: Knex): Promise<void> {
  const salesmen = await knex('users')
    .select('id', 'email')
    .whereIn('email', ['sales1@inventory.local', 'sales2@inventory.local', 'sales3@inventory.local']);

  const salesmanIds = salesmen.map((user) => toId(user));
  const products = (await knex('products').select('id', 'category_id', 'name', 'description', 'price', 'current_stock', 'min_stock_threshold', 'is_active')) as Array<Record<string, unknown>>;
  const productState: SeededProductState[] = products.map((product) => ({
    id: toId(product),
    category: String(product.category_id),
    category_id: String(product.category_id),
    name: String(product.name),
    description: String(product.description ?? ''),
    price: Number(product.price),
    current_stock: Number(product.current_stock),
    min_stock_threshold: Number(product.min_stock_threshold),
    is_active: Boolean(product.is_active ?? true),
  }));

  const random = seededRandom(42);
  const logs: Array<Record<string, unknown>> = [];
  const insertedOrders: Array<{ id: string; created_at: Date }> = [];

  for (let index = 0; index < 100; index += 1) {
    const ownerId = salesmanIds[index % salesmanIds.length];
    const finalStatus = orderStatusCycle[index % orderStatusCycle.length];
    const orderDate = toDate(index % 30, 9 + (index % 8), (index * 7) % 60);
    const customerName = `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`;
    const customerPhone = `0171${String(1000000 + index + 1).slice(-7)}`;
    const itemCount = 1 + (index % 3);
    const selectedItems = pickOrderLines(productState, itemCount, random);

    const orderLines = selectedItems.map(({ product, quantity }) => ({
      product_id: product.id,
      quantity,
      unit_price: product.price,
      line_total: Number((product.price * quantity).toFixed(2)),
    }));

    const subtotal = Number(orderLines.reduce((sum, item) => sum + item.line_total, 0).toFixed(2));
    const discountAmount = finalStatus === 'cancelled'
      ? 0
      : Number((index % 4 === 0 ? subtotal * 0.1 : index % 5 === 0 ? subtotal * 0.05 : 0).toFixed(2));
    const totalAmount = Number((subtotal - discountAmount).toFixed(2));

    const insertedOrder = await knex('orders')
      .insert({
        user_id: ownerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddresses[index % customerAddresses.length],
        delivery_instruction: instructions[index % instructions.length],
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: finalStatus,
        created_at: orderDate,
        updated_at: orderDate,
      })
      .returning(['id']);

    const orderId = toId(insertedOrder[0]);
    insertedOrders.push({ id: orderId, created_at: orderDate });

    await knex('order_items').insert(
      orderLines.map((line) => ({
        order_id: orderId,
        product_id: line.product_id,
        quantity: line.quantity,
        unit_price: line.unit_price,
        line_total: line.line_total,
        created_at: orderDate,
      }))
    );

    if (finalStatus !== 'cancelled') {
      for (const line of orderLines) {
        const product = productState.find((item) => item.id === line.product_id);
        if (product) {
          product.current_stock = Math.max(product.current_stock - line.quantity, 0);
          await knex('products').where({ id: product.id }).update({ current_stock: product.current_stock, updated_at: orderDate });
        }
      }
    }

    logs.push({
      user_id: ownerId,
      action: `Order #${orderId} created`,
      entity_type: 'order',
      entity_id: orderId,
      details: { customer_name: customerName, items_count: orderLines.length, total_amount: totalAmount },
      created_at: orderDate,
    });

    if (finalStatus !== 'pending') {
      logs.push({
        user_id: ownerId,
        action: `Order #${orderId} status changed to ${finalStatus}`,
        entity_type: 'order',
        entity_id: orderId,
        details: { status: finalStatus },
        created_at: new Date(orderDate.getTime() + 60 * 1000),
      });
    }
  }

  await knex('activity_logs').insert(logs);
}
