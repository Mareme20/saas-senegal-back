import PDFDocument from 'pdfkit';
import { Facture } from '../../entities/Facture';
import path from 'path';
import fs from 'fs';

export class PdfService {

  static async genererFacture(facture: Facture): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const colors = {
        primary: '#0f766e',
        primarySoft: '#ccfbf1',
        dark: '#0f172a',
        muted: '#64748b',
        light: '#f8fafc',
        border: '#e2e8f0',
      };
      const e = facture.entreprise;
      const typeLabel = facture.type === 'DEVIS' ? 'DEVIS' : facture.type === 'AVOIR' ? 'AVOIR' : 'FACTURE';
      const clientFullName = this.clientLabel(facture);

      // ── En-tête ──────────────────────────────────────────────
      doc.rect(0, 0, 595, 140).fill(colors.light);
      doc.rect(0, 0, 595, 8).fill(colors.primary);
      doc.roundedRect(360, 24, 180, 70, 10).fill(colors.primary);

      const logoPath = this.resolveLogoPath(e?.logo);
      if (logoPath) {
        try {
          doc.image(logoPath, 50, 26, { fit: [62, 62], align: 'center', valign: 'center' });
          doc.roundedRect(47, 23, 68, 68, 12).lineWidth(1).stroke(colors.border);
        } catch {
          // Ignore logo loading failures to avoid breaking PDF generation
        }
      }

      doc.fillColor(colors.dark).fontSize(20).font('Helvetica-Bold')
        .text(e?.nom || 'Entreprise', 128, 30, { width: 220 });
      doc.fillColor(colors.muted).fontSize(10).font('Helvetica')
        .text(e?.adresse || '', 128, 56, { width: 220 });
      if (e?.ville) doc.text(e.ville, 128, 70, { width: 220 });
      if (e?.telephone) doc.text(`Tel: ${e.telephone}`, 128, 84, { width: 220 });
      if (e?.email) doc.text(e.email, 128, 98, { width: 220 });

      doc.fillColor('white').fontSize(27).font('Helvetica-Bold')
        .text(typeLabel, 372, 35, { width: 155, align: 'right' });
      doc.fontSize(11).font('Helvetica')
        .text(`No ${facture.numero}`, 372, 68, { width: 155, align: 'right' });

      // ── Infos document ────────────────────────────────────────
      doc.fillColor(colors.dark);
      let y = 160;

      // Boîte client (gauche)
      doc.roundedRect(50, y, 240, 110, 10).fill('white').lineWidth(1).stroke(colors.border);
      doc.fillColor(colors.primary).fontSize(9).font('Helvetica-Bold')
        .text('FACTURÉ À', 62, y + 10);
      doc.fillColor(colors.dark).fontSize(11).font('Helvetica-Bold')
        .text(clientFullName, 62, y + 25);
      doc.fontSize(10).font('Helvetica').fillColor(colors.muted);
      if (facture.client?.telephone) doc.text(`Tel: ${facture.client.telephone}`, 62, y + 43);
      if (facture.client?.email) doc.text(facture.client.email, 62, y + 57);
      if (facture.client?.adresse) doc.text(facture.client.adresse, 62, y + 71);
      if (facture.client?.quartier || facture.client?.ville) {
        doc.text(`${facture.client.quartier || ''} ${facture.client.ville || ''}`.trim(), 62, y + 85);
      }

      // Boîte dates (droite)
      doc.roundedRect(310, y, 235, 110, 10).fill('white').lineWidth(1).stroke(colors.border);
      const infoRows = [
        ['Date d\'émission:', new Date(facture.dateEmission).toLocaleDateString('fr-FR')],
        ['Numéro:', facture.numero],
        ...(facture.dateEcheance ? [['Échéance:', new Date(facture.dateEcheance).toLocaleDateString('fr-FR')]] : []),
        ['Statut:', this.statutLabel(facture.statut)],
      ];
      infoRows.forEach(([label, val], i) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.muted)
          .text(label, 322, y + 14 + i * 22);
        doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
          .text(val, 420, y + 13 + i * 22);
      });

      // ── Tableau des lignes ────────────────────────────────────
      y += 130;
      const colX = [50, 265, 345, 400, 450];
      const headers = ['Désignation', 'Qté', 'P.U. HT', 'TVA%', 'Montant TTC'];

      // Header tableau
      doc.roundedRect(50, y, 495, 24, 8).fill(colors.dark);
      headers.forEach((h, i) => {
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
          .text(h, colX[i] + 4, y + 8, { width: (colX[i + 1] || 545) - colX[i] - 8, align: i > 0 ? 'right' : 'left' });
      });

      y += 24;
      const lignes = facture.lignes || [];
      lignes.forEach((ligne, idx) => {
        const bg = idx % 2 === 0 ? 'white' : colors.light;
        doc.rect(50, y, 495, 22).fill(bg).stroke(colors.border);

        doc.fillColor(colors.dark).fontSize(9).font('Helvetica')
          .text(ligne.designation, colX[0] + 4, y + 7, { width: 210 });
        doc.text(String(Number(ligne.quantite)), colX[1] + 4, y + 7, { width: 74, align: 'right' });
        doc.text(this.formatMontant(Number(ligne.prixUnitaire)), colX[2] + 4, y + 7, { width: 50, align: 'right' });
        doc.text(`${Number(ligne.tva)}%`, colX[3] + 4, y + 7, { width: 44, align: 'right' });
        doc.text(this.formatMontant(Number(ligne.montantTTC)), colX[4] + 4, y + 7, { width: 90, align: 'right' });
        y += 22;
      });

      // ── Totaux ────────────────────────────────────────────────
      y += 14;
      const totaux = [
        ['Sous-total HT', this.formatMontant(Number(facture.sousTotal))],
        [`TVA (${this.tvaLabel(lignes)})`, this.formatMontant(Number(facture.montantTva))],
        ['TOTAL TTC', this.formatMontant(Number(facture.montantTotal))],
        ...(Number(facture.montantPaye) > 0 ? [
          ['Montant payé', this.formatMontant(Number(facture.montantPaye))],
          ['Reste à payer', this.formatMontant(Number(facture.montantTotal) - Number(facture.montantPaye))],
        ] : []),
      ];

      totaux.forEach(([label, val], i) => {
        const isTotal = label === 'TOTAL TTC';
        const rowY = y + i * 23;
        if (isTotal) doc.roundedRect(355, rowY - 3, 190, 26, 8).fill(colors.primary);
        doc.fillColor(isTotal ? 'white' : colors.dark)
          .fontSize(isTotal ? 11 : 10)
          .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
          .text(label, 360, rowY + 2, { width: 90 })
          .text(val, 420, rowY + 2, { width: 120, align: 'right' });
      });

      // ── Conditions & Notes ────────────────────────────────────
      const finalY = y + totaux.length * 23 + 20;
      if (facture.conditionsPaiement || facture.notes) {
        doc.moveTo(50, finalY).lineTo(545, finalY).stroke(colors.border);
        let noteY = finalY + 10;
        if (facture.conditionsPaiement) {
          doc.fillColor(colors.primary).fontSize(9).font('Helvetica-Bold').text('Conditions de paiement', 50, noteY);
          doc.fillColor(colors.dark).font('Helvetica').text(facture.conditionsPaiement, 50, noteY + 12);
          noteY += 30;
        }
        if (facture.notes) {
          doc.fillColor(colors.primary).fontSize(9).font('Helvetica-Bold').text('Notes', 50, noteY);
          doc.fillColor(colors.muted).font('Helvetica').text(facture.notes, 50, noteY + 12);
        }
      }

      // ── Pied de page ──────────────────────────────────────────
      doc.rect(0, 780, 595, 60).fill(colors.dark);
      doc.fillColor('#cbd5e1').fontSize(8)
        .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} — ${e?.nom || ''}`, 50, 795, { align: 'center', width: 495 });
      if (e?.siret) {
        doc.text(`NINEA: ${e.siret}`, 50, 808, { align: 'center', width: 495 });
      }

      doc.end();
    });
  }

  private static formatMontant(v: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v) + ' FCFA';
  }

  private static tvaLabel(lignes: any[]): string {
    const taux = [...new Set(lignes.map(l => Number(l.tva)))];
    return taux.length === 1 ? `${taux[0]}%` : 'mixte';
  }

  private static statutLabel(s: string): string {
    const map: Record<string, string> = {
      BROUILLON: 'Brouillon', ENVOYEE: 'Envoyée', PARTIELLEMENT_PAYEE: 'Partiel',
      PAYEE: 'Payée ✓', EN_RETARD: 'En retard', ANNULEE: 'Annulée',
    };
    return map[s] || s;
  }

  private static clientLabel(facture: Facture): string {
    const nom = facture.client?.nom?.trim() || '';
    const prenom = facture.client?.prenom?.trim() || '';
    const full = `${prenom} ${nom}`.trim();
    return full || 'Client non défini';
  }

  private static resolveLogoPath(logo?: string): string | null {
    if (!logo) return null;

    const relative = logo.startsWith('/uploads/')
      ? logo.replace('/uploads/', '')
      : logo.startsWith('uploads/')
        ? logo.replace('uploads/', '')
        : logo;
    const local = path.join(process.cwd(), process.env.UPLOAD_DIR || './uploads', relative);
    if (fs.existsSync(local)) return local;
    return null;
  }

  static async sauvegarderPdf(buffer: Buffer, filename: string): Promise<string> {
    const dir = process.env.UPLOAD_DIR || './uploads';
    const pdfsDir = path.join(dir, 'factures');
    if (!fs.existsSync(pdfsDir)) fs.mkdirSync(pdfsDir, { recursive: true });
    const filepath = path.join(pdfsDir, filename);
    fs.writeFileSync(filepath, buffer);
    return filepath;
  }
}
