import { TypeOrmDashboardRepository } from '../repositories/implementations';
import { IDashboardRepository } from '../repositories/interfaces';

export class DashboardService {
  constructor(private readonly dashboardRepository: IDashboardRepository) {}

  async getKpis(entrepriseId: string) {
    const raw = await this.dashboardRepository.getKpisRaw(entrepriseId);

    return {
      ventesJour: { montant: Number(raw.ventesJour.montant), nbFactures: Number(raw.ventesJour.count) },
      ventesMois: { montant: Number(raw.ventesMois.montant), nbFactures: Number(raw.ventesMois.count) },
      facturesEnAttente: {
        montant: Number(raw.facturesEnAttente.montant),
        count: Number(raw.facturesEnAttente.count),
      },
      stockAlertes: raw.stockAlertes,
      derniersPaiements: raw.derniersPaiements,
      parMethode: raw.parMethode.map((m) => ({
        methode: m.methode,
        montant: Number(m.montant),
        count: Number(m.count),
      })),
    };
  }

  getVentesParJour(entrepriseId: string, jours = 30) {
    return this.dashboardRepository.getVentesParJour(entrepriseId, jours);
  }

  getTopProduits(entrepriseId: string, limite = 5) {
    return this.dashboardRepository.getTopProduits(entrepriseId, limite);
  }
}

export const dashboardService = new DashboardService(new TypeOrmDashboardRepository());
