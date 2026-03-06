import { AppDataSource } from '../../config/database';
import { Facture, LigneFacture, MouvementStock, Produit, StatutFacture, TypeFacture, TypeMouvement } from '../../entities';
import { getPagination } from '../../utils/ApiResponse';
import { CreateFactureInput, FactureQuery, IFactureRepository, LigneInput } from '../interfaces';

export class TypeOrmFactureRepository implements IFactureRepository {
  private readonly repo = AppDataSource.getRepository(Facture);

  async getNextNumero(entrepriseId: string, type: TypeFacture): Promise<string> {
    const annee = new Date().getFullYear();
    const prefix = type === TypeFacture.DEVIS ? 'D' : type === TypeFacture.AVOIR ? 'A' : 'F';

    const derniere = await this.repo
      .createQueryBuilder('f')
      .where('f.entrepriseId = :entrepriseId AND f.type = :type AND f.numero LIKE :prefix', {
        entrepriseId,
        type,
        prefix: `${prefix}-${annee}-%`,
      })
      .orderBy('f.createdAt', 'DESC')
      .getOne();

    const sequence = derniere ? parseInt(derniere.numero.split('-')[2], 10) + 1 : 1;
    return `${prefix}-${annee}-${String(sequence).padStart(4, '0')}`;
  }

  async findAll(entrepriseId: string, query: FactureQuery) {
    const { skip, take } = getPagination(query.page, query.limit);

    const qb = this.repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.client', 'c')
      .leftJoinAndSelect('f.createur', 'u')
      .where('f.entrepriseId = :entrepriseId', { entrepriseId });

    if (query.statut) qb.andWhere('f.statut = :statut', { statut: query.statut });
    if (query.clientId) qb.andWhere('f.clientId = :clientId', { clientId: query.clientId });

    const [factures, total] = await qb.orderBy('f.createdAt', 'DESC').skip(skip).take(take).getManyAndCount();

    return {
      factures,
      total,
      page: query.page || 1,
      limit: query.limit || 20,
    };
  }

  findByIdWithDetails(id: string, entrepriseId: string): Promise<Facture | null> {
    return this.repo.findOne({
      where: { id, entrepriseId },
      relations: ['entreprise', 'client', 'createur', 'lignes', 'paiements'],
      order: { lignes: { ordre: 'ASC' }, paiements: { createdAt: 'DESC' } },
    });
  }

  createWithLignesAndStock(
    entrepriseId: string,
    userId: string,
    numero: string,
    type: TypeFacture,
    input: CreateFactureInput,
    montants: { sousTotal: number; montantTva: number; montantTotal: number },
    lignesCalc: Array<LigneInput & { tva: number; montantHT: number; montantTTC: number; ordre: number }>,
  ): Promise<Facture | null> {
    return AppDataSource.transaction(async (manager) => {
      const facture = manager.create(Facture, {
        entrepriseId,
        creePar: userId,
        clientId: input.clientId,
        type,
        numero,
        statut: StatutFacture.BROUILLON,
        dateEcheance: input.dateEcheance,
        notes: input.notes,
        conditionsPaiement: input.conditionsPaiement,
        sousTotal: montants.sousTotal,
        montantTva: montants.montantTva,
        montantTotal: montants.montantTotal,
      });
      await manager.save(facture);

      const lignes = lignesCalc.map((l) => manager.create(LigneFacture, {
        factureId: facture.id,
        produitId: l.produitId,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        tva: l.tva,
        montantHT: l.montantHT,
        montantTTC: l.montantTTC,
        ordre: l.ordre,
      }));
      await manager.save(lignes);

      if (type === TypeFacture.FACTURE) {
        for (const ligne of lignesCalc.filter((l) => l.produitId)) {
          const produit = await manager.findOneBy(Produit, { id: ligne.produitId });
          if (!produit) continue;

          const nvStock = Math.max(0, Number(produit.stockActuel) - ligne.quantite);
          await manager.update(Produit, produit.id, { stockActuel: nvStock });

          await manager.save(manager.create(MouvementStock, {
            produitId: produit.id,
            type: TypeMouvement.SORTIE,
            quantite: ligne.quantite,
            quantiteAvant: Number(produit.stockActuel),
            quantiteApres: nvStock,
            motif: `Facture ${numero}`,
            reference: numero,
          }));
        }
      }

      return manager.findOne(Facture, {
        where: { id: facture.id },
        relations: ['lignes', 'client'],
      });
    });
  }

  async changeStatut(id: string, entrepriseId: string, statut: StatutFacture): Promise<Facture | null> {
    await this.repo.update({ id, entrepriseId }, { statut });
    return this.repo.findOneBy({ id, entrepriseId });
  }

  async findById(id: string): Promise<Facture | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['lignes', 'client', 'paiements'],
    });
  }

  async transformer(
    entrepriseId: string,
    userId: string,
    originalId: string,
    nouveauType: TypeFacture,
  ): Promise<Facture | null> {
    const originale = await this.repo.findOne({
      where: { id: originalId, entrepriseId },
      relations: ['lignes'],
    });

    if (!originale) return null;

    // Générer le nouveau numéro
    const nouveauNumero = await this.getNextNumero(entrepriseId, nouveauType);

    // Créer la nouvelle facture
    const nouvelle = await AppDataSource.transaction(async (manager) => {
      const facture = manager.create(Facture, {
        entrepriseId,
        creePar: userId,
        clientId: originale.clientId,
        type: nouveauType,
        numero: nouveauNumero,
        statut: StatutFacture.BROUILLON,
        dateEcheance: originale.dateEcheance,
        notes: originale.notes,
        conditionsPaiement: originale.conditionsPaiement,
        sousTotal: originale.sousTotal,
        montantTva: originale.montantTva,
        montantTotal: originale.montantTotal,
        factureOriginaleId: originalId,
      });
      await manager.save(facture);

      // Copier les lignes
      for (const ligne of originale.lignes) {
        const nouvelleLigne = manager.create(LigneFacture, {
          factureId: facture.id,
          produitId: ligne.produitId,
          designation: ligne.designation,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          tva: ligne.tva,
          montantHT: ligne.montantHT,
          montantTTC: ligne.montantTTC,
          ordre: ligne.ordre,
        });
        await manager.save(nouvelleLigne);
      }

      // Marquer l'originale comme transformée
      await manager.update(Facture, originalId, { 
        statut: nouveauType === TypeFacture.FACTURE ? StatutFacture.ENVOYEE : originale.statut 
      });

      return manager.findOne(Facture, {
        where: { id: facture.id },
        relations: ['lignes', 'client'],
      });
    });

    return nouvelle;
  }

  async signer(id: string, entrepriseId: string, signature: string): Promise<Facture | null> {
    await this.repo.update(
      { id, entrepriseId },
      { 
        signature,
        dateSignature: new Date(),
        signe: true,
      }
    );
    return this.repo.findOneBy({ id, entrepriseId });
  }
}
