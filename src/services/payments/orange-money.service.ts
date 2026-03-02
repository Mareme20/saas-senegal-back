import axios from 'axios';
import { logger } from '../../config/logger';

export class OrangeMoneyService {
  private static readonly BASE_URL = 'https://api.orange.com/orange-money-webpay/sn/v1';
  private static accessToken: string | null = null;
  private static tokenExpiry: Date | null = null;

  /**
   * Obtient le token OAuth2 Orange
   */
  private static async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${process.env.ORANGE_CLIENT_ID}:${process.env.ORANGE_CLIENT_SECRET}`
    ).toString('base64');

    const { data } = await axios.post(
      'https://api.orange.com/oauth/v3/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
    return this.accessToken!;
  }

  /**
   * Initie un paiement Orange Money (Web Payment)
   */
  static async initierPaiement(params: {
    montant: number;
    reference: string;
    notifUrl: string;
    returnUrl: string;
    cancelUrl: string;
  }) {
    try {
      const token = await this.getAccessToken();
      const { data } = await axios.post(
        `${this.BASE_URL}/webpayment`,
        {
          merchant_key: process.env.ORANGE_MERCHANT_KEY,
          currency: 'OUV',
          order_id: params.reference,
          amount: Math.round(params.montant),
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          notif_url: params.notifUrl,
          lang: 'fr',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      logger.info({ ref: params.reference, payToken: data.pay_token }, 'Orange Money paiement initié');
      return data;
    } catch (err: any) {
      logger.error({ err: err.response?.data }, 'Erreur Orange Money API');
      throw new Error(`Orange Money: ${err.response?.data?.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifie le statut d'un paiement Orange Money
   */
  static async verifierStatut(payToken: string) {
    const token = await this.getAccessToken();
    const { data } = await axios.get(
      `${this.BASE_URL}/webpayment/${payToken}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  }
}
