import { AppDataSource } from '../../config/database';
import { Utilisateur } from '../../entities';
import { CreateUtilisateurInput, IUtilisateurRepository } from '../interfaces';

export class TypeOrmUtilisateurRepository implements IUtilisateurRepository {
  private readonly repo = AppDataSource.getRepository(Utilisateur);

  findAll(entrepriseId: string): Promise<Utilisateur[]> {
    return this.repo.find({
      where: { entrepriseId },
      order: { createdAt: 'ASC' },
      select: ['id', 'email', 'prenom', 'nom', 'role', 'telephone', 'actif', 'dernierLogin', 'createdAt'],
    });
  }

  findById(id: string, entrepriseId: string): Promise<Utilisateur | null> {
    return this.repo.findOne({
      where: { id, entrepriseId },
      select: ['id', 'email', 'prenom', 'nom', 'role', 'telephone', 'actif', 'dernierLogin', 'createdAt'],
    });
  }

  findByEmail(email: string, entrepriseId: string): Promise<Utilisateur | null> {
    return this.repo.findOneBy({ email, entrepriseId });
  }

  create(entrepriseId: string, data: CreateUtilisateurInput): Promise<Utilisateur> {
    const utilisateur = this.repo.create({ ...data, entrepriseId });
    return this.repo.save(utilisateur);
  }

  async update(
    id: string,
    entrepriseId: string,
    data: Partial<{ prenom: string; nom: string; telephone: string; role: any; actif: boolean }>,
  ): Promise<Utilisateur | null> {
    await this.repo.update({ id, entrepriseId }, data);
    return this.findById(id, entrepriseId);
  }

  findWithPassword(id: string, entrepriseId: string): Promise<Utilisateur | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.motDePasse')
      .where('u.id = :id AND u.entrepriseId = :entrepriseId', { id, entrepriseId })
      .getOne();
  }

  async updatePassword(id: string, hash: string): Promise<void> {
    await this.repo.update(id, { motDePasse: hash });
  }

  async softDelete(id: string, entrepriseId: string): Promise<boolean> {
    const result = await this.repo.update({ id, entrepriseId }, { actif: false });
    return Boolean(result.affected && result.affected > 0);
  }
}
