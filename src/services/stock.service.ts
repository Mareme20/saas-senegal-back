import { TypeOrmStockRepository } from '../repositories/implementations';
import { IStockRepository } from '../repositories/interfaces';

export interface StockQuery {
  page?: number;
  limit?: number;
}

export class StockService {
  constructor(private readonly stockRepository: IStockRepository) {}

  findMouvements(entrepriseId: string, query: StockQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    return this.stockRepository.findMouvements({ entrepriseId, page, limit });
  }
}

export const stockService = new StockService(new TypeOrmStockRepository());
