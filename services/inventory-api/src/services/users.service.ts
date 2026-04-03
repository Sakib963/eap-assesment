import { hash } from 'bcryptjs';
import db from '../config/database.js';

export type UserRole = 'manager' | 'salesman';
export type UserStatus = 'active' | 'inactive';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserView {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

interface ListUsersFilters {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

const toUserView = (row: UserRow): UserView => ({
  id: row.id,
  email: row.email,
  name: row.name,
  phone: row.phone,
  role: row.role,
  status: row.status,
  created_by: row.created_by,
  updated_by: row.updated_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const listUsers = async (
  filters: ListUsersFilters
): Promise<{ items: UserView[]; total: number; page: number; pageSize: number }> => {
  const { page, pageSize, search = '', role, status } = filters;
  const offset = (page - 1) * pageSize;

  const baseQuery = db<UserRow>('users').modify((builder) => {
    if (search) {
      builder.where((inner) => {
        inner.whereILike('email', `%${search}%`).orWhereILike('name', `%${search}%`);
      });
    }
    if (role) {
      builder.where('role', role);
    }
    if (status) {
      builder.where('status', status);
    }
  });

  const countResult = await baseQuery.clone().count<{ count: string }>('id as count').first();
  const items = await baseQuery
    .clone()
    .select(
      'id',
      'email',
      'name',
      'phone',
      'role',
      'status',
      'created_by',
      'updated_by',
      'created_at',
      'updated_at'
    )
    .orderBy('created_at', 'desc')
    .offset(offset)
    .limit(pageSize);

  return {
    items: items.map(toUserView),
    total: Number(countResult?.count ?? 0),
    page,
    pageSize,
  };
};

export const createUser = async (payload: {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  status?: UserStatus;
  actorEmail: string;
}): Promise<UserView> => {
  const exists = await db<UserRow>('users').where({ email: payload.email }).first('id');
  if (exists) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await hash(payload.password, 10);

  const inserted = await db<UserRow>('users')
    .insert({
      email: payload.email,
      password_hash: passwordHash,
      name: payload.name,
      phone: payload.phone,
      role: payload.role,
      status: payload.status ?? 'active',
      created_by: payload.actorEmail,
      updated_by: payload.actorEmail,
    })
    .returning([
      'id',
      'email',
      'password_hash',
      'name',
      'phone',
      'role',
      'status',
      'created_by',
      'updated_by',
      'created_at',
      'updated_at',
    ]);

  return toUserView(inserted[0] as UserRow);
};

export const updateUser = async (
  userId: string,
  payload: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    role?: UserRole;
    status?: UserStatus;
    actorEmail: string;
  }
): Promise<UserView | null> => {
  if (payload.email) {
    const conflict = await db<UserRow>('users')
      .where({ email: payload.email })
      .whereNot({ id: userId })
      .first('id');

    if (conflict) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: db.fn.now(),
    updated_by: payload.actorEmail,
  };

  if (payload.email !== undefined) updatePayload.email = payload.email;
  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.phone !== undefined) updatePayload.phone = payload.phone;
  if (payload.role !== undefined) updatePayload.role = payload.role;
  if (payload.status !== undefined) updatePayload.status = payload.status;
  if (payload.password !== undefined) {
    updatePayload.password_hash = await hash(payload.password, 10);
  }

  const updated = await db<UserRow>('users')
    .where({ id: userId })
    .update(updatePayload)
    .returning([
      'id',
      'email',
      'password_hash',
      'name',
      'phone',
      'role',
      'status',
      'created_by',
      'updated_by',
      'created_at',
      'updated_at',
    ]);

  const row = updated[0] as UserRow | undefined;
  return row ? toUserView(row) : null;
};

export const setUserStatus = async (
  userId: string,
  status: UserStatus,
  actorEmail: string
): Promise<UserView | null> => {
  const updated = await db<UserRow>('users')
    .where({ id: userId })
    .update({
      status,
      updated_at: db.fn.now(),
      updated_by: actorEmail,
    })
    .returning([
      'id',
      'email',
      'password_hash',
      'name',
      'phone',
      'role',
      'status',
      'created_by',
      'updated_by',
      'created_at',
      'updated_at',
    ]);

  const row = updated[0] as UserRow | undefined;
  return row ? toUserView(row) : null;
};
