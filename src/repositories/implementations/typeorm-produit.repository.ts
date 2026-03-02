import { AppDataSource } from '../../config/database';
import { MouvementStock, Produit, TypeMouvement } from '../../entities';
import { getPagination } from '../../utils/ApiResponse';
import { CreateProduitInput, IProduitRepository, ProduitQuery } from '../interfaces';

export class TypeOrmProduitRepository implements IProduitRepository {
  private readonly repo = AppDataSource.getRepository(Produit);

  async findAll(entrepriseId: string, query: ProduitQuery) {
    const { skip, take } = getPagination(query.page, query.limit);

    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categorie', 'c')
      .where('p.entrepriseId = :entrepriseId AND p.actif = true', { entrepriseId });

    if (query.search) {
      qb.andWhere('(p.nom ILIKE :s OR p.reference ILIKE :s OR p.codeBarres = :exact)', {
        s: `%${query.search}%`,
        exact: query.search,
      });
    }

    if (query.categorieId) qb.andWhere('p.categorieId = :cat', { cat: query.categorieId });
    if (query.stockBas === 'true') qb.andWhere('p.stockActuel <= p.stockMinimum');

    const [produits, total] = await qb.orderBy('p.nom', 'ASC').skip(skip).take(take).getManyAndCount();

    return {
      produits,
      total,
      page: query.page || 1,
      limit: query.limit || 20,
    };
  }

  findByIdWithRelations(id: string, entrepriseId: string): Promise<Produit | null> {
    return this.repo.findOne({
      where: { id, entrepriseId },
      relations: ['categorie', 'mouvementsStock'],
      order: { mouvementsStock: { createdAt: 'DESC' } },
    });
  }

  createWithInitialStock(entrepriseId: string, data: CreateProduitInput): Promise<Produit> {
    return AppDataSource.transaction(async (manager) => {
      const produit = manager.create(Produit, { ...data, entrepriseId });
      await manager.save(produit);

      if (data.stockActuel && data.stockActuel > 0) {
        const mvt = manager.create(MouvementStock, {
          produitId: produit.id,
          type: TypeMouvement.ENTREE,
          quantite: data.stockActuel,
          quantiteAvant: 0,
          quantiteApres: data.stockActuel,
          motif: 'Stock initial',
        });
        await manager.save(mvt);
      }

      return produit;
    });
  }

  async updateById(id: string, entrepriseId: string, data: Partial<CreateProduitInput>): Promise<Produit | null> {
    await this.repo.update({ id, entrepriseId }, data as any);
    return this.repo.findOneBy({ id, entrepriseId });
  }

  async softDelete(id: string, entrepriseId: string): Promise<boolean> {
    const result = await this.repo.update({ id, entrepriseId }, { actif: false });
    return Boolean(result.affected && result.affected > 0);
  }

  ajusterStock(id: string, entrepriseId: string, quantite: number, type: TypeMouvement, motif?: string): Promise<Produit | null> {
    return AppDataSource.transaction(async (manager) => {
      const produit = await manager.findOneBy(Produit, { id, entrepriseId });
      if (!produit) return null;

      const quantiteAvant = Number(produit.stockActuel);
      const isEntree = type === TypeMouvement.ENTREE || type === TypeMouvement.RETOUR;
      const quantiteApres = isEntree ? quantiteAvant + quantite : quantiteAvant - quantite;

      if (quantiteApres < 0) {
        throw new Error('STOCK_INSUFFISANT');
      }

      await manager.update(Produit, id, { stockActuel: quantiteApres });
      await manager.save(
        manager.create(MouvementStock, {
          produitId: id,
          type,
          quantite,
          quantiteAvant,
          quantiteApres,
          motif,
        }),
      );

      return manager.findOneBy(Produit, { id });
    });
  }

  getAlertes(entrepriseId: string): Promise<Produit[]> {
    return this.repo
      .createQueryBuilder('p')
      .select(['p.id', 'p.nom', 'p.reference', 'p.stockActuel', 'p.stockMinimum'])
      .where('p.entrepriseId = :entrepriseId AND p.actif = true AND p.stockActuel <= p.stockMinimum', { entrepriseId })
      .orderBy('p.stockActuel - p.stockMinimum', 'ASC')
      .getMany();
  }
}
