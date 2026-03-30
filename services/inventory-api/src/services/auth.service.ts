import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { env } from '../config/env.js';

interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
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
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const signToken = (user: PublicUser): string => {
  return jwt.sign(
    {
      email: user.email,
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

export const signup = async (email: string, password: string): Promise<AuthResult> => {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await hash(password, 10);
  const inserted = await db<DbUser>('users')
    .insert({
      email,
      password_hash: passwordHash,
    })
    .returning(['id', 'email', 'password_hash', 'created_at', 'updated_at']);

  const createdUser = inserted[0] as DbUser;
  const user = toPublicUser(createdUser);
  const token = signToken(user);

  return { token, user };
};

export const login = async (email: string, password: string): Promise<AuthResult> => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isValid = await compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const publicUser = toPublicUser(user);
  const token = signToken(publicUser);

  return { token, user: publicUser };
};

export const demoLogin = async (): Promise<AuthResult> => {
  const demoEmail = 'demo@inventory.local';
  const demoPassword = 'demo123';

  let user = await findUserByEmail(demoEmail);
  if (!user) {
    const passwordHash = await hash(demoPassword, 10);
    const inserted = await db<DbUser>('users')
      .insert({
        email: demoEmail,
        password_hash: passwordHash,
      })
      .returning(['id', 'email', 'password_hash', 'created_at', 'updated_at']);

    user = inserted[0] as DbUser;
  }

  const publicUser = toPublicUser(user);
  const token = signToken(publicUser);

  return { token, user: publicUser };
};

export const getMe = async (userId: string): Promise<PublicUser | null> => {
  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  return toPublicUser(user);
};
