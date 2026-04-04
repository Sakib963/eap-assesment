import type { Knex } from 'knex';
import { categorySeeds, toDate, toId } from '../seed-data/index.js';

export async function seed(knex: Knex): Promise<void> {
  const manager = await knex('users').where({ email: 'demo@inventory.local' }).first('id');
  const managerId = manager ? toId(manager) : null;

  const insertedCategories = await knex('categories')
    .insert(
      categorySeeds.map((category) => ({
        name: category.name,
        description: category.description,
        is_active: category.is_active ?? true,
      }))
    )
    .returning(['id', 'name', 'description', 'is_active']);

  const logs = insertedCategories.map((category, index) => ({
    user_id: managerId,
    action: `Category "${String((category as { name: string }).name)}" created`,
    entity_type: 'category',
    entity_id: toId(category),
    details: {
      name: String((category as { name: string }).name),
      description: String((category as { description?: string | null }).description ?? ''),
      is_active: Boolean((category as { is_active?: boolean }).is_active ?? true),
    },
    created_at: toDate(29, 8, index * 2),
  }));

  await knex('activity_logs').insert(logs);
}
