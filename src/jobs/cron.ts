import cron from 'node-cron';
import { AppDataSource } from '../config/database';
import { Facture, StatutFacture } from '../entities/Facture';
import { Produit } from '../entities/Produit';
import { Entreprise } from '../entities/Entreprise';
import { smsService } from '../services/notifications/sms.service';
import { emailService } from '../services/notifications/email.service';
import { dashboardService } from '../services/dashboard.service';
import { logger } from '../config/logger';
import { LessThan } from 'typeorm';

export function demarrerCronJobs() {
  if (process.env.ENABLE_CRON !== 'true') {
    logger.info('Cron jobs désactivés (ENABLE_CRON != true)');
    return;
  }

  // ── 1. Rappels factures en retard (chaque jour à 9h00) ───────
  cron.schedule('0 9 * * *', async () => {
    logger.info('CRON: Vérification factures en retard');
    try {
      const aujourd_hui = new Date();
      const factures = await AppDataSource.getRepository(Facture).find({
        where: {
          statut: StatutFacture.ENVOYEE,
          dateEcheance: LessThan(aujourd_hui),
        },
        relations: ['client', 'entreprise'],
      });

      for (const f of factures) {
        // Marquer en retard
        await AppDataSource.getRepository(Facture).update(f.id, { statut: StatutFacture.EN_RETARD });

        // SMS au gérant
        if (f.entreprise?.telephone) {
          const echeanceStr = f.dateEcheance
            ? new Date(f.dateEcheance).toLocaleDateString('fr-FR')
            : '';
          await smsService.rappelFacture(
            f.entreprise.telephone,
            f.client?.nom || 'Client',
            Number(f.montantTotal),
            echeanceStr
          );
        }
      }

      logger.info(`CRON: ${factures.length} factures marquées en retard`);
    } catch (err) {
      logger.error({ err }, 'CRON erreur factures en retard');
    }
  }, { timezone: 'Africa/Dakar' });

  // ── 2. Alertes stock bas (chaque jour à 8h00) ─────────────────
  cron.schedule('0 8 * * *', async () => {
    logger.info('CRON: Vérification stock bas');
    try {
      const produitsCritiques = await AppDataSource
        .createQueryBuilder()
        .select(['p.nom', 'p.stockActuel', 'p.stockMinimum', 'e.telephone', 'e.id'])
        .from(Produit, 'p')
        .innerJoin(Entreprise, 'e', 'e.id = p."entrepriseId"')
        .where('p.actif = true AND p."stockActuel" <= p."stockMinimum"')
        .getRawMany();

      // Grouper par entreprise
      const parEntreprise = produitsCritiques.reduce((acc: any, p: any) => {
        const id = p.e_id;
        if (!acc[id]) acc[id] = { telephone: p.e_telephone, produits: [] };
        acc[id].produits.push(p);
        return acc;
      }, {});

      for (const [, data] of Object.entries(parEntreprise) as any) {
        if (data.telephone && data.produits.length > 0) {
          const premierProduit = data.produits[0];
          await smsService.alerteStockBas(
            data.telephone,
            `${premierProduit.p_nom}${data.produits.length > 1 ? ` + ${data.produits.length - 1} autres` : ''}`,
            Number(premierProduit.p_stockActuel)
          );
        }
      }

      logger.info(`CRON: Alertes stock envoyées pour ${Object.keys(parEntreprise).length} entreprises`);
    } catch (err) {
      logger.error({ err }, 'CRON erreur alertes stock');
    }
  }, { timezone: 'Africa/Dakar' });

  // ── 3. Rapport hebdomadaire (lundi à 7h30) ────────────────────
  cron.schedule('30 7 * * 1', async () => {
    logger.info('CRON: Envoi rapports hebdomadaires');
    try {
      const entreprises = await AppDataSource.getRepository(Entreprise).find({
        where: { actif: true },
        relations: ['utilisateurs'],
      });

      for (const entreprise of entreprises) {
        try {
          const [kpis, topProduits] = await Promise.all([
            dashboardService.getKpis(entreprise.id),
            dashboardService.getTopProduits(entreprise.id, 5),
          ]);

          const gerant = entreprise.utilisateurs?.find(u => u.role === 'GERANT' as any);
          if (gerant?.email) {
            await emailService.envoyerRapportHebdomadaire({
              to: gerant.email,
              nom: entreprise.nom,
              ventes: kpis.ventesMois.montant,
              nbFactures: kpis.ventesMois.nbFactures,
              topProduits: (topProduits as any[]).map(p => ({
                nom: p.nom || p.p_nom,
                ca: Number(p.chiffre_affaires || 0),
              })),
              alertesStock: kpis.stockAlertes,
            });
          }
        } catch (err) {
          logger.error({ err, entrepriseId: entreprise.id }, 'CRON erreur rapport entreprise');
        }
      }
    } catch (err) {
      logger.error({ err }, 'CRON erreur rapports hebdomadaires');
    }
  }, { timezone: 'Africa/Dakar' });

  logger.info('✅ Cron jobs démarrés');
}
