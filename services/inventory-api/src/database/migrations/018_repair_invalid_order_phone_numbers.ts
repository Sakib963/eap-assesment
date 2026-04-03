import type { Knex } from 'knex';

const PHONE_REGEX = '^01[3-9][0-9]{8}$';
const FALLBACK_PHONE = '01700000000';

export async function up(knex: Knex): Promise<void> {
  const hasOrdersPhone = await knex.schema.hasColumn('orders', 'customer_phone');

  if (!hasOrdersPhone) {
    return;
  }

  await knex.raw(`
    UPDATE orders
    SET customer_phone = '${FALLBACK_PHONE}'
    WHERE customer_phone IS NULL
      OR BTRIM(customer_phone) = ''
      OR customer_phone !~ '${PHONE_REGEX}'
  `);

  await knex.raw(`ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_phone_format_check`);
}

export async function down(_knex: Knex): Promise<void> {
  return;
}
