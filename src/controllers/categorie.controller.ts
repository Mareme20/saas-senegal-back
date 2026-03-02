import { NextFunction, Request, Response } from 'express';
import { createCategorieSchema, updateCategorieSchema } from '../dtos/categorie.dto';
import { categorieService } from '../services/categorie.service';
import { ApiResponse } from '../utils/ApiResponse';

export class CategorieController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(res, await categorieService.findAll(req.user!.entrepriseId));
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createCategorieSchema.parse(req.body);
      ApiResponse.created(res, await categorieService.create(req.user!.entrepriseId, payload));
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = updateCategorieSchema.parse(req.body);
      ApiResponse.success(res, await categorieService.update(req.params.id, req.user!.entrepriseId, payload));
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await categorieService.delete(req.params.id, req.user!.entrepriseId);
      ApiResponse.noContent(res);
    } catch (e) { next(e); }
  }
}
