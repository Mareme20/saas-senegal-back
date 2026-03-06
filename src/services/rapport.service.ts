import { AppDataSource } from '../config/database';
import { Facture, Paiement, EcritureComptable, Produit, LigneFacture } from '../entities';

export interface RapportVentePeriode {
  periode: string;
  nombreFactures: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
}

export interface RapportRentabilite {
  produitId?: string;
  designation: string;
  quantiteVendue: number;
  chiffreAffaires: number;
  coutAchat: number;
  marge: number;
  tauxMarge: number;
}

export interface RapportCreances {
  clientId: string;
  clientNom: string;
  totalCreances: number;
  facturesEnRetard: number;
  plusAncienneFacture: Date | null;
}

export interface RapportCharges {
  periode: string;
  totalCharges: number;
  chargesParType: {
    type: string;
    montant: number;
  }[];
}

export interface RapportCAMensuel {
  mois: string;
  ca: number;
  nombreFactures: number;
  moyenneParFacture: number;
}

export class RapportService {
  /**
   * Rapport des ventes sur une période
   */
  static async getVentesPeriode(
    entrepriseId: string,
    dateDebut: Date,
    dateFin: Date,
    groupePar: 'jour' | 'semaine' | 'mois' = 'jour'
  ): Promise<RapportVentePeriode[]> {
    const factures = await AppDataSource.getRepository(Facture)
      .createQueryBuilder('f')
      .where('f.entrepriseId = :entrepriseId AND f.type = :type AND f.dateEmission BETWEEN :dateDebut AND :dateFin', {
        entrepriseId,
        type: 'FACTURE',
        dateDebut,
        dateFin,
      })
      .getMany();

    const grouped = new Map<string, RapportVentePeriode>();

    for (const facture of factures) {
      const date = new Date(facture.dateEmission);
      let key: string;

      if (groupePar === 'jour') {
        key = date.toISOString().split('T')[0];
      } else if (groupePar === 'semaine') {
        const week = getWeekNumber(date);
        key = `${date.getFullYear()}-S${week}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const existing = grouped.get(key) || {
        periode: key,
        nombreFactures: 0,
        montantHT: 0,
        montantTVA: 0,
        montantTTC: 0,
      };

      existing.nombreFactures += 1;
      existing.montantHT += Number(facture.sousTotal);
      existing.montantTVA += Number(facture.montantTva);
      existing.montantTTC += Number(facture.montantTotal);

      grouped.set(key, existing);
    }

    return Array.from(grouped.values()).sort((a, b) => a.periode.localeCompare(b.periode));
  }

  /**
   * Rapport de rentabilité par produit
   */
  static async getRentabilite(entrepriseId: string): Promise<RapportRentabilite[]> {
    const produits = await AppDataSource.getRepository(Produit).find({
      where: { entrepriseId },
    });

    const lignesFactures = await AppDataSource.getRepository(LigneFacture)
      .createQueryBuilder('lf')
      .innerJoin('lf.facture', 'f')
      .where('f.entrepriseId = :entrepriseId AND f.type = :type', {
        entrepriseId,
        type: 'FACTURE',
      })
      .getMany();

    const result: RapportRentabilite[] = [];

    for (const produit of produits) {
      const lignesProduit = lignesFactures.filter(l => l.produitId === produit.id);
      const quantiteVendue = lignesProduit.reduce((sum, l) => sum + l.quantite, 0);
      const chiffreAffaires = lignesProduit.reduce((sum, l) => sum + l.montantTTC, 0);
      const coutAchat = quantiteVendue * (produit.prixAchat || 0);
      const marge = chiffreAffaires - coutAchat;
      const tauxMarge = chiffreAffaires > 0 ? (marge / chiffreAffaires) * 100 : 0;

      result.push({
        produitId: produit.id,
        designation: produit.nom,
        quantiteVendue,
        chiffreAffaires,
        coutAchat,
        marge,
        tauxMarge,
      });
    }

    return result.sort((a, b) => b.marge - a.marge);
  }

  /**
   * État des créances clients
   */
  static async getCreances(entrepriseId: string): Promise<RapportCreances[]> {
    const factures = await AppDataSource.getRepository(Facture)
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.client', 'c')
      .where('f.entrepriseId = :entrepriseId', { entrepriseId })
      .andWhere('f.type = :type AND f.statut NOT IN (:...statuts)', {
        type: 'FACTURE',
        statuts: ['PAYEE', 'ANNULEE'],
      })
      .getMany();

    const grouped = new Map<string, RapportCreances>();

    for (const facture of factures) {
      const clientId = facture.clientId || 'aucun';
      const clientNom = facture.client?.nom || 'Client Divers';

      const existing = grouped.get(clientId) || {
        clientId,
        clientNom,
        totalCreances: 0,
        facturesEnRetard: 0,
        plusAncienneFacture: null,
      };

      const montantRestant = Number(facture.montantTotal) - Number(facture.montantPaye);
      existing.totalCreances += montantRestant;

      if (facture.statut === 'EN_RETARD') {
        existing.facturesEnRetard += 1;
      }

      if (!existing.plusAncienneFacture || facture.dateEmission < existing.plusAncienneFacture) {
        existing.plusAncienneFacture = facture.dateEmission;
      }

      grouped.set(clientId, existing);
    }

    return Array.from(grouped.values()).sort((a, b) => b.totalCreances - a.totalCreances);
  }

  /**
   * Rapport des charges
   */
  static async getCharges(
    entrepriseId: string,
    dateDebut: Date,
    dateFin: Date
  ): Promise<RapportCharges[]> {
    const ecritures = await AppDataSource.getRepository(EcritureComptable)
      .createQueryBuilder('e')
      .where('e.entrepriseId = :entrepriseId', { entrepriseId })
      .andWhere('e.date BETWEEN :dateDebut AND :dateFin', { dateDebut, dateFin })
      .andWhere('e.numeroCompte LIKE :prefix', { prefix: '6%' })
      .getMany();

    const chargesParMois = new Map<string, Map<string, number>>();

    for (const ecriture of ecritures) {
      const date = new Date(ecriture.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!chargesParMois.has(key)) {
        chargesParMois.set(key, new Map());
      }

      const monthMap = chargesParMois.get(key)!;
      const type = ecriture.libelleCompte || 'Autre';
      const current = monthMap.get(type) || 0;
      monthMap.set(type, current + Number(ecriture.credit || 0));
    }

    const result: RapportCharges[] = [];

    for (const [periode, typeMap] of chargesParMois) {
      let total = 0;
      const chargesParType: { type: string; montant: number }[] = [];

      for (const [type, montant] of typeMap) {
        total += montant;
        chargesParType.push({ type, montant });
      }

      result.push({
        periode,
        totalCharges: total,
        chargesParType: chargesParType.sort((a, b) => b.montant - a.montant),
      });
    }

    return result.sort((a, b) => a.periode.localeCompare(b.periode));
  }

  /**
   * Chiffre d'affaires mensuel
   */
  static async getCAMensuel(entrepriseId: string, annee: number): Promise<RapportCAMensuel[]> {
    const result: RapportCAMensuel[] = [];

    for (let mois = 1; mois <= 12; mois++) {
      const debut = new Date(annee, mois - 1, 1);
      const fin = new Date(annee, mois, 0, 23, 59, 59);

      const factures = await AppDataSource.getRepository(Facture)
        .createQueryBuilder('f')
        .where('f.entrepriseId = :entrepriseId', { entrepriseId })
        .andWhere('f.type = :type', { type: 'FACTURE' })
        .andWhere('f.dateEmission BETWEEN :debut AND :fin', { debut, fin })
        .getMany();

      const ca = factures.reduce((sum, f) => sum + Number(f.montantTotal), 0);

      result.push({
        mois: `${annee}-${String(mois).padStart(2, '0')}`,
        ca,
        nombreFactures: factures.length,
        moyenneParFacture: factures.length > 0 ? ca / factures.length : 0,
      });
    }

    return result;
  }

  /**
   * Rapprochement bancaire simplifié
   */
  static async getRapprochement(
    entrepriseId: string,
    dateDebut: Date,
    dateFin: Date
  ) {
    // Récupérer les paiements的有效
    const paiements = await AppDataSource.getRepository(Paiement)
      .createQueryBuilder('p')
      .innerJoin('p.facture', 'f')
      .where('f.entrepriseId = :entrepriseId', { entrepriseId })
      .andWhere('p.createdAt BETWEEN :dateDebut AND :dateFin', { dateDebut, dateFin })
      .andWhere('p.statut = :statut', { statut: 'VALIDEE' })
      .getMany();

    // Calculer le total des paiements par méthode
    const parMethode = new Map<string, number>();
    for (const p of paiements) {
      const methode = p.methode || 'AUTRE';
      const current = parMethode.get(methode) || 0;
      parMethode.set(methode, current + Number(p.montant));
    }

    return {
      periode: { debut: dateDebut, fin: dateFin },
      totalPaiements: paiements.reduce((sum, p) => sum + Number(p.montant), 0),
      nombreTransactions: paiements.length,
      parMethode: Object.fromEntries(parMethode),
    };
  }
}

// Helper function pour obtenir le numéro de semaine
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

