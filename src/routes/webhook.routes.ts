import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

export const webhookRoutes = Router();
webhookRoutes.post('/wave', WebhookController.wave);
webhookRoutes.post('/orange', WebhookController.orange);
webhookRoutes.get('/whatsapp', WebhookController.whatsappVerify);
webhookRoutes.post('/whatsapp', WebhookController.whatsappReceive);
