import { Produit, TypeMouvement } from '../../entities';

export interface ProduitQuery {
  page?: number;
  limit?: number;
  search?: string;
  categorieId?: string;
  stockBas?: string;
}

export interface CreateProduitInput {
  categorieId?: string;
  reference?: string;
  codeBarres?: string;
  nom: string;
  description?: string;
  prixVente: number;
  prixAchat?: number;
  tva?: number;
  unite?: string;
  stockActuel?: number;
  stockMinimum?: number;
}

export interface IProduitRepository {
  findAll(entrepriseId: string, query: ProduitQuery): Promise<{ produits: Produit[]; total: number; page: number; limit: number }>;
  findByIdWithRelations(id: string, entrepriseId: string): Promise<Produit | null>;
  createWithInitialStock(entrepriseId: string, data: CreateProduitInput): Promise<Produit>;
  updateById(id: string, entrepriseId: string, data: Partial<CreateProduitInput>): Promise<Produit | null>;
  softDelete(id: string, entrepriseId: string): Promise<boolean>;
  ajusterStock(id: string, entrepriseId: string, quantite: number, type: TypeMouvement, motif?: string): Promise<Produit | null>;
  getAlertes(entrepriseId: string): Promise<Produit[]>;
}
