import { Paiement } from '../../entities/Paiement';
import { CreatePaiementDto } from '../../dtos/paiement.dto';

export interface PaiementListParams {
  entrepriseId: string;
  page: number;
  limit: number;
}

export interface IPaiementRepository {
  findAll(params: PaiementListParams): Promise<Paiement[]>;
  createConfirmedAndSyncFacture(entrepriseId: string, payload: CreatePaiementDto): Promise<Paiement>;
}
