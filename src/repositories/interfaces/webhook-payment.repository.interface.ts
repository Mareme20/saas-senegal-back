import { MethodePaiement } from '../../entities/Paiement';

export interface ConfirmWebhookPaymentInput {
  factureId: string;
  montant: number;
  methode: MethodePaiement;
  transactionId?: string;
}

export interface ConfirmWebhookPaymentResult {
  entrepriseId: string;
  factureNumero: string;
  factureId: string;
  montant: number;
}

export interface IWebhookPaymentRepository {
  confirmPayment(input: ConfirmWebhookPaymentInput): Promise<ConfirmWebhookPaymentResult | null>;
}
