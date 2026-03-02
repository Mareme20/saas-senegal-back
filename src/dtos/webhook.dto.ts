import { z } from 'zod';

export const waveWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    client_reference: z.string().optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    id: z.string().optional(),
  }).passthrough(),
}).passthrough();

export const orangeWebhookSchema = z.object({
  status: z.string(),
  order_id: z.string().optional(),
  txnid: z.string().optional(),
  amount: z.union([z.number(), z.string()]).optional(),
}).passthrough();

export type WaveWebhookDto = z.infer<typeof waveWebhookSchema>;
export type OrangeWebhookDto = z.infer<typeof orangeWebhookSchema>;
