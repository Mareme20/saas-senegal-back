import { NextFunction, Request, Response } from 'express';
import { changeFactureStatutSchema, createFactureSchema } from '../dtos/facture.dto';
import { factureService } from '../services/facture.service';
import { ApiResponse } from '../utils/ApiResponse';
import { TypeFacture } from '../entities/Facture';

export class FactureController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await factureService.findAll(req.user!.entrepriseId, req.query as any);
      ApiResponse.paginated(res, r.factures, r.meta);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(res, await factureService.findById(req.params.id, req.user!.entrepriseId));
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFactureSchema.parse(req.body);
      const facture = await factureService.create(req.user!.entrepriseId, req.user!.userId, data as any);
      ApiResponse.created(res, facture, 'Facture créée');
    } catch (e) { next(e); }
  }

  static async changeStatut(req: Request, res: Response, next: NextFunction) {
    try {
      const { statut } = changeFactureStatutSchema.parse(req.body);
      ApiResponse.success(res, await factureService.changerStatut(req.params.id, req.user!.entrepriseId, statut));
    } catch (e) { next(e); }
  }

  static async transformer(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.body;
      const targetType = type === 'FACTURE' ? TypeFacture.FACTURE : TypeFacture.BON_COMMANDE;
      const facture = await factureService.transformer(
        req.params.id,
        req.user!.entrepriseId,
        req.user!.userId,
        targetType
      );
      ApiResponse.created(res, facture, type === 'FACTURE' ? 'Devis transformé en facture' : 'Devis transformé en bon de commande');
    } catch (e) { next(e); }
  }

  static async signer(req: Request, res: Response, next: NextFunction) {
    try {
      const { signature } = req.body;
      if (!signature) {
        return ApiResponse.success(res, null, 'Signature requise', 400);
      }
      const result = await factureService.signer(req.params.id, req.user!.entrepriseId, signature);
      ApiResponse.success(res, result, 'Document signé avec succès');
    } catch (e) { next(e); }
  }
}
