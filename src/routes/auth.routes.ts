import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/v1/auth/register  — Créer compte entreprise
router.post('/register', AuthController.register);

// POST /api/v1/auth/login — Connexion
router.post('/login', AuthController.login);

// POST /api/v1/auth/refresh — Renouveler access token
router.post('/refresh', AuthController.refresh);

// POST /api/v1/auth/logout — Déconnexion (protégé)
router.post('/logout', authenticate, AuthController.logout);

// GET /api/v1/auth/me — Profil courant (protégé)
router.get('/me', authenticate, AuthController.me);

export default router;
