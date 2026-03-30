import type { AuthenticatedUser } from '../types/api.js';

export const ping = (): { pong: boolean } => ({ pong: true });

export const getCurrentUser = (user: AuthenticatedUser | undefined): { user: AuthenticatedUser | undefined } => ({
  user,
});

export const echoMessage = (message: string): { echo: string; length: number } => ({
  echo: message,
  length: message.length,
});
