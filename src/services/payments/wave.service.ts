import axios from 'axios';
import { logger } from '../../config/logger';

export interface WaveCheckoutResponse {
  id: string;
  wave_launch_url: string;
  client_reference: string;
  last_payment_error: string | null;
  amount: string;
  checkout_status: 'open' | 'complete' | 'expired';
  currency: string;
  error: string | null;
}

export interface WaveWebhookPayload {
  type: 'checkout.session.completed' | 'checkout.session.expired';
  data: {
    id: string;
    client_reference: string;
    amount: string;
    currency: string;
    checkout_status: string;
    payment_status: string;
  };
}

export class WaveService {
  private static readonly BASE_URL = 'https://api.wave.com/v1';

  private static getApiKey(): string {
    const apiKey = process.env.WAVE_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('Configuration Wave manquante: WAVE_API_KEY');
    }
    return apiKey;
  }

  private static get headers() {
    return {
      Authorization: `Bearer ${this.getApiKey()}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Crée une session de paiement Wave (lien à envoyer au client)
   */
  static async creerSession(params: {
    montant: number;
    reference: string;    // Notre ref interne (ex: ID facture)
    description?: string;
    redirectUrl?: string;
  }): Promise<WaveCheckoutResponse> {
    try {
      const { data } = await axios.post(
        `${this.BASE_URL}/checkout/sessions`,
        {
          amount: String(Math.round(params.montant)),
          currency: 'XOF',
          client_reference: params.reference,
          success_url: params.redirectUrl || `${process.env.APP_URL}/paiement/succes`,
          error_url: params.redirectUrl || `${process.env.APP_URL}/paiement/erreur`,
        },
        { headers: this.headers }
      );
      logger.info({ sessionId: data.id, ref: params.reference }, 'Wave session créée');
      return data;
    } catch (err: any) {
      const status = err?.response?.status;
      const payload = err?.response?.data;
      const message =
        payload?.message ||
        payload?.error ||
        payload?.detail ||
        (typeof payload === 'string' ? payload : null) ||
        err?.message ||
        'Erreur inconnue';

      logger.error(
        { status, payload, code: err?.code, ref: params.reference, montant: params.montant },
        'Erreur Wave API',
      );

      const statusPrefix = status ? `HTTP ${status} - ` : '';
      throw new Error(`Wave: ${statusPrefix}${message}`);
    }
  }

  /**
   * Récupère le statut d'une session Wave
   */
  static async getSession(sessionId: string): Promise<WaveCheckoutResponse> {
    const { data } = await axios.get(
      `${this.BASE_URL}/checkout/sessions/${sessionId}`,
      { headers: this.headers }
    );
    return data;
  }

  /**
   * Vérifie la signature du webhook Wave
   */
  static verifierSignature(payload: string | Buffer, signature: string): boolean {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', process.env.WAVE_WEBHOOK_SECRET || '')
      .update(payload)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
