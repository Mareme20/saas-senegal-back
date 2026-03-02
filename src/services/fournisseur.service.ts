import { Fournisseur } from '../entities/Fournisseur';
import { TypeOrmFournisseurRepository } from '../repositories/implementations';
import { IFournisseurRepository } from '../repositories/interfaces';
import { ApiError } from '../utils/ApiError';
import { getPaginationMeta } from '../utils/ApiResponse';

export class FournisseurService {
  constructor(private readonly fournisseurRepository: IFournisseurRepository) {}

  async findAll(entrepriseId: string, query: { page?: number; limit?: number; search?: string }) {
    const r = await this.fournisseurRepository.findAll(entrepriseId, query);
    return {
      fournisseurs: r.fournisseurs,
      meta: getPaginationMeta(r.total, r.page, r.limit),
    };
  }

  async findById(id: string, entrepriseId: string) {
    const fournisseur = await this.fournisseurRepository.findById(id, entrepriseId);
    if (!fournisseur) throw ApiError.notFound('Fournisseur introuvable');
    return fournisseur;
  }

  create(entrepriseId: string, data: Partial<Fournisseur>) {
    return this.fournisseurRepository.create(entrepriseId, data);
  }

  async update(id: string, entrepriseId: string, data: Partial<Fournisseur>) {
    const fournisseur = await this.fournisseurRepository.update(id, entrepriseId, data);
    if (!fournisseur) throw ApiError.notFound('Fournisseur introuvable');
    return fournisseur;
  }

  async delete(id: string, entrepriseId: string) {
    const deleted = await this.fournisseurRepository.softDelete(id, entrepriseId);
    if (!deleted) throw ApiError.notFound('Fournisseur introuvable');
  }
}

export const fournisseurService = new FournisseurService(new TypeOrmFournisseurRepository());
