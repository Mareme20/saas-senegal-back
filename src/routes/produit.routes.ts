import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '../entities';
import { ProduitController } from '../controllers/produit.controller';

const router = Router();
router.use(authenticate);

router.get('/', ProduitController.list);
router.get('/alertes', ProduitController.alertes);
router.get('/:id', ProduitController.getById);
router.post('/', authorize(Role.GERANT, Role.CAISSIER), ProduitController.create);
router.put('/:id', authorize(Role.GERANT, Role.CAISSIER), ProduitController.update);
router.delete('/:id', authorize(Role.GERANT), ProduitController.delete);
router.post('/:id/stock', authorize(Role.GERANT, Role.CAISSIER), ProduitController.ajusterStock);

export default router;
