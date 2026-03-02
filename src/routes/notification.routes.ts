import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '../entities';
import { NotificationController } from '../controllers/notification.controller';

export const notifRoutes = Router();
notifRoutes.use(authenticate, authorize(Role.GERANT, Role.CAISSIER));
notifRoutes.post('/facture/:id/envoyer-sms', NotificationController.envoyerFactureSms);
notifRoutes.post('/facture/:id/envoyer-whatsapp', NotificationController.envoyerFactureWhatsapp);
