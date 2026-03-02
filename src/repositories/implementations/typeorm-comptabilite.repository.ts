import { AppDataSource } from '../../config/database';
import { EcritureComptable, TypeJournal } from '../../entities/EcritureComptable';
import { getPagination } from '../../utils/ApiResponse';
import { IComptabiliteRepository } from '../interfaces';

export class TypeOrmComptabiliteRepository implements IComptabiliteRepository {
  private readonly repo = AppDataSource.getRepository(EcritureComptable);

  create(data: Partial<EcritureComptable>): EcritureComptable {
    return this.repo.create(data);
  }

  async saveMany(ecritures: EcritureComptable[]): Promise<void> {
    await this.repo.save(ecritures);
  }

  async getGrandLivre(
    entrepriseId: string,
    query: { dateDebut?: string; dateFin?: string; numeroCompte?: string; journal?: TypeJournal; page?: number },
  ) {
    const { skip, take } = getPagination(query.page, 50);

    const qb = this.repo
      .createQueryBuilder('e')
      .where('e.entrepriseId = :entrepriseId', { entrepriseId })
      .orderBy('e.date', 'ASC')
      .addOrderBy('e.createdAt', 'ASC');

    if (query.dateDebut) qb.andWhere('e.date >= :d', { d: query.dateDebut });
    if (query.dateFin) qb.andWhere('e.date <= :f', { f: query.dateFin });
    if (query.numeroCompte) qb.andWhere('e.numeroCompte = :n', { n: query.numeroCompte });
    if (query.journal) qb.andWhere('e.journal = :j', { j: query.journal });

    const [ecritures, total] = await qb.skip(skip).take(take).getManyAndCount();
    return { ecritures, total };
  }

  getBalance(entrepriseId: string, dateDebut?: string, dateFin?: string) {
    const qb = this.repo
      .createQueryBuilder('e')
      .select('e.numeroCompte', 'compte')
      .addSelect('e.libelleCompte', 'libelle')
      .addSelect('SUM(e.debit)', 'totalDebit')
      .addSelect('SUM(e.credit)', 'totalCredit')
      .addSelect('SUM(e.debit) - SUM(e.credit)', 'solde')
      .where('e.entrepriseId = :entrepriseId', { entrepriseId })
      .groupBy('e.numeroCompte, e.libelleCompte')
      .orderBy('e.numeroCompte');

    if (dateDebut) qb.andWhere('e.date >= :d', { d: dateDebut });
    if (dateFin) qb.andWhere('e.date <= :f', { f: dateFin });

    return qb.getRawMany();
  }

  async getTotalClasse(
    entrepriseId: string,
    classePrefix: string,
    debut: string,
    fin: string,
    mode: 'produits' | 'charges',
  ): Promise<number> {
    const expr = mode === 'produits' ? 'SUM(e.credit - e.debit)' : 'SUM(e.debit - e.credit)';

    const result = await this.repo
      .createQueryBuilder('e')
      .select(expr, 'total')
      .where('e.entrepriseId = :e AND e.numeroCompte LIKE :p AND e.date BETWEEN :d AND :f', {
        e: entrepriseId,
        p: `${classePrefix}%`,
        d: debut,
        f: fin,
      })
      .getRawOne();

    return Number(result?.total || 0);
  }
}
