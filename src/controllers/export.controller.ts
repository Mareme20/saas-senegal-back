import { NextFunction, Request, Response } from 'express';
import { ExportService } from '../services/export.service';

export class ExportController {
  static async exportFactures(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as 'excel' | 'csv') || 'excel';
      await ExportService.exportFactures(req.user!.entrepriseId, format, res);
    } catch (e) { next(e); }
  }

  static async exportClients(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as 'excel' | 'csv') || 'excel';
      await ExportService.exportClients(req.user!.entrepriseId, format, res);
    } catch (e) { next(e); }
  }

  static async exportProduits(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as 'excel' | 'csv') || 'excel';
      await ExportService.exportProduits(req.user!.entrepriseId, format, res);
    } catch (e) { next(e); }
  }

  static async exportFournisseurs(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as 'excel' | 'csv') || 'excel';
      await ExportService.exportFournisseurs(req.user!.entrepriseId, format, res);
    } catch (e) { next(e); }
  }

  static async exportGrandLivre(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as 'excel' | 'csv') || 'excel';
      const exercice = req.query.exercice ? parseInt(req.query.exercice as string) : undefined;
      await ExportService.exportGrandLivre(req.user!.entrepriseId, format, res, exercice);
    } catch (e) { next(e); }
  }
}

