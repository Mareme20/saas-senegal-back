import { z } from 'zod';

export const updateLogoSchema = z.object({
  entrepriseId: z.string().uuid(),
  url: z.string().min(1),
});

export const updateProduitImageSchema = z.object({
  entrepriseId: z.string().uuid(),
  produitId: z.string().uuid(),
  url: z.string().min(1),
});

export type UpdateLogoDto = z.infer<typeof updateLogoSchema>;
export type UpdateProduitImageDto = z.infer<typeof updateProduitImageSchema>;
