import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '../entities';
import { FournisseurController } from '../controllers/fournisseur.controller';

export const fournisseurRoutes = Router();
fournisseurRoutes.use(authenticate);
fournisseurRoutes.get('/', FournisseurController.list);
fournisseurRoutes.get('/:id', FournisseurController.getById);
fournisseurRoutes.post('/', authorize(Role.GERANT), FournisseurController.create);
fournisseurRoutes.put('/:id', authorize(Role.GERANT), FournisseurController.update);
fournisseurRoutes.delete('/:id', authorize(Role.GERANT), FournisseurController.delete);
