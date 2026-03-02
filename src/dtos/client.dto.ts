import { z } from 'zod';
import { TypeClient } from '../entities/Client';

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

export const createClientSchema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  adresse: z.string().optional(),
  quartier: z.string().optional(),
  ville: z.string().optional(),
  type: z.nativeEnum(TypeClient).optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type ListClientsQueryDto = z.infer<typeof listClientsQuerySchema>;
export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
