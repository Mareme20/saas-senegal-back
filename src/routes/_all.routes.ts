import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { ClientController } from '../controllers/client.controller';
import { FactureController } from '../controllers/facture.controller';
import { PaiementController } from '../controllers/paiement.controller';
import { EntrepriseController } from '../controllers/entreprise.controller';
import { StockController } from '../controllers/stock.controller';
import { DashboardController } from '../controllers/dashboard.controller';

// ─── FACTURES ────────────────────────────────────────────────
export const factureRoutes = Router();
factureRoutes.use(authenticate);

factureRoutes.get('/', FactureController.list);
factureRoutes.get('/:id', FactureController.getById);
factureRoutes.post('/', FactureController.create);
factureRoutes.patch('/:id/statut', FactureController.changeStatut);

// ─── CLIENTS ─────────────────────────────────────────────────
export const clientRoutes = Router();
clientRoutes.use(authenticate);

clientRoutes.get('/', ClientController.list);
clientRoutes.get('/:id', ClientController.getById);
clientRoutes.post('/', ClientController.create);
clientRoutes.put('/:id', ClientController.update);

// ─── STOCK ───────────────────────────────────────────────────
export const stockRoutes = Router();
stockRoutes.use(authenticate);

stockRoutes.get('/mouvements', StockController.mouvements);

// ─── DASHBOARD ────────────────────────────────────────────────
export const dashboardRoutes = Router();
dashboardRoutes.use(authenticate);

dashboardRoutes.get('/kpis', DashboardController.kpis);
dashboardRoutes.get('/ventes', DashboardController.ventes);
dashboardRoutes.get('/top-produits', DashboardController.topProduits);

// ─── PAIEMENTS ───────────────────────────────────────────────
export const paiementRoutes = Router();
paiementRoutes.use(authenticate);

paiementRoutes.get('/', PaiementController.list);
paiementRoutes.post('/', PaiementController.create);

// ─── ENTREPRISE ───────────────────────────────────────────────
export const entrepriseRoutes = Router();

entrepriseRoutes.get('/public/liste', EntrepriseController.listPublic);

entrepriseRoutes.use(authenticate);

entrepriseRoutes.get('/', EntrepriseController.getCurrent);
entrepriseRoutes.put('/', EntrepriseController.updateCurrent);
