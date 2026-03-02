import { AppDataSource } from '../../config/database';
import { Entreprise, Role, Utilisateur } from '../../entities';
import {
  CreateEntrepriseAndGerantInput,
  CreateEntrepriseAndGerantResult,
  IAuthRepository,
} from '../interfaces';

export class TypeOrmAuthRepository implements IAuthRepository {
  private readonly userRepo = AppDataSource.getRepository(Utilisateur);

  createEntrepriseAndGerant(input: CreateEntrepriseAndGerantInput): Promise<CreateEntrepriseAndGerantResult> {
    return AppDataSource.transaction(async (manager) => {
      const entreprise = manager.create(Entreprise, { nom: input.nomEntreprise });
      await manager.save(entreprise);

      const gerant = manager.create(Utilisateur, {
        entrepriseId: entreprise.id,
        email: input.email,
        prenom: input.prenom,
        nom: input.nom,
        telephone: input.telephone,
        motDePasse: input.motDePasseHash,
        role: Role.GERANT,
        refreshToken: input.refreshTokenHash,
      });
      await manager.save(gerant);

      return { entreprise, gerant };
    });
  }

  findActiveUserForLogin(email: string, entrepriseId: string): Promise<Utilisateur | null> {
    return this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.motDePasse')
      .addSelect('u.refreshToken')
      .leftJoinAndSelect('u.entreprise', 'e')
      .where('u.email = :email AND u.entrepriseId = :entrepriseId AND u.actif = true', { email, entrepriseId })
      .getOne();
  }

  async updateSessionAfterLogin(userId: string, refreshTokenHash: string, dernierLogin: Date): Promise<void> {
    await this.userRepo.update(userId, { refreshToken: refreshTokenHash, dernierLogin });
  }

  findUserWithRefreshToken(userId: string): Promise<Utilisateur | null> {
    return this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.refreshToken')
      .where('u.id = :id', { id: userId })
      .getOne();
  }

  async updateRefreshToken(userId: string, refreshTokenHash: string): Promise<void> {
    await this.userRepo.update(userId, { refreshToken: refreshTokenHash });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.userRepo.update(userId, { refreshToken: undefined });
  }
}
