import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Unique,
} from 'typeorm';
import { Entreprise } from './Entreprise';
import { Client } from './Client';
import { Utilisateur } from './Utilisateur';
import { LigneFacture } from './LigneFacture';
import { Paiement } from './Paiement';

export enum TypeFacture {
  DEVIS = 'DEVIS',
  FACTURE = 'FACTURE',
  AVOIR = 'AVOIR',
  BON_COMMANDE = 'BON_COMMANDE',
}

export enum StatutFacture {
  BROUILLON = 'BROUILLON',
  ENVOYEE = 'ENVOYEE',
  PARTIELLEMENT_PAYEE = 'PARTIELLEMENT_PAYEE',
  PAYEE = 'PAYEE',
  EN_RETARD = 'EN_RETARD',
  ANNULEE = 'ANNULEE',
}

@Entity('factures')
@Unique(['numero', 'entrepriseId'])
export class Facture {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entrepriseId!: string;

  @Column({ nullable: true })
  clientId?: string;

  @Column()
  creePar!: string;

  @Column({ length: 20 })
  numero!: string;  // F-2024-0001

  @Column({ type: 'enum', enum: TypeFacture, default: TypeFacture.FACTURE })
  type!: TypeFacture;

  @Column({ type: 'enum', enum: StatutFacture, default: StatutFacture.BROUILLON })
  statut!: StatutFacture;

  @CreateDateColumn()
  dateEmission!: Date;

  @Column({ nullable: true })
  dateEcheance?: Date;

  @Column({ nullable: true })
  dateReglement?: Date;

  // Montants (dénormalisés pour performance)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  sousTotal!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantTva!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantTotal!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantPaye!: number;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ nullable: true })
  conditionsPaiement?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Entreprise, (e) => e.factures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entrepriseId' })
  entreprise!: Entreprise;

  @ManyToOne(() => Client, (c) => c.factures, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client?: Client;

  @ManyToOne(() => Utilisateur, (u) => u.factures)
  @JoinColumn({ name: 'creePar' })
  createur!: Utilisateur;

  @OneToMany(() => LigneFacture, (l) => l.facture, { cascade: true })
  lignes!: LigneFacture[];

  @OneToMany(() => Paiement, (p) => p.facture)
  paiements!: Paiement[];
}
