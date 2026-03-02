import { AppDataSource } from '../../config/database';
import { MouvementStock } from '../../entities/MouvementStock';
import { IStockRepository, StockMouvementsParams } from '../interfaces';

export class TypeOrmStockRepository implements IStockRepository {
  private readonly repo = AppDataSource.getRepository(MouvementStock);

  findMouvements(params: StockMouvementsParams): Promise<MouvementStock[]> {
    const skip = (params.page - 1) * params.limit;

    return this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.produit', 'p')
      .where('p.entrepriseId = :entrepriseId', { entrepriseId: params.entrepriseId })
      .orderBy('m.createdAt', 'DESC')
      .skip(skip)
      .take(params.limit)
      .getMany();
  }
}
