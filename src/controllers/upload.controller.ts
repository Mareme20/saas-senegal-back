import { NextFunction, Request, Response } from 'express';
import { updateLogoSchema, updateProduitImageSchema } from '../dtos/upload.dto';
import { uploadService } from '../services/upload.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

export class UploadController {
  static async logo(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw ApiError.badRequest('Aucun fichier reçu');
      const url = `/uploads/${req.file.filename}`;
      const payload = updateLogoSchema.parse({ entrepriseId: req.user!.entrepriseId, url });
      await uploadService.updateEntrepriseLogo(payload);
      ApiResponse.success(res, { url }, 'Logo mis à jour');
    } catch (e) { next(e); }
  }

  static async produitImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw ApiError.badRequest('Aucun fichier reçu');
      const url = `/uploads/${req.file.filename}`;
      const payload = updateProduitImageSchema.parse({
        entrepriseId: req.user!.entrepriseId,
        produitId: req.params.id,
        url,
      });
      await uploadService.updateProduitImage(payload);
      ApiResponse.success(res, { url }, 'Image mise à jour');
    } catch (e) { next(e); }
  }
}
