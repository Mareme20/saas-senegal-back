import { Role, Utilisateur } from '../../entities';

export interface CreateUtilisateurInput {
  email: string;
  motDePasse: string;
  prenom: string;
  nom: string;
  role: Role;
  telephone?: string;
}

export interface IUtilisateurRepository {
  findAll(entrepriseId: string): Promise<Utilisateur[]>;
  findById(id: string, entrepriseId: string): Promise<Utilisateur | null>;
  findByEmail(email: string, entrepriseId: string): Promise<Utilisateur | null>;
  create(entrepriseId: string, data: CreateUtilisateurInput): Promise<Utilisateur>;
  update(id: string, entrepriseId: string, data: Partial<{ prenom: string; nom: string; telephone: string; role: Role; actif: boolean }>): Promise<Utilisateur | null>;
  findWithPassword(id: string, entrepriseId: string): Promise<Utilisateur | null>;
  updatePassword(id: string, hash: string): Promise<void>;
  softDelete(id: string, entrepriseId: string): Promise<boolean>;
}
