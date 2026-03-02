import { NextFunction, Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../utils/ApiResponse';

export class DashboardController {
  static async kpis(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(res, await dashboardService.getKpis(req.user!.entrepriseId));
    } catch (e) { next(e); }
  }

  static async ventes(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(
        res,
        await dashboardService.getVentesParJour(req.user!.entrepriseId, Number(req.query.jours) || 30),
      );
    } catch (e) { next(e); }
  }

  static async topProduits(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(res, await dashboardService.getTopProduits(req.user!.entrepriseId));
    } catch (e) { next(e); }
  }
}
