import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Facture } from './Facture';
import { Produit } from './Produit';

@Entity('lignes_facture')
export class LigneFacture {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  factureId!: string;

  @Column({ nullable: true })
  produitId?: string;

  @Column({ length: 200 })
  designation!: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantite!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  prixUnitaire!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 18 })
  tva!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  montantHT!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  montantTTC!: number;

  @Column({ default: 0 })
  ordre!: number;

  @ManyToOne(() => Facture, (f) => f.lignes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'factureId' })
  facture!: Facture;

  @ManyToOne(() => Produit, (p) => p.lignesFacture, { nullable: true })
  @JoinColumn({ name: 'produitId' })
  produit?: Produit;
}
