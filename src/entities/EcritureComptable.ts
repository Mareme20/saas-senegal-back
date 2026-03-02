import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Entreprise } from './Entreprise';

export enum TypeJournal {
  VENTES = 'VENTES',
  ACHATS = 'ACHATS',
  CAISSE = 'CAISSE',
  BANQUE = 'BANQUE',
  OPERATIONS_DIVERSES = 'OPERATIONS_DIVERSES',
}

// Plan comptable SYSCOHADA simplifié
export enum ClasseCompte {
  CAPITAUX = '1',           // Comptes de capitaux
  IMMOBILISATIONS = '2',    // Immobilisations
  STOCKS = '3',             // Stocks
  TIERS = '4',              // Comptes de tiers (clients, fournisseurs)
  FINANCIERS = '5',         // Comptes financiers (caisse, banque)
  CHARGES = '6',            // Comptes de charges
  PRODUITS = '7',           // Comptes de produits
}

@Entity('ecritures_comptables')
export class EcritureComptable {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entrepriseId!: string;

  @Column({ type: 'enum', enum: TypeJournal })
  journal!: TypeJournal;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ length: 10 })
  numeroCompte!: string;  // Ex: 411000, 706000

  @Column({ length: 100 })
  libelleCompte!: string; // Ex: "Clients", "Ventes de marchandises"

  @Column({ length: 200 })
  libelle!: string;       // Description de l'opération

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  debit!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  credit!: number;

  @Column({ nullable: true })
  pieceRef?: string;      // N° facture / reçu lié

  @Column({ nullable: true })
  factureId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Entreprise, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entrepriseId' })
  entreprise!: Entreprise;
}
