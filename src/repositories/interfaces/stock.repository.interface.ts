import { MouvementStock } from '../../entities/MouvementStock';

export interface StockMouvementsParams {
  entrepriseId: string;
  page: number;
  limit: number;
}

export interface IStockRepository {
  findMouvements(params: StockMouvementsParams): Promise<MouvementStock[]>;
}
