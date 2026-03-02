import { TypeOrmFactureRepository } from '../repositories/implementations';
import { CreateFactureInput, IFactureRepository, LigneInput } from '../repositories/interfaces';
import { ApiError } from '../utils/ApiError';
import { getPaginationMeta } from '../utils/ApiResponse';
import { StatutFacture, TypeFacture } from '../entities/Facture';

export class FactureService {
  constructor(private readonly factureRepository: IFactureRepository) {}

  private calculerMontants(lignes: LigneInput[]) {
    const lignesCalc = lignes.map((l, i) => {
      const tva = l.tva ?? 18;
      const montantHT = Number(l.quantite) * Number(l.prixUnitaire);
      const montantTTC = montantHT * (1 + tva / 100);
      return { ...l, tva, montantHT, montantTTC, ordre: i };
    });
    const sousTotal = lignesCalc.reduce((s, l) => s + l.montantHT, 0);
    const montantTva = lignesCalc.reduce((s, l) => s + (l.montantHT * l.tva) / 100, 0);
    return { lignesCalc, sousTotal, montantTva, montantTotal: sousTotal + montantTva };
  }

  async findAll(entrepriseId: string, query: {
    page?: number; limit?: number; statut?: StatutFacture; clientId?: string;
  }) {
    const r = await this.factureRepository.findAll(entrepriseId, query);
    return {
      factures: r.factures,
      meta: getPaginationMeta(r.total, r.page, r.limit),
    };
  }

  async findById(id: string, entrepriseId: string) {
    const facture = await this.factureRepository.findByIdWithDetails(id, entrepriseId);
    if (!facture) throw ApiError.notFound('Facture introuvable');
    return facture;
  }

  async create(entrepriseId: string, userId: string, input: CreateFactureInput) {
    const type = input.type || TypeFacture.FACTURE;
    const { lignesCalc, sousTotal, montantTva, montantTotal } = this.calculerMontants(input.lignes);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const numero = await this.factureRepository.getNextNumero(entrepriseId, type);
      try {
        return await this.factureRepository.createWithLignesAndStock(
          entrepriseId,
          userId,
          numero,
          type,
          input,
          { sousTotal, montantTva, montantTotal },
          lignesCalc,
        );
      } catch (error: any) {
        if (error?.code !== '23505') throw error;
      }
    }

    throw ApiError.conflict('Impossible de générer un numéro de facture unique');
  }

  async changerStatut(id: string, entrepriseId: string, statut: StatutFacture) {
    const facture = await this.factureRepository.changeStatut(id, entrepriseId, statut);
    if (!facture) throw ApiError.notFound('Facture introuvable');
    return facture;
  }
}

export const factureService = new FactureService(new TypeOrmFactureRepository());
