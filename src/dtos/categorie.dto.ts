import { z } from 'zod';

export const createCategorieSchema = z.object({
  nom: z.string().min(1),
  description: z.string().optional(),
});

export const updateCategorieSchema = createCategorieSchema.partial();

export type CreateCategorieDto = z.infer<typeof createCategorieSchema>;
export type UpdateCategorieDto = z.infer<typeof updateCategorieSchema>;
