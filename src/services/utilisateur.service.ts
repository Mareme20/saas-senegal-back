import bcrypt from 'bcryptjs';
import { Role } from '../entities';
import { TypeOrmUtilisateurRepository } from '../repositories/implementations';
import { CreateUtilisateurInput, IUtilisateurRepository } from '../repositories/interfaces';
import { ApiError } from '../utils/ApiError';

export class UtilisateurService {
  constructor(private readonly utilisateurRepository: IUtilisateurRepository) {}

  findAll(entrepriseId: string) {
    return this.utilisateurRepository.findAll(entrepriseId);
  }

  async findById(id: string, entrepriseId: string) {
    const utilisateur = await this.utilisateurRepository.findById(id, entrepriseId);
    if (!utilisateur) throw ApiError.notFound('Utilisateur introuvable');
    return utilisateur;
  }

  async create(entrepriseId: string, data: CreateUtilisateurInput) {
    const existing = await this.utilisateurRepository.findByEmail(data.email, entrepriseId);
    if (existing) throw ApiError.conflict('Un utilisateur avec cet email existe déjà');

    const hash = await bcrypt.hash(data.motDePasse, 12);
    const utilisateur = await this.utilisateurRepository.create(entrepriseId, {
      ...data,
      motDePasse: hash,
    });

    const { motDePasse, refreshToken, ...safe } = utilisateur as any;
    return safe;
  }

  async update(
    id: string,
    entrepriseId: string,
    data: Partial<{ prenom: string; nom: string; telephone: string; role: Role; actif: boolean }>,
  ) {
    const utilisateur = await this.utilisateurRepository.update(id, entrepriseId, data);
    if (!utilisateur) throw ApiError.notFound('Utilisateur introuvable');
    return utilisateur;
  }

  async changerMotDePasse(id: string, entrepriseId: string, ancien: string, nouveau: string) {
    const utilisateur = await this.utilisateurRepository.findWithPassword(id, entrepriseId);
    if (!utilisateur) throw ApiError.notFound('Utilisateur introuvable');

    const valide = await bcrypt.compare(ancien, utilisateur.motDePasse);
    if (!valide) throw ApiError.badRequest('Ancien mot de passe incorrect');

    const hash = await bcrypt.hash(nouveau, 12);
    await this.utilisateurRepository.updatePassword(id, hash);
  }

  async supprimer(id: string, entrepriseId: string, demandeurId: string) {
    if (id === demandeurId) throw ApiError.badRequest('Vous ne pouvez pas supprimer votre propre compte');

    const deleted = await this.utilisateurRepository.softDelete(id, entrepriseId);
    if (!deleted) throw ApiError.notFound('Utilisateur introuvable');
  }
}

export const utilisateurService = new UtilisateurService(new TypeOrmUtilisateurRepository());
