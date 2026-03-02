import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, Utilisateur } from '../entities';
import { AuthPayload } from '../middlewares/auth.middleware';
import { TypeOrmAuthRepository } from '../repositories/implementations';
import { IAuthRepository } from '../repositories/interfaces';
import { ApiError } from '../utils/ApiError';

interface RegisterInput {
  nomEntreprise: string;
  email: string;
  motDePasse: string;
  prenom: string;
  nom: string;
  telephone?: string;
}

interface LoginInput {
  email: string;
  motDePasse: string;
  entrepriseId: string;
}

export class AuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  async register(input: RegisterInput) {
    const { nomEntreprise, email, motDePasse, prenom, nom, telephone } = input;

    const motDePasseHash = await bcrypt.hash(motDePasse, 12);

    const created = await this.authRepository.createEntrepriseAndGerant({
      nomEntreprise,
      email,
      prenom,
      nom,
      telephone,
      motDePasseHash,
    });

    const tokens = this.generateTokens(created.gerant.id, created.entreprise.id, created.gerant.role, created.gerant.email);
    await this.authRepository.updateRefreshToken(created.gerant.id, await bcrypt.hash(tokens.refreshToken, 8));

    return {
      entreprise: { id: created.entreprise.id, nom: created.entreprise.nom },
      utilisateur: this.sanitize(created.gerant),
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    const { email, motDePasse, entrepriseId } = input;

    const utilisateur = await this.authRepository.findActiveUserForLogin(email, entrepriseId);
    if (!utilisateur) throw ApiError.unauthorized('Email ou mot de passe incorrect');

    const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!valide) throw ApiError.unauthorized('Email ou mot de passe incorrect');

    const tokens = this.generateTokens(utilisateur.id, entrepriseId, utilisateur.role, utilisateur.email);
    await this.authRepository.updateSessionAfterLogin(
      utilisateur.id,
      await bcrypt.hash(tokens.refreshToken, 8),
      new Date(),
    );

    return {
      utilisateur: this.sanitize(utilisateur),
      entreprise: {
        id: utilisateur.entreprise.id,
        nom: utilisateur.entreprise.nom,
        plan: utilisateur.entreprise.plan,
        logo: utilisateur.entreprise.logo,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: AuthPayload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as AuthPayload;
    } catch {
      throw ApiError.unauthorized('Refresh token invalide');
    }

    const utilisateur = await this.authRepository.findUserWithRefreshToken(payload.userId);
    if (!utilisateur?.refreshToken) throw ApiError.unauthorized('Session expirée');

    const valide = await bcrypt.compare(refreshToken, utilisateur.refreshToken);
    if (!valide) throw ApiError.unauthorized('Refresh token invalide');

    const tokens = this.generateTokens(utilisateur.id, utilisateur.entrepriseId, utilisateur.role, utilisateur.email);
    await this.authRepository.updateRefreshToken(utilisateur.id, await bcrypt.hash(tokens.refreshToken, 8));

    return tokens;
  }

  async logout(userId: string) {
    await this.authRepository.clearRefreshToken(userId);
  }

  private generateTokens(userId: string, entrepriseId: string, role: Role, email: string) {
    const payload: AuthPayload = { userId, entrepriseId, role, email };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as any);
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    } as any);
    return { accessToken, refreshToken };
  }

  private sanitize(u: Utilisateur) {
    return { id: u.id, email: u.email, prenom: u.prenom, nom: u.nom, role: u.role, telephone: u.telephone };
  }
}

export const authService = new AuthService(new TypeOrmAuthRepository());
