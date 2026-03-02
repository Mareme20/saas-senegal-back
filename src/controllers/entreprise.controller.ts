import { NextFunction, Request, Response } from 'express';
import { updateEntrepriseSchema } from '../dtos/entreprise.dto';
import { entrepriseService } from '../services/entreprise.service';
import { ApiResponse } from '../utils/ApiResponse';

export class EntrepriseController {
  static async listPublic(_req: Request, res: Response, next: NextFunction) {
    try {
      const entreprises = await entrepriseService.getPublicList();
      res.json({ success: true, data: entreprises });
    } catch (err) { next(err); }
  }

  static async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(res, await entrepriseService.findById(req.user!.entrepriseId));
    } catch (err) { next(err); }
  }

  static async updateCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateEntrepriseSchema.parse(req.body);
      ApiResponse.success(res, await entrepriseService.update(req.user!.entrepriseId, data), 'Entreprise mise à jour');
    } catch (err) { next(err); }
  }
}
