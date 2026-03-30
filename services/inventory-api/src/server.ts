import { app } from './app.js';
import { env } from './config/env.js';
import { closeDatabase } from './config/database.js';

const server = app.listen(env.port, () => {
  console.log(`✓ Backend running on http://localhost:${env.port}`);
  console.log(`✓ Environment: ${env.nodeEnv}`);
  console.log(`✓ CORS allowed origin: ${env.corsOrigin}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
