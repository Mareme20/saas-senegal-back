import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { Role, TypeMouvement } from '../entities';
import { produitService } from '../services/produit.service';
import { ApiResponse } from '../utils/ApiResponse';

const createProduitSchema = z.object({
  nom: z.string().min(1).max(200),
  prixVente: z.number().positive(),
  prixAchat: z.number().positive().optional(),
  tva: z.number().min(0).max(100).optional(),
  unite: z.string().optional(),
  stockActuel: z.number().min(0).optional(),
  stockMinimum: z.number().min(0).optional(),
  reference: z.string().optional(),
  codeBarres: z.string().optional(),
  categorieId: z.string().uuid().optional(),
  description: z.string().optional(),
});

const ajusterStockSchema = z.object({
  quantite: z.number().positive(),
  type: z.nativeEnum(TypeMouvement),
  motif: z.string().optional(),
});

export class ProduitController {
  static readonly rolesEdit = [Role.GERANT, Role.CAISSIER] as const;

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await produitService.findAll(req.user!.entrepriseId, req.query as any);
      ApiResponse.paginated(res, result.produits, result.meta);
    } catch (e) { next(e); }
  }

  static async alertes(req: Request, res: Response, next: NextFunction) {
    try {
      const alertes = await produitService.getAlertes(req.user!.entrepriseId);
      ApiResponse.success(res, alertes);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const produit = await produitService.findById(req.params.id, req.user!.entrepriseId);
      ApiResponse.success(res, produit);
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProduitSchema.parse(req.body);
      const produit = await produitService.create(req.user!.entrepriseId, data);
      ApiResponse.created(res, produit, 'Produit créé');
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const produit = await produitService.update(req.params.id, req.user!.entrepriseId, req.body);
      ApiResponse.success(res, produit, 'Produit mis à jour');
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await produitService.delete(req.params.id, req.user!.entrepriseId);
      ApiResponse.noContent(res);
    } catch (e) { next(e); }
  }

  static async ajusterStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { quantite, type, motif } = ajusterStockSchema.parse(req.body);
      const produit = await produitService.ajusterStock(req.params.id, req.user!.entrepriseId, quantite, type, motif);
      ApiResponse.success(res, produit, 'Stock ajusté');
    } catch (e) { next(e); }
  }
}
