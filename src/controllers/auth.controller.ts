import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';

const registerSchema = z.object({
  nomEntreprise: z.string().min(2, 'Nom trop court').max(100),
  prenom: z.string().min(1).max(50),
  nom: z.string().min(1).max(50),
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  telephone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  motDePasse: z.string().min(1),
  entrepriseId: z.string().uuid('ID entreprise invalide'),
});

export class AuthController {

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      ApiResponse.created(res, result, 'Compte créé avec succès');
    } catch (err) { next(err); }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      ApiResponse.success(res, result, 'Connexion réussie');
    } catch (err) { next(err); }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
      const tokens = await authService.refreshTokens(refreshToken);
      ApiResponse.success(res, tokens, 'Token renouvelé');
    } catch (err) { next(err); }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.userId);
      ApiResponse.noContent(res);
    } catch (err) { next(err); }
  }

  static async me(req: Request, res: Response) {
    ApiResponse.success(res, req.user, 'Profil utilisateur');
  }
}
