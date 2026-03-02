import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { Role } from '../entities';

export interface AuthPayload {
  userId: string;
  entrepriseId: string;
  role: Role;
  email: string;
}

// Extension du type Request Express
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return next(ApiError.unauthorized('Token manquant'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(ApiError.unauthorized('Token invalide ou expiré'));
  }
}

// Autorisation par rôle
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Accès réservé aux rôles: ${roles.join(', ')}`));
    }
    next();
  };
}

// Vérifie que la ressource appartient bien au tenant de l'utilisateur
export function sameTenant(req: Request, _res: Response, next: NextFunction) {
  const entrepriseId = req.params.entrepriseId || req.body.entrepriseId;
  if (entrepriseId && req.user && entrepriseId !== req.user.entrepriseId) {
    return next(ApiError.forbidden('Accès interdit à cette entreprise'));
  }
  next();
}
