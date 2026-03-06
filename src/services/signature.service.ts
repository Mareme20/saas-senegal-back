import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AppDataSource } from '../config/database';
import { Facture } from '../entities/Facture';
import { Entreprise } from '../entities/Entreprise';
import * as fs from 'fs';
import * as path from 'path';

export class SignatureService {
  /**
   * Ajoute une signature numérique au PDF d'une facture
   */
  static async signerFacture(
    factureId: string,
    entrepriseId: string,
    signatureBase64: string
  ): Promise<Buffer> {
    // Récupérer la facture avec détails
    const facture = await AppDataSource.getRepository(Facture).findOne({
      where: { id: factureId, entrepriseId },
      relations: ['lignes', 'client', 'createur'],
    });

    if (!facture) {
      throw new Error('Facture introuvable');
    }

    // Récupérer les infos entreprise
    const entreprise = await AppDataSource.getRepository(Entreprise).findOne({
      where: { id: entrepriseId },
    });

    if (!entreprise) {
      throw new Error('Entreprise introuvable');
    }

    // Charger le PDF existant ou en générer un nouveau
    let pdfBytes: Buffer;
    
    // Vérifier si un PDF existe déjà
    const pdfPath = path.join(process.cwd(), 'uploads', 'factures', `${factureId}.pdf`);
    if (fs.existsSync(pdfPath)) {
      pdfBytes = fs.readFileSync(pdfPath);
    } else {
      // Générer un nouveau PDF
      pdfBytes = await this.genererPDF(facture, entreprise);
    }

    // Charger le document PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[pages.length - 1]; // Dernière page
    
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Ajouter le watermark "SIGNÉ"
    page.drawText('SIGNÉ', {
      x: width - 150,
      y: height - 50,
      size: 40,
      font: fontBold,
      color: rgb(0.8, 0.2, 0.2),
      opacity: 0.3,
    });

    // Ajouter les infos de signature en bas de page
    const signatureY = 80;
    
    // Ligne de signature
    page.drawLine({
      start: { x: 50, y: signatureY + 30 },
      end: { x: 250, y: signatureY + 30 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Texte "Signature"
    page.drawText('Signature:', {
      x: 50,
      y: signatureY + 35,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Ajouter l'image de signature (si Base64 valide)
    if (signatureBase64 && signatureBase64.startsWith('data:image')) {
      try {
        const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, '');
        const imageBytes = Buffer.from(base64Data, 'base64');
        
        let signatureImage;
        if (signatureBase64.includes('image/png')) {
          signatureImage = await pdfDoc.embedPng(imageBytes);
        } else {
          signatureImage = await pdfDoc.embedJpg(imageBytes);
        }

        const imgDims = signatureImage.scale(0.3);
        
        page.drawImage(signatureImage, {
          x: 50,
          y: signatureY,
          width: imgDims.width,
          height: imgDims.height,
        });
      } catch (e) {
        console.error('Erreur嵌入签名图片:', e);
      }
    }

    // Date de signature
    const dateSignature = new Date().toLocaleString('fr-FR');
    page.drawText(`Signé le: ${dateSignature}`, {
      x: 50,
      y: signatureY - 15,
      size: 8,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Informations entreprise
    page.drawText(`Document signé via ${entreprise.nom}`, {
      x: 50,
      y: signatureY - 30,
      size: 8,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Sauvegarder le PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Mettre à jour la facture avec les infos de signature
    await AppDataSource.getRepository(Facture).update(factureId, {
      signature: signatureBase64,
      dateSignature: new Date(),
    });

    return Buffer.from(modifiedPdfBytes);
  }

  /**
   * Génère un PDF basique pour la facture
   */
  private static async genererPDF(facture: Facture, entreprise: Entreprise): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width } = page.getSize();
    let y = 800;

    // En-tête
    page.drawText(entreprise.nom, {
      x: 50,
      y: y,
      size: 20,
      font: fontBold,
    });
    y -= 25;

    if (entreprise.adresse) {
      page.drawText(entreprise.adresse, { x: 50, y, size: 10, font });
      y -= 15;
    }
    if (entreprise.telephone) {
      page.drawText(`Tél: ${entreprise.telephone}`, { x: 50, y, size: 10, font });
      y -= 15;
    }
    if (entreprise.email) {
      page.drawText(entreprise.email, { x: 50, y, size: 10, font });
      y -= 30;
    }

    // Titre facture
    page.drawText(`${facture.type} N° ${facture.numero}`, {
      x: width - 200,
      y: 800,
      size: 16,
      font: fontBold,
    });

    y -= 40;

    // Infos client
    if (facture.client) {
      page.drawText('Client:', { x: 50, y, size: 12, font: fontBold });
      y -= 18;
      page.drawText(facture.client.nom, { x: 50, y, size: 10, font });
      y -= 15;
      if (facture.client.adresse) {
        page.drawText(facture.client.adresse, { x: 50, y, size: 10, font });
        y -= 15;
      }
    }

    y -= 30;

    // Tableau des lignes
    const startX = 50;
    const colWidths = [250, 80, 80, 80];
    const headers = ['Désignation', 'Qté', 'P.U.', 'Total'];

    // En-tête du tableau
    page.drawRectangle({
      x: startX,
      y: y - 5,
      width: 495,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    });

    let x = startX;
    headers.forEach((header, i) => {
      page.drawText(header, {
        x: x + 5,
        y: y,
        size: 10,
        font: fontBold,
      });
      x += colWidths[i];
    });

    y -= 25;

    // Lignes
    for (const ligne of facture.lignes || []) {
      x = startX;
      page.drawText(ligne.designation.substring(0, 35), {
        x,
        y,
        size: 9,
        font,
      });
      x += colWidths[0];
      page.drawText(String(ligne.quantite), { x, y, size: 9, font });
      x += colWidths[1];
      page.drawText(`${Number(ligne.prixUnitaire).toFixed(0)}`, { x, y, size: 9, font });
      x += colWidths[2];
      page.drawText(`${Number(ligne.montantTTC || 0).toFixed(0)}`, { x, y, size: 9, font });
      y -= 18;
    }

    y -= 20;

    // Totaux
    const totalsX = width - 200;
    page.drawText(`Sous-total: ${Number(facture.sousTotal).toFixed(0)} XOF`, {
      x: totalsX,
      y: y,
      size: 10,
      font,
    });
    y -= 18;
    page.drawText(`TVA (18%): ${Number(facture.montantTva).toFixed(0)} XOF`, {
      x: totalsX,
      y,
      size: 10,
      font,
    });
    y -= 20;
    page.drawText(`Total: ${Number(facture.montantTotal).toFixed(0)} XOF`, {
      x: totalsX,
      y,
      size: 12,
      font: fontBold,
    });

    return Buffer.from(await pdfDoc.save());
  }

  /**
   * Génère un QR code pour le paiement (intégration simple)
   */
  static genererQRPayment(
    entrepriseId: string,
    montant: number,
    reference: string
  ): string {
    // Format simple pour Wave/Orange - URL de paiement
    // En production, utiliser une vraie bibliothèque QR
    const paymentData = JSON.stringify({
      entrepriseId,
      amount: montant,
      ref: reference,
      currency: 'XOF',
    });
    
    return Buffer.from(paymentData).toString('base64');
  }
}

