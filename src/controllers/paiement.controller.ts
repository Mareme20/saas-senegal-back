import { NextFunction, Request, Response } from 'express';
import { createPaiementSchema, listPaiementsQuerySchema } from '../dtos/paiement.dto';
import { paiementService } from '../services/paiement.service';
import { ApiResponse } from '../utils/ApiResponse';

export class PaiementController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listPaiementsQuerySchema.parse(req.query);
      ApiResponse.success(res, await paiementService.findAll(req.user!.entrepriseId, query));
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPaiementSchema.parse(req.body);
      const paiement = await paiementService.create(req.user!.entrepriseId, data);
      ApiResponse.created(res, paiement, 'Paiement enregistré');
    } catch (e) { next(e); }
  }
}
