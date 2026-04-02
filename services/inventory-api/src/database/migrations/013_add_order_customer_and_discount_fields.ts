import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasCustomerPhone = await knex.schema.hasColumn('orders', 'customer_phone');
  const hasCustomerAddress = await knex.schema.hasColumn('orders', 'customer_address');
  const hasDeliveryInstruction = await knex.schema.hasColumn('orders', 'delivery_instruction');
  const hasDiscountAmount = await knex.schema.hasColumn('orders', 'discount_amount');

  await knex.schema.alterTable('orders', (table) => {
    if (!hasCustomerPhone) {
      table.string('customer_phone', 30).notNullable().defaultTo('');
    }
    if (!hasCustomerAddress) {
      table.string('customer_address', 255).nullable();
    }
    if (!hasDeliveryInstruction) {
      table.text('delivery_instruction').nullable();
    }
    if (!hasDiscountAmount) {
      table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasCustomerPhone = await knex.schema.hasColumn('orders', 'customer_phone');
  const hasCustomerAddress = await knex.schema.hasColumn('orders', 'customer_address');
  const hasDeliveryInstruction = await knex.schema.hasColumn('orders', 'delivery_instruction');
  const hasDiscountAmount = await knex.schema.hasColumn('orders', 'discount_amount');

  await knex.schema.alterTable('orders', (table) => {
    if (hasDiscountAmount) {
      table.dropColumn('discount_amount');
    }
    if (hasDeliveryInstruction) {
      table.dropColumn('delivery_instruction');
    }
    if (hasCustomerAddress) {
      table.dropColumn('customer_address');
    }
    if (hasCustomerPhone) {
      table.dropColumn('customer_phone');
    }
  });
}
