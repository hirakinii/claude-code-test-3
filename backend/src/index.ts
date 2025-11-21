import 'dotenv/config';
import 'express-async-errors';
import { createServer } from './server';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

async function main(): Promise<void> {
  try {
    const app = createServer();

    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`, {
        environment: process.env.NODE_ENV,
        port: PORT,
      });
    });

    // Graceful shutdown
    const shutdown = (): void => {
      logger.info('Received shutdown signal, closing server gracefully...');

      server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

void main();
