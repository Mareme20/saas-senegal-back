import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Erreurs opérationnelles connues
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
...(err.details ? { details: err.details } : {} as object),
    });
    return;
  }

  // Erreurs de validation Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Données invalides',
      details: err.errors.map((e) => ({ champ: e.path.join('.'), message: e.message })),
    });
    return;
  }

  // Erreurs TypeORM
  if (err instanceof QueryFailedError) {
    const detail = (err as any).detail || '';
    if ((err as any).code === '23505') {
      res.status(409).json({ success: false, message: 'Cette valeur existe déjà.' + (detail ? ` (${detail})` : '') });
      return;
    }
    if ((err as any).code === '23503') {
      res.status(400).json({ success: false, message: 'Référence invalide — enregistrement lié introuvable.' });
      return;
    }
  }

  if (err instanceof EntityNotFoundError) {
    res.status(404).json({ success: false, message: 'Enregistrement introuvable.' });
    return;
  }

  // Erreur inconnue — log complet
  logger.error({ err, req: { method: req.method, url: req.url, body: req.body } }, 'Erreur non gérée');

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
  });
}
