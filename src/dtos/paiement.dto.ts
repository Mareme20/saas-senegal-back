import { z } from 'zod';
import { MethodePaiement } from '../entities/Paiement';

export const listPaiementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const createPaiementSchema = z.object({
  factureId: z.string().uuid().optional(),
  montant: z.number().positive(),
  methode: z.nativeEnum(MethodePaiement),
  telephone: z.string().optional(),
  notes: z.string().optional(),
});

export type ListPaiementsQueryDto = z.infer<typeof listPaiementsQuerySchema>;
export type CreatePaiementDto = z.infer<typeof createPaiementSchema>;
