import { Facture, StatutFacture, TypeFacture } from '../../entities/Facture';

export interface LigneInput {
  produitId?: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  tva?: number;
}

export interface CreateFactureInput {
  clientId?: string;
  type?: TypeFacture;
  dateEcheance?: Date;
  notes?: string;
  conditionsPaiement?: string;
  lignes: LigneInput[];
}

export interface FactureQuery {
  page?: number;
  limit?: number;
  statut?: StatutFacture;
  clientId?: string;
}

export interface IFactureRepository {
  getNextNumero(entrepriseId: string, type: TypeFacture): Promise<string>;
  findAll(entrepriseId: string, query: FactureQuery): Promise<{ factures: Facture[]; total: number; page: number; limit: number }>;
  findByIdWithDetails(id: string, entrepriseId: string): Promise<Facture | null>;
  createWithLignesAndStock(
    entrepriseId: string,
    userId: string,
    numero: string,
    type: TypeFacture,
    input: CreateFactureInput,
    montants: { sousTotal: number; montantTva: number; montantTotal: number },
    lignesCalc: Array<LigneInput & { tva: number; montantHT: number; montantTTC: number; ordre: number }>,
  ): Promise<Facture | null>;
  changeStatut(id: string, entrepriseId: string, statut: StatutFacture): Promise<Facture | null>;
}
