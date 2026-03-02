import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';
import { AuthPayload } from '../middlewares/auth.middleware';

let io: Server;

export function initWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.WS_CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware WebSocket
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) return next(new Error('Token manquant'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
    logger.info({ userId: user.userId, entrepriseId: user.entrepriseId }, 'WebSocket connecté');

    // Chaque entreprise a sa propre "room" → isolation multi-tenant
    socket.join(`entreprise:${user.entrepriseId}`);

    socket.on('disconnect', () => {
      logger.debug({ userId: user.userId }, 'WebSocket déconnecté');
    });

    // Ping/pong keepalive
    socket.on('ping', () => socket.emit('pong'));
  });

  logger.info('✅ WebSocket initialisé');
  return io;
}

// ── Emetteurs d'événements (appelés depuis les services) ──────

export function emitNouvelleVente(entrepriseId: string, data: {
  factureId: string;
  numero: string;
  montant: number;
  clientNom?: string;
}) {
  getIo()?.to(`entreprise:${entrepriseId}`).emit('nouvelle_vente', data);
}

export function emitPaiementRecu(entrepriseId: string, data: {
  montant: number;
  methode: string;
  factureNumero?: string;
}) {
  getIo()?.to(`entreprise:${entrepriseId}`).emit('paiement_recu', data);
}

export function emitAlertStock(entrepriseId: string, data: {
  produitId: string;
  produitNom: string;
  stockActuel: number;
  stockMinimum: number;
}) {
  getIo()?.to(`entreprise:${entrepriseId}`).emit('alerte_stock', data);
}

export function emitMiseAJourDashboard(entrepriseId: string) {
  getIo()?.to(`entreprise:${entrepriseId}`).emit('dashboard_update');
}

export function getIo(): Server | undefined {
  return io;
}
