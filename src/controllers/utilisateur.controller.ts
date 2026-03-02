import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { Role } from '../entities';
import { utilisateurService } from '../services/utilisateur.service';
import { ApiResponse } from '../utils/ApiResponse';

const createUtilisateurSchema = z.object({
  email: z.string().email(),
  motDePasse: z.string().min(8),
  prenom: z.string().min(1),
  nom: z.string().min(1),
  role: z.nativeEnum(Role),
  telephone: z.string().optional(),
});

const updateUtilisateurSchema = z.object({
  prenom: z.string().optional(),
  nom: z.string().optional(),
  telephone: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  actif: z.boolean().optional(),
});

export class UtilisateurController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(res, await utilisateurService.findAll(req.user!.entrepriseId));
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUtilisateurSchema.parse(req.body);
      ApiResponse.created(res, await utilisateurService.create(req.user!.entrepriseId, data), 'Utilisateur créé');
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUtilisateurSchema.parse(req.body);
      ApiResponse.success(res, await utilisateurService.update(req.params.id, req.user!.entrepriseId, data));
    } catch (e) { next(e); }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { ancien, nouveau } = z.object({ ancien: z.string(), nouveau: z.string().min(8) }).parse(req.body);
      await utilisateurService.changerMotDePasse(req.user!.userId, req.user!.entrepriseId, ancien, nouveau);
      ApiResponse.success(res, null, 'Mot de passe mis à jour');
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await utilisateurService.supprimer(req.params.id, req.user!.entrepriseId, req.user!.userId);
      ApiResponse.noContent(res);
    } catch (e) { next(e); }
  }
}
