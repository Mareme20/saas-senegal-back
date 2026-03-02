import { NextFunction, Request, Response } from 'express';
import { orangeWebhookSchema, waveWebhookSchema } from '../dtos/webhook.dto';
import { WaveService } from '../services/payments/wave.service';
import { WhatsAppService } from '../services/notifications/whatsapp.service';
import { webhookService } from '../services/webhook.service';
import { ApiError } from '../utils/ApiError';

export class WebhookController {
  private static parseJsonBody(req: Request): any {
    try {
      const raw = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : JSON.stringify(req.body || {});
      return JSON.parse(raw);
    } catch {
      throw ApiError.badRequest('Payload webhook invalide');
    }
  }

  static async wave(req: Request, res: Response, next: NextFunction) {
    try {
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(req.body || {}), 'utf8');
      const signature = req.headers['x-wave-signature'] as string;
      if (signature && !WaveService.verifierSignature(rawBody, signature)) {
        return res.status(403).json({ error: 'Signature invalide' });
      }

      const payload = waveWebhookSchema.parse(this.parseJsonBody(req));
      await webhookService.handleWaveCheckoutCompleted(payload);
      res.json({ received: true });
    } catch (e) { next(e); }
  }

  static async orange(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = orangeWebhookSchema.parse(this.parseJsonBody(req));
      await webhookService.handleOrangeSuccess(payload);
      res.json({ status: 'OK' });
    } catch (e) { next(e); }
  }

  static whatsappVerify(req: Request, res: Response) {
    const challenge = WhatsAppService.verifierWebhook(
      req.query['hub.mode'] as string,
      req.query['hub.verify_token'] as string,
      req.query['hub.challenge'] as string,
    );

    if (challenge) return res.status(200).send(challenge);
    res.status(403).send('Forbidden');
  }

  static async whatsappReceive(_req: Request, res: Response) {
    res.json({ status: 'received' });
  }
}
