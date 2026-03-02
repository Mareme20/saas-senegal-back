import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { MobileMoneyController } from '../controllers/mobile-money.controller';

export const mobileMoneyRoutes = Router();
mobileMoneyRoutes.use(authenticate);
mobileMoneyRoutes.post('/wave/initier', MobileMoneyController.initWave);
mobileMoneyRoutes.post('/orange/initier', MobileMoneyController.initOrange);
