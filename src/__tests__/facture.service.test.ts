import { FactureService } from '../services/facture.service';
import { IFactureRepository } from '../repositories/interfaces';
import { TypeFacture } from '../entities/Facture';

describe('FactureService.create', () => {
  const baseInput: any = {
    clientId: 'client-id',
    type: TypeFacture.FACTURE,
    lignes: [
      {
        designation: 'Produit test',
        quantite: 2,
        prixUnitaire: 1000,
      },
    ],
  };

  it('réessaie après collision de numéro (23505)', async () => {
    const mockRepo: IFactureRepository = {
      getNextNumero: jest
        .fn()
        .mockResolvedValueOnce('F-2026-0001')
        .mockResolvedValueOnce('F-2026-0002'),
      findAll: jest.fn() as any,
      findByIdWithDetails: jest.fn() as any,
      changeStatut: jest.fn() as any,
      createWithLignesAndStock: jest
        .fn()
        .mockRejectedValueOnce({ code: '23505' })
        .mockResolvedValueOnce({ id: 'fact-1' } as any),
    };
    const service = new FactureService(mockRepo);

    const result = await service.create('ent-1', 'user-1', baseInput);

    expect(mockRepo.getNextNumero).toHaveBeenCalledTimes(2);
    expect(mockRepo.createWithLignesAndStock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: 'fact-1' });
  });

  it('échoue après 5 collisions', async () => {
    const mockRepo: IFactureRepository = {
      getNextNumero: jest.fn().mockResolvedValue('F-2026-0001'),
      findAll: jest.fn() as any,
      findByIdWithDetails: jest.fn() as any,
      changeStatut: jest.fn() as any,
      createWithLignesAndStock: jest.fn().mockRejectedValue({ code: '23505' }),
    };
    const service = new FactureService(mockRepo);

    await expect(service.create('ent-1', 'user-1', baseInput)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Impossible de générer un numéro de facture unique',
    });
    expect(mockRepo.getNextNumero).toHaveBeenCalledTimes(5);
  });
});
