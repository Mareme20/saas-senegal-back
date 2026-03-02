import { EcritureComptable, TypeJournal } from '../../entities/EcritureComptable';

export interface IComptabiliteRepository {
  saveMany(ecritures: EcritureComptable[]): Promise<void>;
  create(data: Partial<EcritureComptable>): EcritureComptable;
  getGrandLivre(
    entrepriseId: string,
    query: { dateDebut?: string; dateFin?: string; numeroCompte?: string; journal?: TypeJournal; page?: number },
  ): Promise<{ ecritures: EcritureComptable[]; total: number }>;
  getBalance(entrepriseId: string, dateDebut?: string, dateFin?: string): Promise<Array<{ compte: string; libelle: string; totalDebit: string; totalCredit: string; solde: string }>>;
  getTotalClasse(entrepriseId: string, classePrefix: string, debut: string, fin: string, mode: 'produits' | 'charges'): Promise<number>;
}
