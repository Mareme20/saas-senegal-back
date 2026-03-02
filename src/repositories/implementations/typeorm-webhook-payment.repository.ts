import { AppDataSource } from '../../config/database';
import { Facture, StatutFacture } from '../../entities/Facture';
import { Paiement, StatutPaiement } from '../../entities/Paiement';
import {
  ConfirmWebhookPaymentInput,
  ConfirmWebhookPaymentResult,
  IWebhookPaymentRepository,
} from '../interfaces';

export class TypeOrmWebhookPaymentRepository implements IWebhookPaymentRepository {
  async confirmPayment(input: ConfirmWebhookPaymentInput): Promise<ConfirmWebhookPaymentResult | null> {
    return AppDataSource.transaction(async (manager) => {
      const facture = await manager.findOne(Facture, { where: { id: input.factureId } });
      if (!facture) return null;

      const paiement = manager.create(Paiement, {
        entrepriseId: facture.entrepriseId,
        factureId: facture.id,
        montant: input.montant,
        methode: input.methode,
        statut: StatutPaiement.CONFIRME,
        transactionId: input.transactionId,
      });
      await manager.save(paiement);

      const nvMontant = Number(facture.montantPaye) + Number(input.montant);
      const statut = nvMontant >= Number(facture.montantTotal)
        ? StatutFacture.PAYEE
        : StatutFacture.PARTIELLEMENT_PAYEE;

      await manager.update(Facture, facture.id, { montantPaye: nvMontant, statut });

      return {
        entrepriseId: facture.entrepriseId,
        factureNumero: facture.numero,
        factureId: facture.id,
        montant: input.montant,
      };
    });
  }
}
