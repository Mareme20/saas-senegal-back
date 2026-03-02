import { AppDataSource } from '../../config/database';
import { Facture, Paiement, Produit } from '../../entities';
import { StatutFacture } from '../../entities/Facture';
import { DashboardKpisRaw, IDashboardRepository } from '../interfaces';

export class TypeOrmDashboardRepository implements IDashboardRepository {
  async getKpisRaw(entrepriseId: string): Promise<DashboardKpisRaw> {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const factureRepo = AppDataSource.getRepository(Facture);
    const paiementRepo = AppDataSource.getRepository(Paiement);
    const produitRepo = AppDataSource.getRepository(Produit);

    const [ventesJour, ventesMois, facturesEnAttente, stockAlertes, derniersPaiements, parMethode] =
      await Promise.all([
        factureRepo
          .createQueryBuilder('f')
          .select('COALESCE(SUM(f.montantPaye), 0)', 'montant')
          .addSelect('COUNT(*)', 'count')
          .where('f.entrepriseId = :e AND f.statut IN (:...s) AND f.createdAt >= :d', {
            e: entrepriseId,
            s: [StatutFacture.PAYEE, StatutFacture.PARTIELLEMENT_PAYEE],
            d: debut,
          })
          .getRawOne(),

        factureRepo
          .createQueryBuilder('f')
          .select('COALESCE(SUM(f.montantPaye), 0)', 'montant')
          .addSelect('COUNT(*)', 'count')
          .where('f.entrepriseId = :e AND f.statut IN (:...s) AND f.createdAt >= :d', {
            e: entrepriseId,
            s: [StatutFacture.PAYEE, StatutFacture.PARTIELLEMENT_PAYEE],
            d: debutMois,
          })
          .getRawOne(),

        factureRepo
          .createQueryBuilder('f')
          .select('COALESCE(SUM(f.montantTotal), 0)', 'montant')
          .addSelect('COUNT(*)', 'count')
          .where('f.entrepriseId = :e AND f.statut IN (:...s)', {
            e: entrepriseId,
            s: [StatutFacture.ENVOYEE, StatutFacture.EN_RETARD],
          })
          .getRawOne(),

        produitRepo
          .createQueryBuilder('p')
          .where('p.entrepriseId = :e AND p.actif = true AND p.stockActuel <= p.stockMinimum', { e: entrepriseId })
          .getCount(),

        paiementRepo.find({
          where: { entrepriseId },
          relations: ['facture', 'facture.client'],
          order: { createdAt: 'DESC' },
          take: 5,
        }),

        paiementRepo
          .createQueryBuilder('p')
          .select('p.methode', 'methode')
          .addSelect('COALESCE(SUM(p.montant), 0)', 'montant')
          .addSelect('COUNT(*)', 'count')
          .where('p.entrepriseId = :e AND p.statut = :s AND p.createdAt >= :d', {
            e: entrepriseId,
            s: 'CONFIRME',
            d: debutMois,
          })
          .groupBy('p.methode')
          .getRawMany(),
      ]);

    return {
      ventesJour,
      ventesMois,
      facturesEnAttente,
      stockAlertes,
      derniersPaiements,
      parMethode,
    };
  }

  getVentesParJour(entrepriseId: string, jours: number) {
    const debut = new Date();
    debut.setDate(debut.getDate() - jours);

    return AppDataSource.getRepository(Facture)
      .createQueryBuilder('f')
      .select('DATE(f.createdAt)', 'date')
      .addSelect('COUNT(*)', 'nb_factures')
      .addSelect('COALESCE(SUM(f.montantPaye), 0)', 'montant')
      .where('f.entrepriseId = :e AND f.statut IN (:...s) AND f.createdAt >= :d', {
        e: entrepriseId,
        s: [StatutFacture.PAYEE, StatutFacture.PARTIELLEMENT_PAYEE],
        d: debut,
      })
      .groupBy('DATE(f.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  getTopProduits(entrepriseId: string, limite: number) {
    return AppDataSource
      .createQueryBuilder()
      .select('p.id', 'id')
      .addSelect('p.nom', 'nom')
      .addSelect('p.reference', 'reference')
      .addSelect('SUM(lf.quantite)', 'quantite_vendue')
      .addSelect('SUM(lf.montantTTC)', 'chiffre_affaires')
      .from('lignes_facture', 'lf')
      .innerJoin('produits', 'p', 'p.id = lf."produitId"')
      .innerJoin('factures', 'f', 'f.id = lf."factureId"')
      .where('f."entrepriseId" = :e AND f.statut IN (:...s)', {
        e: entrepriseId,
        s: [StatutFacture.PAYEE, StatutFacture.PARTIELLEMENT_PAYEE],
      })
      .groupBy('p.id, p.nom, p.reference')
      .orderBy('chiffre_affaires', 'DESC')
      .limit(limite)
      .getRawMany();
  }
}
