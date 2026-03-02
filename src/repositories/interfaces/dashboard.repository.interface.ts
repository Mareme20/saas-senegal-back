import { Paiement } from '../../entities';

export interface DashboardKpisRaw {
  ventesJour: { montant: string; count: string };
  ventesMois: { montant: string; count: string };
  facturesEnAttente: { montant: string; count: string };
  stockAlertes: number;
  derniersPaiements: Paiement[];
  parMethode: Array<{ methode: string; montant: string; count: string }>;
}

export interface IDashboardRepository {
  getKpisRaw(entrepriseId: string): Promise<DashboardKpisRaw>;
  getVentesParJour(entrepriseId: string, jours: number): Promise<Array<{ date: string; nb_factures: string; montant: string }>>;
  getTopProduits(entrepriseId: string, limite: number): Promise<Array<{ id: string; nom: string; reference: string; quantite_vendue: string; chiffre_affaires: string }>>;
}
