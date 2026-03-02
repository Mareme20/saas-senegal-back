import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Entreprise } from './Entreprise';
import { Facture } from './Facture';

export enum MethodePaiement {
  ESPECES = 'ESPECES',
  WAVE = 'WAVE',
  ORANGE_MONEY = 'ORANGE_MONEY',
  FREE_MONEY = 'FREE_MONEY',
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
  CARTE = 'CARTE',
}

export enum StatutPaiement {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRME = 'CONFIRME',
  ECHOUE = 'ECHOUE',
  REMBOURSE = 'REMBOURSE',
}

@Entity('paiements')
export class Paiement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entrepriseId!: string;

  @Column({ nullable: true })
  factureId?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  montant!: number;

  @Column({ type: 'enum', enum: MethodePaiement })
  methode!: MethodePaiement;

  @Column({ type: 'enum', enum: StatutPaiement, default: StatutPaiement.EN_ATTENTE })
  statut!: StatutPaiement;

  @Column({ nullable: true })
  reference?: string;  // Référence transaction opérateur

  @Column({ nullable: true })
  transactionId?: string;  // ID Wave / Orange

  @Column({ nullable: true })
  telephone?: string;  // Numéro payeur

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Entreprise, (e) => e.paiements)
  @JoinColumn({ name: 'entrepriseId' })
  entreprise!: Entreprise;

  @ManyToOne(() => Facture, (f) => f.paiements, { nullable: true })
  @JoinColumn({ name: 'factureId' })
  facture?: Facture;
}
