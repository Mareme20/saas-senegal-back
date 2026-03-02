import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '../entities';
import { CategorieController } from '../controllers/categorie.controller';

export const categorieRoutes = Router();
categorieRoutes.use(authenticate);
categorieRoutes.get('/', CategorieController.list);
categorieRoutes.post('/', authorize(Role.GERANT), CategorieController.create);
categorieRoutes.put('/:id', authorize(Role.GERANT), CategorieController.update);
categorieRoutes.delete('/:id', authorize(Role.GERANT), CategorieController.delete);
