import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasCustomerName = await knex.schema.hasColumn('orders', 'customer_name');

  if (!hasCustomerName) {
    await knex.schema.alterTable('orders', (table) => {
      table.string('customer_name', 120).notNullable().defaultTo('Walk-in Customer');
    });
  }

  await knex.raw(`
    ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_status_check;
  `);

  await knex.raw(`
    ALTER TABLE orders
    ALTER COLUMN status DROP DEFAULT;
  `);

  await knex.raw(`
    DO $$
    BEGIN
      BEGIN
        ALTER TABLE orders ALTER COLUMN status TYPE TEXT;
      EXCEPTION WHEN others THEN
        -- Status may already be TEXT in some environments.
        NULL;
      END;
    END $$;
  `);

  await knex.raw(`
    UPDATE orders
    SET status = 'delivered'
    WHERE status = 'completed';
  `);

  await knex.raw(`
    ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));
  `);

  await knex.raw(`
    ALTER TABLE orders
    ALTER COLUMN status SET DEFAULT 'pending';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_status_check;
  `);

  await knex.raw(`
    ALTER TABLE orders
    UPDATE orders
    SET status = 'completed'
    WHERE status = 'delivered';
  `);

  await knex.raw(`
    ALTER TABLE orders
    ALTER COLUMN status SET DEFAULT 'pending';
  `);

  const hasCustomerName = await knex.schema.hasColumn('orders', 'customer_name');
  if (hasCustomerName) {
    await knex.schema.alterTable('orders', (table) => {
      table.dropColumn('customer_name');
    });
  }
}
