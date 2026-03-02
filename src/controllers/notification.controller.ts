import { NextFunction, Request, Response } from 'express';
import { WhatsAppService } from '../services/notifications/whatsapp.service';
import { smsService } from '../services/notifications/sms.service';
import { factureService } from '../services/facture.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

export class NotificationController {
  static async envoyerFactureSms(req: Request, res: Response, next: NextFunction) {
    try {
      const facture = await factureService.findById(req.params.id, req.user!.entrepriseId);
      const telephone = facture.client?.telephone;
      if (!telephone) throw ApiError.badRequest('Ce client n\'a pas de numéro de téléphone');

      await smsService.envoyerFacture(telephone, facture.numero, Number(facture.montantTotal));
      ApiResponse.success(res, null, 'SMS envoyé');
    } catch (e) { next(e); }
  }

  static async envoyerFactureWhatsapp(req: Request, res: Response, next: NextFunction) {
    try {
      const facture = await factureService.findById(req.params.id, req.user!.entrepriseId);
      const telephone = facture.client?.telephone;
      if (!telephone) throw ApiError.badRequest('Ce client n\'a pas de numéro de téléphone');

      await WhatsAppService.envoyerFacture(telephone, {
        clientNom: facture.client!.nom,
        numero: facture.numero,
        montant: Number(facture.montantTotal),
        entrepriseNom: facture.entreprise?.nom || '',
      });
      ApiResponse.success(res, null, 'Message WhatsApp envoyé');
    } catch (e) { next(e); }
  }
}
