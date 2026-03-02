import { OrangeWebhookDto, WaveWebhookDto } from '../dtos/webhook.dto';
import { MethodePaiement } from '../entities/Paiement';
import { TypeOrmWebhookPaymentRepository } from '../repositories/implementations';
import { IWebhookPaymentRepository } from '../repositories/interfaces';
import { emitPaiementRecu } from '../websocket/socket';

export class WebhookService {
  constructor(private readonly webhookPaymentRepository: IWebhookPaymentRepository) {}

  async handleWaveCheckoutCompleted(payload: WaveWebhookDto): Promise<void> {
    if (payload.type !== 'checkout.session.completed') return;

    const factureId = payload.data.client_reference;
    const montant = Number(payload.data.amount || 0);
    if (!factureId || montant <= 0) return;

    const result = await this.webhookPaymentRepository.confirmPayment({
      factureId,
      montant,
      methode: MethodePaiement.WAVE,
      transactionId: payload.data.id,
    });

    if (!result) return;

    emitPaiementRecu(result.entrepriseId, {
      montant: result.montant,
      methode: 'Wave',
      factureNumero: result.factureNumero,
    });
  }

  async handleOrangeSuccess(payload: OrangeWebhookDto): Promise<void> {
    if (payload.status !== 'SUCCESS') return;

    const factureId = payload.order_id;
    const montant = Number(payload.amount || 0);
    if (!factureId || montant <= 0) return;

    const result = await this.webhookPaymentRepository.confirmPayment({
      factureId,
      montant,
      methode: MethodePaiement.ORANGE_MONEY,
      transactionId: payload.txnid,
    });

    if (!result) return;

    emitPaiementRecu(result.entrepriseId, {
      montant: result.montant,
      methode: 'Orange Money',
      factureNumero: result.factureNumero,
    });
  }
}

export const webhookService = new WebhookService(new TypeOrmWebhookPaymentRepository());
