import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { fournisseurService } from '../services/fournisseur.service';
import { ApiResponse } from '../utils/ApiResponse';

const createFournisseurSchema = z.object({
  nom: z.string().min(1).max(100),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  ninea: z.string().optional(),
  notes: z.string().optional(),
});

export class FournisseurController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await fournisseurService.findAll(req.user!.entrepriseId, req.query as any);
      ApiResponse.paginated(res, r.fournisseurs, r.meta);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(res, await fournisseurService.findById(req.params.id, req.user!.entrepriseId));
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.created(res, await fournisseurService.create(req.user!.entrepriseId, createFournisseurSchema.parse(req.body)));
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(res, await fournisseurService.update(req.params.id, req.user!.entrepriseId, req.body));
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await fournisseurService.delete(req.params.id, req.user!.entrepriseId);
      ApiResponse.noContent(res);
    } catch (e) { next(e); }
  }
}
