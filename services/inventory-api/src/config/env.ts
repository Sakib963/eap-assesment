import dotenv from 'dotenv';

dotenv.config();

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseJwtSecret = (value: string | undefined, nodeEnv: string): string => {
  const trimmed = value?.trim();

  if (trimmed) {
    return trimmed;
  }

  if (nodeEnv === 'production') {
    throw new Error('JWT_SECRET is required in production environment');
  }

  return 'dev-only-jwt-secret';
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT, 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://dbuser:dbpass@localhost:5432/inventory',
  jwtSecret: parseJwtSecret(process.env.JWT_SECRET, process.env.NODE_ENV ?? 'development'),
};
