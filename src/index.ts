import 'reflect-metadata';
import 'dotenv/config';
import http from 'http';
import app from './app';
import { logger } from './config/logger';
import { connectRedis } from './config/redis';
import { AppDataSource } from './config/database';
import { initWebSocket } from './websocket/socket';
import { demarrerCronJobs } from './jobs/cron';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    logger.info('✅ PostgreSQL connecté (TypeORM)');

    await connectRedis();
    logger.info('✅ Redis connecté');

    const httpServer = http.createServer(app);
    initWebSocket(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Serveur: http://localhost:${PORT}`);
      logger.info(`📖 API: http://localhost:${PORT}/api/v1`);
      logger.info(`🔌 WebSocket actif`);
      logger.info(`🌍 Env: ${process.env.NODE_ENV}`);
    });

    demarrerCronJobs();
  } catch (error) {
    logger.error('❌ Erreur au démarrage:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => { await AppDataSource.destroy(); process.exit(0); });
process.on('SIGINT', async () => { await AppDataSource.destroy(); process.exit(0); });

bootstrap();
