import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { stockService } from '../services/stock.service';
import { ApiResponse } from '../utils/ApiResponse';

const stockQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export class StockController {
  static async mouvements(req: Request, res: Response, next: NextFunction) {
    try {
      const query = stockQuerySchema.parse(req.query);
      const mouvements = await stockService.findMouvements(req.user!.entrepriseId, query);
      ApiResponse.success(res, mouvements);
    } catch (e) { next(e); }
  }
}
