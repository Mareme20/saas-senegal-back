import { NextFunction, Request, Response } from 'express';
import { RapportService } from '../services/rapport.service';
import { ApiResponse } from '../utils/ApiResponse';

export class RapportController {
  static async getVentesPeriode(req: Request, res: Response, next: NextFunction) {
    try {
      const { dateDebut, dateFin, groupePar } = req.query;
      const result = await RapportService.getVentesPeriode(
        req.user!.entrepriseId,
        new Date(dateDebut as string),
        new Date(dateFin as string),
        (groupePar as 'jour' | 'semaine' | 'mois') || 'jour'
      );
      ApiResponse.success(res, result);
    } catch (e) { next(e); }
  }

  static async getRentabilite(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RapportService.getRentabilite(req.user!.entrepriseId);
      ApiResponse.success(res, result);
    } catch (e) { next(e); }
  }

  static async getCreances(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RapportService.getCreances(req.user!.entrepriseId);
      ApiResponse.success(res, result);
    } catch (e) { next(e); }
  }

  static async getCharges(req: Request, res: Response, next: NextFunction) {
    try {
      const { dateDebut, dateFin } = req.query;
      const result = await RapportService.getCharges(
        req.user!.entrepriseId,
        new Date(dateDebut as string),
        new Date(dateFin as string)
      );
      ApiResponse.success(res, result);
    } catch (e) { next(e); }
  }

  static async getCAMensuel(req: Request, res: Response, next: NextFunction) {
    try {
      const annee = req.query.annee ? parseInt(req.query.annee as string) : new Date().getFullYear();
      const result = await RapportService.getCAMensuel(req.user!.entrepriseId, annee);
      ApiResponse.success(res, result);
    } catch (e) { next(e); }
  }

  static async getRapprochement(req: Request, res: Response, next: NextFunction) {
    try {
      const { dateDebut, dateFin } = req.query;
      const result = await RapportService.getRapprochement(
        req.user!.entrepriseId,
        new Date(dateDebut as string),
        new Date(dateFin as string)
      );
      ApiResponse.success(res, result);
    } catch (e) { next(e); }
  }
}

