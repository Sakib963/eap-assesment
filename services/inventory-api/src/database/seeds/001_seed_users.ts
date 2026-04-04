import { hash } from 'bcryptjs';
import type { Knex } from 'knex';
import { users } from '../seed-data/index.js';

export async function seed(knex: Knex): Promise<void> {
  const passwordHashes = new Map<string, string>();
  for (const user of users) {
    if (!passwordHashes.has(user.password)) {
      passwordHashes.set(user.password, await hash(user.password, 10));
    }
  }

  await knex('users').insert(
    users.map((user) => ({
      email: user.email,
      password_hash: passwordHashes.get(user.password),
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      created_by: 'system',
      updated_by: 'system',
    }))
  );
}
