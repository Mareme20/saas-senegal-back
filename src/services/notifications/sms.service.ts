// @ts-ignore
import AfricasTalking from 'africastalking';
import { logger } from '../../config/logger';

class SmsService {
  private at: any;
  private sms: any;

  constructor() {
    if (process.env.AT_API_KEY && process.env.AT_USERNAME) {
      this.at = AfricasTalking({
        apiKey: process.env.AT_API_KEY,
        username: process.env.AT_USERNAME,
      });
      this.sms = this.at.SMS;
    }
  }

  async envoyer(to: string | string[], message: string): Promise<boolean> {
    if (!this.sms) {
      logger.warn('SMS non configuré (AT_API_KEY manquant) — message simulé:', { to, message });
      return true;
    }

    try {
      const numbers = Array.isArray(to) ? to : [to];
      const formatted = numbers.map((n) => n.startsWith('+') ? n : `+221${n.replace(/^0/, '')}`);

      const result = await this.sms.send({
        to: formatted,
        message,
        from: process.env.AT_SENDER_ID || 'SaaSSN',
      });

      logger.info({ to: formatted, result: result.SMSMessageData?.Recipients }, 'SMS envoyé');
      return true;
    } catch (err) {
      logger.error({ err }, 'Erreur envoi SMS');
      return false;
    }
  }

  // ── Messages prédéfinis ───────────────────────────────────────
  async confirmerPaiement(telephone: string, montant: number, reference: string): Promise<boolean> {
    const msg = `Paiement de ${montant.toLocaleString('fr-FR')} FCFA confirmé. Réf: ${reference}. Merci!`;
    return this.envoyer(telephone, msg);
  }

  async alerteStockBas(telephone: string, produit: string, stock: number): Promise<boolean> {
    const msg = `⚠️ Stock bas: ${produit} (${stock} restant(s)). Pensez à réapprovisionner.`;
    return this.envoyer(telephone, msg);
  }

  async rappelFacture(telephone: string, client: string, montant: number, echeance: string): Promise<boolean> {
    const msg = `Rappel: Facture de ${montant.toLocaleString('fr-FR')} FCFA en attente (${client}). Échéance: ${echeance}.`;
    return this.envoyer(telephone, msg);
  }

  async envoyerFacture(telephone: string, numero: string, montant: number, lien?: string): Promise<boolean> {
    let msg = `Facture ${numero}: ${montant.toLocaleString('fr-FR')} FCFA.`;
    if (lien) msg += ` Voir: ${lien}`;
    return this.envoyer(telephone, msg);
  }
}

export const smsService = new SmsService();
