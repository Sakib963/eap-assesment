import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('category_id').notNullable().references('categories.id').onDelete('RESTRICT');
    table.string('name', 150).notNullable();
    table.text('description').nullable();
    table.decimal('price', 12, 2).notNullable().defaultTo(0);
    table.integer('current_stock').notNullable().defaultTo(0);
    table.integer('min_stock_threshold').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_products_stock ON products (current_stock, min_stock_threshold)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('products');
}