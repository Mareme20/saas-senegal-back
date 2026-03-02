import { Entreprise, Utilisateur } from '../../entities';
import { Role } from '../../entities';

export interface CreateEntrepriseAndGerantInput {
  nomEntreprise: string;
  email: string;
  prenom: string;
  nom: string;
  telephone?: string;
  motDePasseHash: string;
  refreshTokenHash?: string;
}

export interface CreateEntrepriseAndGerantResult {
  entreprise: Entreprise;
  gerant: Utilisateur;
}

export interface IAuthRepository {
  createEntrepriseAndGerant(input: CreateEntrepriseAndGerantInput): Promise<CreateEntrepriseAndGerantResult>;
  findActiveUserForLogin(email: string, entrepriseId: string): Promise<Utilisateur | null>;
  updateSessionAfterLogin(userId: string, refreshTokenHash: string, dernierLogin: Date): Promise<void>;
  findUserWithRefreshToken(userId: string): Promise<Utilisateur | null>;
  updateRefreshToken(userId: string, refreshTokenHash: string): Promise<void>;
  clearRefreshToken(userId: string): Promise<void>;
}
