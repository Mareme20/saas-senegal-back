import axios from 'axios';
import { logger } from '../../config/logger';

export class WhatsAppService {
  private static readonly BASE_URL = 'https://graph.facebook.com/v19.0';

  private static get headers() {
    return {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  private static get phoneId() {
    return process.env.WHATSAPP_PHONE_ID;
  }

  /**
   * Envoie un message texte simple
   */
  static async envoyerTexte(to: string, message: string): Promise<boolean> {
    if (!this.phoneId || !process.env.WHATSAPP_TOKEN) {
      logger.warn('WhatsApp non configuré — message simulé:', { to, message });
      return true;
    }

    try {
      const phone = to.startsWith('+') ? to.replace('+', '') : `221${to}`;
      await axios.post(
        `${this.BASE_URL}/${this.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        },
        { headers: this.headers }
      );
      logger.info({ to }, 'WhatsApp message envoyé');
      return true;
    } catch (err: any) {
      logger.error({ err: err.response?.data }, 'Erreur WhatsApp API');
      return false;
    }
  }

  /**
   * Envoie un document (PDF de facture)
   */
  static async envoyerDocument(to: string, documentUrl: string, filename: string, caption?: string): Promise<boolean> {
    if (!this.phoneId) return false;

    try {
      const phone = to.startsWith('+') ? to.replace('+', '') : `221${to}`;
      await axios.post(
        `${this.BASE_URL}/${this.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'document',
          document: {
            link: documentUrl,
            filename,
            caption: caption || '',
          },
        },
        { headers: this.headers }
      );
      logger.info({ to, filename }, 'WhatsApp document envoyé');
      return true;
    } catch (err: any) {
      logger.error({ err: err.response?.data }, 'Erreur WhatsApp document');
      return false;
    }
  }

  /**
   * Envoie une facture par WhatsApp avec message formaté
   */
  static async envoyerFacture(telephone: string, params: {
    clientNom: string;
    numero: string;
    montant: number;
    entrepriseNom: string;
    pdfUrl?: string;
  }): Promise<boolean> {
    const { clientNom, numero, montant, entrepriseNom, pdfUrl } = params;
    const montantFormate = montant.toLocaleString('fr-FR');

    const message = `Bonjour ${clientNom} 👋\n\n` +
      `*${entrepriseNom}* vous envoie votre facture :\n\n` +
      `📄 *${numero}*\n` +
      `💰 Montant : *${montantFormate} FCFA*\n\n` +
      `Merci pour votre confiance ! 🙏`;

    if (pdfUrl) {
      return this.envoyerDocument(telephone, pdfUrl, `${numero}.pdf`, message);
    }
    return this.envoyerTexte(telephone, message);
  }

  /**
   * Confirme un paiement reçu
   */
  static async confirmerPaiement(telephone: string, params: {
    clientNom: string;
    montant: number;
    methode: string;
    reference: string;
  }): Promise<boolean> {
    const { clientNom, montant, methode, reference } = params;
    const message = `✅ Paiement confirmé, ${clientNom} !\n\n` +
      `💰 *${montant.toLocaleString('fr-FR')} FCFA* reçu via ${methode}\n` +
      `🔖 Réf: ${reference}\n\n` +
      `Merci pour votre règlement ! 🙏`;
    return this.envoyerTexte(telephone, message);
  }

  /**
   * Vérifie le token webhook WhatsApp (required par Meta)
   */
  static verifierWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    return null;
  }
}
