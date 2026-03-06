import { CreatePaiementDto, ListPaiementsQueryDto } from '../dtos/paiement.dto';
import { TypeOrmPaiementRepository } from '../repositories/implementations';
import { IPaiementRepository } from '../repositories/interfaces';
import { comptabiliteService } from './comptabilite.service';

export class PaiementService {
  constructor(private readonly paiementRepository: IPaiementRepository) {}

  findAll(entrepriseId: string, query: ListPaiementsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    return this.paiementRepository.findAll({ entrepriseId, page, limit });
  }

  async create(entrepriseId: string, payload: CreatePaiementDto) {
    const paiement = await this.paiementRepository.createConfirmedAndSyncFacture(entrepriseId, payload);
    await comptabiliteService.comptabiliserPaiement(paiement);
    return paiement;
  }
}

export const paiementService = new PaiementService(new TypeOrmPaiementRepository());
