import { AppDataSource } from '../../config/database';
import { Fournisseur } from '../../entities/Fournisseur';
import { getPagination } from '../../utils/ApiResponse';
import { FournisseurQuery, IFournisseurRepository } from '../interfaces';

export class TypeOrmFournisseurRepository implements IFournisseurRepository {
  private readonly repo = AppDataSource.getRepository(Fournisseur);

  async findAll(entrepriseId: string, query: FournisseurQuery) {
    const { skip, take } = getPagination(query.page, query.limit);

    const qb = this.repo
      .createQueryBuilder('f')
      .where('f.entrepriseId = :e AND f.actif = true', { e: entrepriseId });

    if (query.search) qb.andWhere('f.nom ILIKE :s', { s: `%${query.search}%` });

    const [fournisseurs, total] = await qb.orderBy('f.nom').skip(skip).take(take).getManyAndCount();

    return {
      fournisseurs,
      total,
      page: query.page || 1,
      limit: query.limit || 20,
    };
  }

  findById(id: string, entrepriseId: string): Promise<Fournisseur | null> {
    return this.repo.findOneBy({ id, entrepriseId });
  }

  create(entrepriseId: string, data: Partial<Fournisseur>): Promise<Fournisseur> {
    const fournisseur = this.repo.create({ ...data, entrepriseId });
    return this.repo.save(fournisseur);
  }

  async update(id: string, entrepriseId: string, data: Partial<Fournisseur>): Promise<Fournisseur | null> {
    await this.repo.update({ id, entrepriseId }, data);
    return this.repo.findOneBy({ id, entrepriseId });
  }

  async softDelete(id: string, entrepriseId: string): Promise<boolean> {
    const result = await this.repo.update({ id, entrepriseId }, { actif: false });
    return Boolean(result.affected && result.affected > 0);
  }
}
