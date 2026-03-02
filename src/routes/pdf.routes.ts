import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { PdfController } from '../controllers/pdf.controller';

export const pdfRoutes = Router();
pdfRoutes.use(authenticate);
pdfRoutes.get('/factures/:id', PdfController.facture);
