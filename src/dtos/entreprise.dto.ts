import { z } from 'zod';

export const updateEntrepriseSchema = z.object({
  nom: z.string().min(2).optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  siret: z.string().optional(),
  langue: z.enum(['fr', 'wo']).optional(),
});

export type UpdateEntrepriseDto = z.infer<typeof updateEntrepriseSchema>;
