import { NextFunction, Request, Response } from 'express';
import { comptabiliteService } from '../services/comptabilite.service';
import { ApiResponse } from '../utils/ApiResponse';

export class ComptabiliteController {
  static async grandLivre(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await comptabiliteService.getGrandLivre(req.user!.entrepriseId, req.query as any);
      ApiResponse.success(res, r);
    } catch (e) { next(e); }
  }

  static async balance(req: Request, res: Response, next: NextFunction) {
    try {
      const { dateDebut, dateFin } = req.query as { dateDebut?: string; dateFin?: string };
      ApiResponse.success(res, await comptabiliteService.getBalance(req.user!.entrepriseId, dateDebut, dateFin));
    } catch (e) { next(e); }
  }

  static async compteResultat(req: Request, res: Response, next: NextFunction) {
    try {
      const exercice = Number(req.query.exercice) || new Date().getFullYear();
      ApiResponse.success(res, await comptabiliteService.getCompteResultat(req.user!.entrepriseId, exercice));
    } catch (e) { next(e); }
  }
}
