import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { logger } from './config/logger';
import { getSwaggerHtml } from './config/swagger';
import { ApiError } from './utils/ApiError';
import { errorHandler } from './middlewares/errorHandler';

// Routes existantes
import authRoutes from './routes/auth.routes';
import produitRoutes from './routes/produit.routes';
import {
  factureRoutes, clientRoutes, stockRoutes,
  dashboardRoutes, paiementRoutes, entrepriseRoutes,
} from './routes/_all.routes';

// Nouvelles routes
import {
  utilisateurRoutes, categorieRoutes, fournisseurRoutes,
  comptaRoutes, pdfRoutes, mobileMoneyRoutes,
  webhookRoutes, uploadRoutes, notifRoutes,
} from './routes/extended.routes';

const app: Application = express();
const API = `/api/${process.env.API_VERSION || 'v1'}`;

// ── Sécurité ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Swagger UI injects inline/external assets; strict CSP blocks the docs page.
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Non autorisé par CORS'));
  },
  credentials: true,
}));

// ── Rate limiting ────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes, réessayez dans 15 minutes.' },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Trop de tentatives de connexion.' },
});

// ── Middlewares généraux ──────────────────────────────────────
app.use(compression());
// Webhooks ont besoin du raw body pour la vérification de signature
app.use(`${API}/webhooks`, express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Fichiers statiques (uploads) ─────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || './uploads')));

// ── Swagger/OpenAPI ──────────────────────────────────────────
app.get(`${API}/docs`, (_req: Request, res: Response) => {
  res.type('html').send(getSwaggerHtml(`${API}/docs/openapi.yaml`));
});
app.use(`${API}/docs`, express.static(path.join(process.cwd(), 'docs')));

// ── Logging HTTP ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ── Routes ───────────────────────────────────────────────────
app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/entreprise`, entrepriseRoutes);
app.use(`${API}/utilisateurs`, utilisateurRoutes);
app.use(`${API}/produits`, produitRoutes);
app.use(`${API}/categories`, categorieRoutes);
app.use(`${API}/clients`, clientRoutes);
app.use(`${API}/fournisseurs`, fournisseurRoutes);
app.use(`${API}/factures`, factureRoutes);
app.use(`${API}/paiements`, paiementRoutes);
app.use(`${API}/mobile-money`, mobileMoneyRoutes);
app.use(`${API}/stock`, stockRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/comptabilite`, comptaRoutes);
app.use(`${API}/pdf`, pdfRoutes);
app.use(`${API}/upload`, uploadRoutes);
app.use(`${API}/notif`, notifRoutes);
app.use(`${API}/webhooks`, webhookRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── Route inconnue ───────────────────────────────────────────
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, 'Route introuvable'));
});

app.use(errorHandler);

export default app;
