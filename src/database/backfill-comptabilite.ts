import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../config/database';
import { EcritureComptable, Facture, TypeFacture } from '../entities';
import { comptabiliteService } from '../services/comptabilite.service';

async function backfillComptabilite() {
  await AppDataSource.initialize();
  console.log('🔧 Backfill comptabilité démarré...');

  const factureRepo = AppDataSource.getRepository(Facture);
  const ecritureRepo = AppDataSource.getRepository(EcritureComptable);

  const factures = await factureRepo.find({
    where: { type: TypeFacture.FACTURE },
    relations: ['client'],
    order: { createdAt: 'ASC' },
  });

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const facture of factures) {
    try {
      const existing = await ecritureRepo.count({
        where: {
          entrepriseId: facture.entrepriseId,
          factureId: facture.id,
        },
      });

      if (existing > 0) {
        skipped += 1;
        continue;
      }

      await comptabiliteService.comptabiliserFacture(facture);
      created += 1;
    } catch (error) {
      failed += 1;
      console.error(`❌ Facture ${facture.id} (${facture.numero})`, error);
    }
  }

  console.log('✅ Backfill terminé');
  console.log(`   Factures traitées : ${factures.length}`);
  console.log(`   Écritures créées  : ${created}`);
  console.log(`   Déjà présentes    : ${skipped}`);
  console.log(`   En erreur         : ${failed}`);

  await AppDataSource.destroy();
}

backfillComptabilite().catch((error) => {
  console.error('❌ Erreur backfill comptabilité', error);
  process.exit(1);
});
