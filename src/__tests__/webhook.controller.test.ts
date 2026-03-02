import { WebhookController } from '../controllers/webhook.controller';
import { WaveService } from '../services/payments/wave.service';
import { webhookService } from '../services/webhook.service';

jest.mock('../services/webhook.service', () => ({
  webhookService: {
    handleWaveCheckoutCompleted: jest.fn(),
    handleOrangeSuccess: jest.fn(),
  },
}));

describe('WebhookController', () => {
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('refuse le webhook wave si la signature est invalide', async () => {
    jest.spyOn(WaveService, 'verifierSignature').mockReturnValue(false);
    const req: any = {
      body: Buffer.from('{"type":"checkout.session.completed","data":{"client_reference":"x"}}', 'utf8'),
      headers: { 'x-wave-signature': 'bad' },
    };
    const res = mockResponse();
    const next = jest.fn();

    await WebhookController.wave(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Signature invalide' });
    expect((webhookService.handleWaveCheckoutCompleted as jest.Mock)).not.toHaveBeenCalled();
  });

  it('traite le webhook wave valide avec body raw', async () => {
    jest.spyOn(WaveService, 'verifierSignature').mockReturnValue(true);
    const req: any = {
      body: Buffer.from(
        '{"type":"checkout.session.completed","data":{"client_reference":"fact-1","amount":"1200","id":"tx-1"}}',
        'utf8',
      ),
      headers: { 'x-wave-signature': 'ok' },
    };
    const res = mockResponse();
    const next = jest.fn();

    await WebhookController.wave(req, res, next);

    expect(webhookService.handleWaveCheckoutCompleted as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'checkout.session.completed' }),
    );
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('parse le webhook orange depuis un buffer', async () => {
    const req: any = {
      body: Buffer.from('{"status":"SUCCESS","order_id":"fact-2","txnid":"om-1","amount":"3000"}', 'utf8'),
      headers: {},
    };
    const res = mockResponse();
    const next = jest.fn();

    await WebhookController.orange(req, res, next);

    expect(webhookService.handleOrangeSuccess as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'SUCCESS', order_id: 'fact-2' }),
    );
    expect(res.json).toHaveBeenCalledWith({ status: 'OK' });
    expect(next).not.toHaveBeenCalled();
  });
});
