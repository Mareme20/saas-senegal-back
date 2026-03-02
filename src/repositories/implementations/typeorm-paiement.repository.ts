import { AppDataSource } from '../../config/database';
import { CreatePaiementDto } from '../../dtos/paiement.dto';
import { Facture, StatutFacture } from '../../entities/Facture';
import { Paiement, StatutPaiement } from '../../entities/Paiement';
import { IPaiementRepository, PaiementListParams } from '../interfaces';

export class TypeOrmPaiementRepository implements IPaiementRepository {
  private readonly repo = AppDataSource.getRepository(Paiement);

  async findAll(params: PaiementListParams): Promise<Paiement[]> {
    const skip = (params.page - 1) * params.limit;

    return this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.facture', 'f')
      .where('p.entrepriseId = :entrepriseId', { entrepriseId: params.entrepriseId })
      .orderBy('p.createdAt', 'DESC')
      .skip(skip)
      .take(params.limit)
      .getMany();
  }

  async createConfirmedAndSyncFacture(entrepriseId: string, payload: CreatePaiementDto): Promise<Paiement> {
    return AppDataSource.transaction(async (manager) => {
      const paiement = manager.create(Paiement, {
        ...payload,
        entrepriseId,
        statut: StatutPaiement.CONFIRME,
      });

      await manager.save(paiement);

      if (payload.factureId) {
        const facture = await manager.findOneBy(Facture, { id: payload.factureId, entrepriseId });

        if (facture) {
          const montantPaye = Number(facture.montantPaye) + Number(payload.montant);
          const statut = montantPaye >= Number(facture.montantTotal)
            ? StatutFacture.PAYEE
            : StatutFacture.PARTIELLEMENT_PAYEE;

          await manager.update(Facture, facture.id, { montantPaye, statut });
        }
      }

      const savedPaiement = await manager.findOne(Paiement, {
        where: { id: paiement.id },
        relations: ['facture'],
      });

      return savedPaiement || paiement;
    });
  }
}
