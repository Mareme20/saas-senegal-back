import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '../entities';
import { ComptabiliteController } from '../controllers/comptabilite.controller';

export const comptaRoutes = Router();
comptaRoutes.use(authenticate, authorize(Role.GERANT, Role.COMPTABLE));
comptaRoutes.get('/grand-livre', ComptabiliteController.grandLivre);
comptaRoutes.get('/balance', ComptabiliteController.balance);
comptaRoutes.get('/compte-resultat', ComptabiliteController.compteResultat);
