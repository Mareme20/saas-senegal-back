import { EcritureComptable, TypeJournal } from '../entities/EcritureComptable';
import { Facture } from '../entities/Facture';
import { Paiement } from '../entities/Paiement';
import { TypeOrmComptabiliteRepository } from '../repositories/implementations';
import { IComptabiliteRepository } from '../repositories/interfaces';

const COMPTES = {
  CLIENTS: { num: '411000', lib: 'Clients' },
  TVA_COLLECTEE: { num: '443100', lib: 'TVA collectée' },
  VENTES_MARCHANDISES: { num: '707000', lib: 'Ventes de marchandises' },
  VENTES_SERVICES: { num: '706000', lib: 'Ventes de services' },
  CAISSE: { num: '571000', lib: 'Caisse' },
  BANQUE: { num: '521000', lib: 'Banque' },
  MOBILE_MONEY: { num: '572000', lib: 'Mobile Money (Wave/Orange)' },
};

export class ComptabiliteService {
  constructor(private readonly comptabiliteRepository: IComptabiliteRepository) {}

  async comptabiliserFacture(facture: Facture): Promise<void> {
    const ecritures: EcritureComptable[] = [];

    ecritures.push(this.comptabiliteRepository.create({
      entrepriseId: facture.entrepriseId,
      journal: TypeJournal.VENTES,
      date: new Date(facture.dateEmission),
      numeroCompte: COMPTES.CLIENTS.num,
      libelleCompte: COMPTES.CLIENTS.lib,
      libelle: `Facture ${facture.numero} — ${facture.client?.nom || 'Client'}`,
      debit: Number(facture.montantTotal),
      credit: 0,
      pieceRef: facture.numero,
      factureId: facture.id,
    }));

    ecritures.push(this.comptabiliteRepository.create({
      entrepriseId: facture.entrepriseId,
      journal: TypeJournal.VENTES,
      date: new Date(facture.dateEmission),
      numeroCompte: COMPTES.VENTES_MARCHANDISES.num,
      libelleCompte: COMPTES.VENTES_MARCHANDISES.lib,
      libelle: `Vente ${facture.numero}`,
      debit: 0,
      credit: Number(facture.sousTotal),
      pieceRef: facture.numero,
      factureId: facture.id,
    }));

    if (Number(facture.montantTva) > 0) {
      ecritures.push(this.comptabiliteRepository.create({
        entrepriseId: facture.entrepriseId,
        journal: TypeJournal.VENTES,
        date: new Date(facture.dateEmission),
        numeroCompte: COMPTES.TVA_COLLECTEE.num,
        libelleCompte: COMPTES.TVA_COLLECTEE.lib,
        libelle: `TVA facture ${facture.numero}`,
        debit: 0,
        credit: Number(facture.montantTva),
        pieceRef: facture.numero,
        factureId: facture.id,
      }));
    }

    await this.comptabiliteRepository.saveMany(ecritures);
  }

  async comptabiliserPaiement(paiement: Paiement): Promise<void> {
    const compteDebit = this.getCompteEncaissement(paiement.methode);
    const libMethode = paiement.methode.replace('_', ' ');

    const ecritures = [
      this.comptabiliteRepository.create({
        entrepriseId: paiement.entrepriseId,
        journal: this.getJournalPaiement(paiement.methode),
        date: new Date(paiement.createdAt),
        numeroCompte: compteDebit.num,
        libelleCompte: compteDebit.lib,
        libelle: `Encaissement ${libMethode} — ${paiement.facture?.numero || paiement.id}`,
        debit: Number(paiement.montant),
        credit: 0,
        pieceRef: paiement.facture?.numero,
        factureId: paiement.factureId,
      }),
      this.comptabiliteRepository.create({
        entrepriseId: paiement.entrepriseId,
        journal: this.getJournalPaiement(paiement.methode),
        date: new Date(paiement.createdAt),
        numeroCompte: COMPTES.CLIENTS.num,
        libelleCompte: COMPTES.CLIENTS.lib,
        libelle: `Règlement ${paiement.facture?.numero || ''} par ${libMethode}`,
        debit: 0,
        credit: Number(paiement.montant),
        pieceRef: paiement.facture?.numero,
        factureId: paiement.factureId,
      }),
    ];

    await this.comptabiliteRepository.saveMany(ecritures);
  }

  async getGrandLivre(entrepriseId: string, query: {
    dateDebut?: string;
    dateFin?: string;
    numeroCompte?: string;
    journal?: TypeJournal;
    page?: number;
  }) {
    const { ecritures, total } = await this.comptabiliteRepository.getGrandLivre(entrepriseId, query);

    let solde = 0;
    const avecSolde = ecritures.map((e) => {
      solde += Number(e.debit) - Number(e.credit);
      return { ...e, solde };
    });

    return { ecritures: avecSolde, total };
  }

  getBalance(entrepriseId: string, dateDebut?: string, dateFin?: string) {
    return this.comptabiliteRepository.getBalance(entrepriseId, dateDebut, dateFin);
  }

  async getCompteResultat(entrepriseId: string, exercice: number) {
    const debut = `${exercice}-01-01`;
    const fin = `${exercice}-12-31`;

    const [produits, charges] = await Promise.all([
      this.comptabiliteRepository.getTotalClasse(entrepriseId, '7', debut, fin, 'produits'),
      this.comptabiliteRepository.getTotalClasse(entrepriseId, '6', debut, fin, 'charges'),
    ]);

    return {
      exercice,
      produits,
      charges,
      resultatNet: produits - charges,
    };
  }

  private getCompteEncaissement(methode: string) {
    if (['WAVE', 'ORANGE_MONEY', 'FREE_MONEY'].includes(methode)) return COMPTES.MOBILE_MONEY;
    if (['VIREMENT', 'CHEQUE', 'CARTE'].includes(methode)) return COMPTES.BANQUE;
    return COMPTES.CAISSE;
  }

  private getJournalPaiement(methode: string): TypeJournal {
    if (['VIREMENT', 'CHEQUE', 'CARTE'].includes(methode)) return TypeJournal.BANQUE;
    return TypeJournal.CAISSE;
  }
}

export const comptabiliteService = new ComptabiliteService(new TypeOrmComptabiliteRepository());
