import type { Knex } from 'knex';
import { hash } from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data (in correct order due to foreign keys)
  await knex('activity_logs').del();
  await knex('restock_queue').del();
  await knex('order_items').del();
  await knex('orders').del();
  await knex('products').del();
  await knex('categories').del();
  await knex('users').del();

  // Demo user password: "demo123"
  const demoPasswordHash = await hash('demo123', 10);

  // Insert demo user
  const userResults = await knex('users').insert({
    email: 'demo@inventory.local',
    password_hash: demoPasswordHash,
  }).returning('id');

  const userId = typeof userResults[0] === 'object' ? userResults[0].id : userResults[0];
  console.log('✓ Created demo user:', userId);

  // Insert categories
  const categoryResults = await knex('categories').insert([
    { name: 'Electronics', description: 'Computers, phones, and accessories' },
    { name: 'Office Supplies', description: 'Paper, pens, and office equipment' },
    { name: 'Tools', description: 'Hand tools and power tools' },
    { name: 'Home & Garden', description: 'Furniture, decor, and gardening supplies' },
  ]).returning('id');

  console.log('✓ Created 4 categories');

  // Insert products (with varied stock levels to demonstrate restock queue)
    const categories = categoryResults.map((c: any) => typeof c === 'object' ? c.id : c);

  const productResults = await knex('products').insert([
    // Electronics
    { category_id: categories[0], name: 'Laptop Pro 15"', price: 1299.99, current_stock: 8, min_stock_threshold: 5, description: 'High-performance laptop' },
    { category_id: categories[0], name: 'Wireless Mouse', price: 29.99, current_stock: 3, min_stock_threshold: 20, description: 'Ergonomic wireless mouse' },
    { category_id: categories[0], name: 'USB-C Cable', price: 9.99, current_stock: 45, min_stock_threshold: 30, description: '2-meter USB-C cable' },
    { category_id: categories[0], name: 'Monitor 4K 27"', price: 499.99, current_stock: 2, min_stock_threshold: 3, description: '4K UHD monitor' },

    // Office Supplies
    { category_id: categories[1], name: 'A4 Paper Ream', price: 5.99, current_stock: 0, min_stock_threshold: 10, description: '500 sheets A4 paper' },
    { category_id: categories[1], name: 'Ballpoint Pen', price: 0.99, current_stock: 150, min_stock_threshold: 50, description: 'Black ballpoint pen' },
    { category_id: categories[1], name: 'Desk Lamp', price: 34.99, current_stock: 5, min_stock_threshold: 8, description: 'LED desk lamp' },

    // Tools
    { category_id: categories[2], name: 'Power Drill', price: 89.99, current_stock: 4, min_stock_threshold: 3, description: '18V cordless drill' },
    { category_id: categories[2], name: 'Screwdriver Set', price: 24.99, current_stock: 12, min_stock_threshold: 8, description: '12-piece screwdriver set' },

    // Home & Garden
    { category_id: categories[3], name: 'Office Chair', price: 249.99, current_stock: 6, min_stock_threshold: 5, description: 'Ergonomic office chair' },
    { category_id: categories[3], name: 'Potted Plant', price: 19.99, current_stock: 0, min_stock_threshold: 5, description: 'Small potted plant' },
  ]).returning('id');

  console.log('✓ Created 11 products');

  // Insert sample orders
    const products = productResults.map((p: any) => typeof p === 'object' ? p.id : p);

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const orderResults = await knex('orders').insert([
    { user_id: userId, status: 'completed', total_amount: 1339.98, created_at: threeDaysAgo },
    { user_id: userId, status: 'pending', total_amount: 1549.97, created_at: yesterday },
    { user_id: userId, status: 'pending', total_amount: 49.97, created_at: now },
  ]).returning('id');

  console.log('✓ Created 3 sample orders');
  const orderIds = orderResults.map((o: any) => typeof o === 'object' ? o.id : o);
  const [order1, order2, order3] = orderIds;


  // Insert order items
  await knex('order_items').insert([
    // Order 1
    { order_id: order1, product_id: products[0], quantity: 1, unit_price: 1299.99 }, // Laptop
    { order_id: order1, quantity: 1, product_id: products[1], unit_price: 29.99 }, // Mouse

    // Order 2
    { order_id: order2, product_id: products[3], quantity: 3, unit_price: 499.99 }, // Monitor
    { order_id: order2, product_id: products[2], quantity: 1, unit_price: 9.99 }, // USB Cable

    // Order 3
    { order_id: order3, product_id: products[5], quantity: 50, unit_price: 0.99 }, // Pens
  ]);

  console.log('✓ Created 5 order items');

  // Insert restock queue (for products with low stock)
  await knex('restock_queue').insert([
    { product_id: products[1], quantity_needed: 25, priority: 'high', status: 'pending' }, // Wireless Mouse
    { product_id: products[3], quantity_needed: 5, priority: 'high', status: 'pending' }, // Monitor
    { product_id: products[4], quantity_needed: 20, priority: 'high', status: 'pending' }, // A4 Paper
    { product_id: products[6], quantity_needed: 5, priority: 'medium', status: 'pending' }, // Desk Lamp
    { product_id: products[10], quantity_needed: 10, priority: 'medium', status: 'pending' }, // Potted Plant
  ]);

  console.log('✓ Created 5 restock queue items');

  // Insert activity logs (audit trail)
  await knex('activity_logs').insert([
    { user_id: userId, action: 'order_placed', entity_type: 'order', entity_id: order1, details: { items_count: 2 }, created_at: threeDaysAgo },
    { user_id: userId, action: 'order_placed', entity_type: 'order', entity_id: order2, details: { items_count: 2 }, created_at: yesterday },
    { user_id: userId, action: 'order_placed', entity_type: 'order', entity_id: order3, details: { items_count: 1 }, created_at: now },
  ]);

  console.log('✓ Created activity logs');

  console.log('\n✅ Database seeded successfully!');
  console.log('Demo user credentials:');
  console.log('  Email: demo@inventory.local');
  console.log('  Password: demo123\n');
}
