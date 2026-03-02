import { CreatePaiementDto, ListPaiementsQueryDto } from '../dtos/paiement.dto';
import { TypeOrmPaiementRepository } from '../repositories/implementations';
import { IPaiementRepository } from '../repositories/interfaces';

export class PaiementService {
  constructor(private readonly paiementRepository: IPaiementRepository) {}

  findAll(entrepriseId: string, query: ListPaiementsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    return this.paiementRepository.findAll({ entrepriseId, page, limit });
  }

  create(entrepriseId: string, payload: CreatePaiementDto) {
    return this.paiementRepository.createConfirmedAndSyncFacture(entrepriseId, payload);
  }
}

export const paiementService = new PaiementService(new TypeOrmPaiementRepository());
