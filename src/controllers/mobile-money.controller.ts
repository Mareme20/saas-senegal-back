import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { factureService } from '../services/facture.service';
import { OrangeMoneyService } from '../services/payments/orange-money.service';
import { WaveService } from '../services/payments/wave.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

export class MobileMoneyController {
  static async initWave(req: Request, res: Response, next: NextFunction) {
    try {
      const { factureId, redirectUrl } = z.object({
        factureId: z.string().uuid(),
        redirectUrl: z.string().optional(),
      }).parse(req.body);

      const facture = await factureService.findById(factureId, req.user!.entrepriseId);
      const resteAPayer = Number(facture.montantTotal) - Number(facture.montantPaye);
      if (resteAPayer <= 0) throw ApiError.badRequest('Cette facture est déjà payée');

      const session = await WaveService.creerSession({
        montant: resteAPayer,
        reference: factureId,
        description: `Facture ${facture.numero}`,
        redirectUrl,
      });

      ApiResponse.success(res, {
        sessionId: session.id,
        waveUrl: session.wave_launch_url,
        montant: resteAPayer,
      });
    } catch (e) { next(e); }
  }

  static async initOrange(req: Request, res: Response, next: NextFunction) {
    try {
      const { factureId } = z.object({ factureId: z.string().uuid() }).parse(req.body);
      const facture = await factureService.findById(factureId, req.user!.entrepriseId);
      const resteAPayer = Number(facture.montantTotal) - Number(facture.montantPaye);

      const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 4000}`;
      const result = await OrangeMoneyService.initierPaiement({
        montant: resteAPayer,
        reference: factureId,
        notifUrl: `${baseUrl}/api/v1/webhooks/orange`,
        returnUrl: `${baseUrl}/paiement/succes`,
        cancelUrl: `${baseUrl}/paiement/annule`,
      });

      ApiResponse.success(res, result);
    } catch (e) { next(e); }
  }
}
