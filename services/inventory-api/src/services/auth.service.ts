import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { env } from '../config/env.js';

interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string;
  role: 'manager' | 'salesman';
  status: 'active' | 'inactive';
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

interface PasswordResetRequestRow {
  id: string;
  user_id: string;
  email: string;
  otp_code: string;
  attempt_count: number;
  verified: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'manager' | 'salesman';
  status: 'active' | 'inactive';
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

const toPublicUser = (user: DbUser): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  role: user.role,
  status: user.status,
  created_by: user.created_by,
  updated_by: user.updated_by,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const signToken = (user: PublicUser): string => {
  return jwt.sign(
    {
      email: user.email,
      role: user.role,
      status: user.status,
    },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: '24h',
    }
  );
};

const findUserByEmail = async (email: string): Promise<DbUser | undefined> => {
  return db<DbUser>('users').where({ email }).first();
};

const findUserById = async (id: string): Promise<DbUser | undefined> => {
  return db<DbUser>('users').where({ id }).first();
};

let hasRequiredUserColumnsPromise: Promise<boolean> | null = null;

const ensureRequiredUserColumns = async (): Promise<void> => {
  if (!hasRequiredUserColumnsPromise) {
    hasRequiredUserColumnsPromise = (async () => {
      const checks = await Promise.all([
        db.schema.hasColumn('users', 'name'),
        db.schema.hasColumn('users', 'phone'),
        db.schema.hasColumn('users', 'role'),
        db.schema.hasColumn('users', 'status'),
        db.schema.hasColumn('users', 'created_by'),
        db.schema.hasColumn('users', 'updated_by'),
      ]);

      return checks.every(Boolean);
    })();
  }

  const ready = await hasRequiredUserColumnsPromise;
  if (!ready) {
    throw new Error('USER_SCHEMA_NOT_MIGRATED');
  }
};

export const signup = async (
  email: string,
  password: string,
  name: string,
  phone: string
): Promise<AuthResult> => {
  await ensureRequiredUserColumns();

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await hash(password, 10);
  const inserted = await db<DbUser>('users')
    .insert({
      email,
      password_hash: passwordHash,
      name,
      phone,
      role: 'salesman',
      status: 'active',
      created_by: 'system',
      updated_by: 'system',
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

  const createdUser = inserted[0] as DbUser;
  const user = toPublicUser(createdUser);
  const token = signToken(user);

  return { token, user };
};

export const login = async (email: string, password: string): Promise<AuthResult> => {
  await ensureRequiredUserColumns();

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isValid = await compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  if (user.status !== 'active') {
    throw new Error('INACTIVE_ACCOUNT');
  }

  const publicUser = toPublicUser(user);
  const token = signToken(publicUser);

  return { token, user: publicUser };
};

export const demoLogin = async (): Promise<AuthResult> => {
  await ensureRequiredUserColumns();

  const demoEmail = 'demo@inventory.local';
  const demoPassword = 'demo123';

  let user = await findUserByEmail(demoEmail);
  if (!user) {
    const passwordHash = await hash(demoPassword, 10);
    const inserted = await db<DbUser>('users')
      .insert({
        email: demoEmail,
        password_hash: passwordHash,
        name: 'Demo Manager',
        phone: '01700000000',
        role: 'manager',
        status: 'active',
        created_by: 'system',
        updated_by: 'system',
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

    user = inserted[0] as DbUser;
  }

  const publicUser = toPublicUser(user);
  const token = signToken(publicUser);

  return { token, user: publicUser };
};

const OTP_CODE = '1234';
const MAX_RESET_ATTEMPTS = 5;
const RESET_EXPIRY_MINUTES = 10;

export const requestPasswordReset = async (email: string): Promise<{ email_exists: boolean }> => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('EMAIL_NOT_FOUND');
  }

  await db<PasswordResetRequestRow>('password_reset_requests').where({ email }).del();

  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);
  await db<PasswordResetRequestRow>('password_reset_requests').insert({
    user_id: user.id,
    email,
    otp_code: OTP_CODE,
    attempt_count: 0,
    verified: false,
    expires_at: expiresAt.toISOString(),
  });

  return { email_exists: true };
};

export const verifyPasswordResetOtp = async (
  email: string,
  otp: string
): Promise<{ verified: boolean }> => {
  const latest = await db<PasswordResetRequestRow>('password_reset_requests')
    .where({ email })
    .orderBy('created_at', 'desc')
    .first();

  if (!latest) {
    throw new Error('RESET_REQUEST_NOT_FOUND');
  }

  if (new Date(latest.expires_at).getTime() < Date.now()) {
    throw new Error('RESET_OTP_EXPIRED');
  }

  if (latest.attempt_count >= MAX_RESET_ATTEMPTS) {
    throw new Error('RESET_OTP_ATTEMPTS_EXCEEDED');
  }

  if (otp !== latest.otp_code) {
    await db<PasswordResetRequestRow>('password_reset_requests')
      .where({ id: latest.id })
      .update({
        attempt_count: latest.attempt_count + 1,
        updated_at: db.fn.now(),
      });
    throw new Error('INVALID_OTP');
  }

  await db<PasswordResetRequestRow>('password_reset_requests')
    .where({ id: latest.id })
    .update({ verified: true, updated_at: db.fn.now() });

  return { verified: true };
};

export const resetPasswordWithOtp = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<{ reset: boolean }> => {
  const latest = await db<PasswordResetRequestRow>('password_reset_requests')
    .where({ email })
    .orderBy('created_at', 'desc')
    .first();

  if (!latest) {
    throw new Error('RESET_REQUEST_NOT_FOUND');
  }

  if (new Date(latest.expires_at).getTime() < Date.now()) {
    throw new Error('RESET_OTP_EXPIRED');
  }

  if (latest.attempt_count >= MAX_RESET_ATTEMPTS) {
    throw new Error('RESET_OTP_ATTEMPTS_EXCEEDED');
  }

  if (otp !== latest.otp_code) {
    await db<PasswordResetRequestRow>('password_reset_requests')
      .where({ id: latest.id })
      .update({
        attempt_count: latest.attempt_count + 1,
        updated_at: db.fn.now(),
      });
    throw new Error('INVALID_OTP');
  }

  const passwordHash = await hash(newPassword, 10);

  await db.transaction(async (trx) => {
    await trx<DbUser>('users').where({ email }).update({
      password_hash: passwordHash,
      updated_at: trx.fn.now(),
      updated_by: 'system',
    });

    await trx<PasswordResetRequestRow>('password_reset_requests').where({ email }).del();
  });

  return { reset: true };
};

export const getMe = async (userId: string): Promise<PublicUser | null> => {
  await ensureRequiredUserColumns();

  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  return toPublicUser(user);
};
