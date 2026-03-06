import * as XLSX from 'xlsx';
import { stringify } from 'csv-stringify/sync';
import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Facture, Client, Produit, Fournisseur, EcritureComptable } from '../entities';

export class ExportService {
  /**
   * Export des factures en Excel ou CSV
   */
  static async exportFactures(entrepriseId: string, format: 'excel' | 'csv', res: Response) {
    const factures = await AppDataSource.getRepository(Facture).find({
      where: { entrepriseId },
      relations: ['client', 'createur'],
      order: { createdAt: 'DESC' },
    });

    const data = factures.map(f => ({
      'Numéro': f.numero,
      'Type': f.type,
      'Statut': f.statut,
      'Client': f.client?.nom || 'Aucun',
      'Montant HT': f.sousTotal,
      'TVA': f.montantTva,
      'Montant TTC': f.montantTotal,
      'Montant Payé': f.montantPaye,
      'Date Emission': f.dateEmission,
      'Date Échéance': f.dateEcheance,
      'Signé': f.signe ? 'Oui' : 'Non',
    }));

    return this.sendExport(res, data, 'factures', format);
  }

  /**
   * Export des clients en Excel ou CSV
   */
  static async exportClients(entrepriseId: string, format: 'excel' | 'csv', res: Response) {
    const clients = await AppDataSource.getRepository(Client).find({
      where: { entrepriseId },
      order: { createdAt: 'DESC' },
    });

    const data = clients.map(c => ({
      'Code': c.code || '',
      'Nom': c.nom,
      'Prénom': c.prenom || '',
      'Type': c.type,
      'Téléphone': c.telephone || '',
      'Email': c.email || '',
      'Adresse': c.adresse || '',
      'Quartier': c.quartier || '',
      'Ville': c.ville || '',
      'Notes': c.notes || '',
    }));

    return this.sendExport(res, data, 'clients', format);
  }

  /**
   * Export des produits en Excel ou CSV
   */
  static async exportProduits(entrepriseId: string, format: 'excel' | 'csv', res: Response) {
    const produits = await AppDataSource.getRepository(Produit).find({
      where: { entrepriseId },
      relations: ['categorie'],
      order: { createdAt: 'DESC' },
    });

    const data = produits.map(p => ({
      'Référence': p.reference || '',
      'Désignation': p.nom,
      'Catégorie': p.categorie?.nom || 'Aucune',
      'Prix Achat': p.prixAchat,
      'Prix Vente': p.prixVente,
      'Stock Actuel': p.stockActuel,
      'Stock Minimum': p.stockMinimum,
      'Unité': p.unite || 'Unité',
      'TVA': p.tva || 18,
    }));

    return this.sendExport(res, data, 'produits', format);
  }

  /**
   * Export des fournisseurs en Excel ou CSV
   */
  static async exportFournisseurs(entrepriseId: string, format: 'excel' | 'csv', res: Response) {
    const fournisseurs = await AppDataSource.getRepository(Fournisseur).find({
      where: { entrepriseId },
      order: { createdAt: 'DESC' },
    });

    const data = fournisseurs.map(f => ({
      'Nom': f.nom,
      'Téléphone': f.telephone || '',
      'Email': f.email || '',
      'Adresse': f.adresse || '',
      'Ville': f.ville || '',
      'NINEA': f.ninea || '',
      'Notes': f.notes || '',
      'Actif': f.actif ? 'Oui' : 'Non',
    }));

    return this.sendExport(res, data, 'fournisseurs', format);
  }

  /**
   * Export du grand livre en Excel ou CSV
   */
  static async exportGrandLivre(entrepriseId: string, format: 'excel' | 'csv', res: Response, exercice?: number) {
    const query = AppDataSource.getRepository(EcritureComptable)
      .createQueryBuilder('e')
      .where('e.entrepriseId = :entrepriseId', { entrepriseId });

    if (exercice) {
      query.andWhere('EXTRACT(YEAR FROM e.date) = :exercice', { exercice });
    }

    const ecritures = await query.orderBy('e.date', 'ASC').getMany();

    const data = ecritures.map(e => ({
      'Date': e.date,
      'Pièce': e.pieceRef || '',
      'Journal': e.journal,
      'Compte': e.numeroCompte,
      'Libellé Compte': e.libelleCompte,
      'Libellé': e.libelle,
      'Débit': e.debit || 0,
      'Crédit': e.credit || 0,
    }));

    return this.sendExport(res, data, `grand_livre_${exercice || 'all'}`, format);
  }

  /**
   * Envoi du fichier exporté
   */
  private static sendExport(res: Response, data: any[], filename: string, format: 'excel' | 'csv') {
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}`;

    res.setHeader('Content-Type', format === 'excel' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fullFilename}.${format === 'excel' ? 'xlsx' : 'csv'}"`);

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return res.send(buffer);
    } else {
      const csv = stringify(data, { header: true });
      return res.send(csv);
    }
  }
}

