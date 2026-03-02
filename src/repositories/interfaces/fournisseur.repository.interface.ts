import { Fournisseur } from '../../entities/Fournisseur';

export interface FournisseurQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface IFournisseurRepository {
  findAll(entrepriseId: string, query: FournisseurQuery): Promise<{ fournisseurs: Fournisseur[]; total: number; page: number; limit: number }>;
  findById(id: string, entrepriseId: string): Promise<Fournisseur | null>;
  create(entrepriseId: string, data: Partial<Fournisseur>): Promise<Fournisseur>;
  update(id: string, entrepriseId: string, data: Partial<Fournisseur>): Promise<Fournisseur | null>;
  softDelete(id: string, entrepriseId: string): Promise<boolean>;
}
