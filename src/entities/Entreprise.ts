import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Utilisateur } from './Utilisateur';
import { Produit } from './Produit';
import { Client } from './Client';
import { Facture } from './Facture';
import { Paiement } from './Paiement';
import { Categorie } from './Categorie';

export enum Plan {
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

@Entity('entreprises')
export class Entreprise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  nom!: string;

  @Column({ nullable: true, unique: true })
  siret?: string;  // NINEA au Sénégal

  @Column({ nullable: true })
  telephone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  adresse?: string;

  @Column({ nullable: true })
  ville?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ default: 'XOF' })
  devise!: string;

  @Column({ default: 'fr' })
  langue!: string;  // fr | wo

  @Column({ type: 'enum', enum: Plan, default: Plan.STARTER })
  plan!: Plan;

  @Column({ default: true })
  actif!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Utilisateur, (u) => u.entreprise)
  utilisateurs!: Utilisateur[];

  @OneToMany(() => Produit, (p) => p.entreprise)
  produits!: Produit[];

  @OneToMany(() => Client, (c) => c.entreprise)
  clients!: Client[];

  @OneToMany(() => Facture, (f) => f.entreprise)
  factures!: Facture[];

  @OneToMany(() => Paiement, (p) => p.entreprise)
  paiements!: Paiement[];

  @OneToMany(() => Categorie, (c) => c.entreprise)
  categories!: Categorie[];
}
