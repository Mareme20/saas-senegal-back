import { TypeMouvement } from '../entities';
import { TypeOrmProduitRepository } from '../repositories/implementations';
import { CreateProduitInput, IProduitRepository } from '../repositories/interfaces';
import { ApiError } from '../utils/ApiError';
import { getPaginationMeta } from '../utils/ApiResponse';

export class ProduitService {
  constructor(private readonly produitRepository: IProduitRepository) {}

  async findAll(entrepriseId: string, query: {
    page?: number; limit?: number; search?: string; categorieId?: string; stockBas?: string;
  }) {
    const r = await this.produitRepository.findAll(entrepriseId, query);
    return {
      produits: r.produits,
      meta: getPaginationMeta(r.total, r.page, r.limit),
    };
  }

  async findById(id: string, entrepriseId: string) {
    const produit = await this.produitRepository.findByIdWithRelations(id, entrepriseId);
    if (!produit) throw ApiError.notFound('Produit introuvable');
    return produit;
  }

  create(entrepriseId: string, data: CreateProduitInput) {
    return this.produitRepository.createWithInitialStock(entrepriseId, data);
  }

  async update(id: string, entrepriseId: string, data: Partial<CreateProduitInput>) {
    const produit = await this.produitRepository.updateById(id, entrepriseId, data);
    if (!produit) throw ApiError.notFound('Produit introuvable');
    return produit;
  }

  async delete(id: string, entrepriseId: string) {
    const deleted = await this.produitRepository.softDelete(id, entrepriseId);
    if (!deleted) throw ApiError.notFound('Produit introuvable');
  }

  async ajusterStock(id: string, entrepriseId: string, quantite: number, type: TypeMouvement, motif?: string) {
    try {
      const produit = await this.produitRepository.ajusterStock(id, entrepriseId, quantite, type, motif);
      if (!produit) throw ApiError.notFound('Produit introuvable');
      return produit;
    } catch (error) {
      if (error instanceof Error && error.message === 'STOCK_INSUFFISANT') {
        throw ApiError.badRequest('Stock insuffisant');
      }
      throw error;
    }
  }

  getAlertes(entrepriseId: string) {
    return this.produitRepository.getAlertes(entrepriseId);
  }
}

export const produitService = new ProduitService(new TypeOrmProduitRepository());
