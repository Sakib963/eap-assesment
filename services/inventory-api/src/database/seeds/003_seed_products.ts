import type { Knex } from 'knex';
import { categorySeeds, productCatalog, toDate, toId } from '../seed-data/index.js';

export async function seed(knex: Knex): Promise<void> {
  const manager = await knex('users').where({ email: 'demo@inventory.local' }).first('id');
  const managerId = manager ? toId(manager) : null;

  const categories = await knex('categories').select('id', 'name');
  const categoryIdByName = new Map(categories.map((category) => [String((category as { name: string }).name), toId(category)]));

  const productRows = Object.entries(productCatalog).flatMap(([category, products]) =>
    products.map((product) => ({
      category_id: categoryIdByName.get(category),
      name: product.name,
      description: product.description,
      price: product.price,
      current_stock: product.current_stock,
      min_stock_threshold: product.min_stock_threshold,
      is_active: product.is_active ?? true,
    }))
  );

  const insertedProducts = await knex('products')
    .insert(productRows)
    .returning(['id', 'category_id', 'name', 'description', 'price', 'current_stock', 'min_stock_threshold', 'is_active']);

  const productLogs = insertedProducts.map((product, index) => ({
    user_id: managerId,
    action: `Product "${String((product as { name: string }).name)}" created`,
    entity_type: 'product',
    entity_id: toId(product),
    details: {
      category_id: String((product as { category_id: string }).category_id),
      price: Number((product as { price: string | number }).price),
      current_stock: Number((product as { current_stock: number }).current_stock),
      min_stock_threshold: Number((product as { min_stock_threshold: number }).min_stock_threshold),
      is_active: Boolean((product as { is_active?: boolean }).is_active ?? true),
    },
    created_at: toDate(29, 9, index * 2),
  }));

  await knex('activity_logs').insert(productLogs);
}
