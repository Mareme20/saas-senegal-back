import { z } from 'zod';
import { StatutFacture, TypeFacture } from '../entities/Facture';

export const createFactureSchema = z.object({
  clientId: z.string().uuid().optional(),
  type: z.nativeEnum(TypeFacture).optional(),
  dateEcheance: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  notes: z.string().optional(),
  conditionsPaiement: z.string().optional(),
  lignes: z.array(
    z.object({
      produitId: z.string().uuid().optional(),
      designation: z.string().min(1),
      quantite: z.number().positive(),
      prixUnitaire: z.number().positive(),
      tva: z.number().min(0).optional(),
    }),
  ).min(1),
});

export const changeFactureStatutSchema = z.object({
  statut: z.nativeEnum(StatutFacture),
});

export type CreateFactureDto = z.infer<typeof createFactureSchema>;
export type ChangeFactureStatutDto = z.infer<typeof changeFactureStatutSchema>;
