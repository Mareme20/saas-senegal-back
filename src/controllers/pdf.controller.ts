import { NextFunction, Request, Response } from 'express';
import { factureService } from '../services/facture.service';
import { PdfService } from '../services/pdf/facture.pdf';

export class PdfController {
  static async facture(req: Request, res: Response, next: NextFunction) {
    try {
      const facture = await factureService.findById(req.params.id, req.user!.entrepriseId);
      const pdfBuffer = await PdfService.genererFacture(facture as any);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${facture.numero}.pdf"`);
      res.send(pdfBuffer);
    } catch (e) { next(e); }
  }
}
