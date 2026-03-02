import nodemailer from 'nodemailer';
import { logger } from '../../config/logger';
import { Attachment } from 'nodemailer/lib/mailer';
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'apikey',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async envoyer(params: {
    to: string;
    subject: string;
    html: string;
   attachments?: Attachment[];   }): Promise<boolean> {
    if (!process.env.SMTP_PASS) {
      logger.warn('Email non configuré (SMTP_PASS manquant) — email simulé:', { to: params.to, subject: params.subject });
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'SaaS Sénégal'}" <${process.env.EMAIL_FROM}>`,
        ...params,
      });
      logger.info({ to: params.to, subject: params.subject }, 'Email envoyé');
      return true;
    } catch (err) {
      logger.error({ err }, 'Erreur envoi email');
      return false;
    }
  }

  async envoyerFacture(params: {
    to: string;
    clientNom: string;
    numeroFacture: string;
    montant: number;
    entrepriseNom: string;
    pdfBuffer: Buffer;
  }): Promise<boolean> {
    const montantFormate = params.montant.toLocaleString('fr-FR');
    return this.envoyer({
      to: params.to,
      subject: `Votre facture ${params.numeroFacture} — ${params.entrepriseNom}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a6b3a; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${params.entrepriseNom}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border: 1px solid #eee;">
            <p>Bonjour <strong>${params.clientNom}</strong>,</p>
            <p>Veuillez trouver ci-joint votre facture <strong>${params.numeroFacture}</strong>.</p>
            <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="color: #666; margin: 0 0 8px 0;">Montant total</p>
              <p style="font-size: 32px; font-weight: bold; color: #1a6b3a; margin: 0;">${montantFormate} FCFA</p>
            </div>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            <p>Merci pour votre confiance ! 🙏</p>
          </div>
          <div style="background: #1a6b3a; padding: 16px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
              Ce message a été envoyé automatiquement par ${params.entrepriseNom}
            </p>
          </div>
        </div>
      `,
      attachments: [{
        filename: `${params.numeroFacture}.pdf`,
        content: params.pdfBuffer,
        contentType: 'application/pdf',
      }],
    });
  }

  async envoyerRapportHebdomadaire(params: {
    to: string;
    nom: string;
    ventes: number;
    nbFactures: number;
    topProduits: Array<{ nom: string; ca: number }>;
    alertesStock: number;
  }): Promise<boolean> {
    const { to, nom, ventes, nbFactures, topProduits, alertesStock } = params;
    return this.envoyer({
      to,
      subject: `📊 Rapport hebdomadaire — ${nom}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a6b3a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">📊 Rapport de la semaine</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${nom}</p>
          </div>
          <div style="padding: 24px; background: #f9f9f9; border: 1px solid #eee;">
            <div style="display: flex; gap: 12px; margin-bottom: 24px;">
              <div style="flex:1; background: white; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #eee;">
                <p style="color: #666; margin: 0 0 4px; font-size: 12px;">VENTES</p>
                <p style="font-size: 20px; font-weight: bold; color: #1a6b3a; margin: 0;">${ventes.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div style="flex:1; background: white; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #eee;">
                <p style="color: #666; margin: 0 0 4px; font-size: 12px;">FACTURES</p>
                <p style="font-size: 20px; font-weight: bold; color: #333; margin: 0;">${nbFactures}</p>
              </div>
            </div>
            ${alertesStock > 0 ? `<div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin-bottom: 16px;">⚠️ ${alertesStock} produit(s) en stock bas</div>` : ''}
            ${topProduits.length > 0 ? `
              <h3 style="color: #333; margin: 16px 0 8px;">🏆 Top produits</h3>
              ${topProduits.slice(0, 5).map(p => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span>${p.nom}</span><strong>${p.ca.toLocaleString('fr-FR')} FCFA</strong>
                </div>`).join('')}
            ` : ''}
          </div>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
