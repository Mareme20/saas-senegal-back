import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '../entities';
import { UtilisateurController } from '../controllers/utilisateur.controller';

export const utilisateurRoutes = Router();
utilisateurRoutes.use(authenticate);
utilisateurRoutes.get('/', authorize(Role.GERANT), UtilisateurController.list);
utilisateurRoutes.post('/', authorize(Role.GERANT), UtilisateurController.create);
utilisateurRoutes.put('/:id', authorize(Role.GERANT), UtilisateurController.update);
utilisateurRoutes.patch('/mot-de-passe', UtilisateurController.changePassword);
utilisateurRoutes.delete('/:id', authorize(Role.GERANT), UtilisateurController.delete);
