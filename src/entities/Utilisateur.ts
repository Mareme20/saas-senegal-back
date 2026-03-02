import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Unique,
} from 'typeorm';
import { Entreprise } from './Entreprise';
import { Facture } from './Facture';

export enum Role {
  GERANT = 'GERANT',
  COMPTABLE = 'COMPTABLE',
  CAISSIER = 'CAISSIER',
  EMPLOYE = 'EMPLOYE',
}

@Entity('utilisateurs')
@Unique(['email', 'entrepriseId'])
export class Utilisateur {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entrepriseId!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  telephone?: string;

  @Column({ select: false })  // Jamais retourné par défaut
  motDePasse!: string;

  @Column({ length: 50 })
  prenom!: string;

  @Column({ length: 50 })
  nom!: string;

  @Column({ type: 'enum', enum: Role, default: Role.EMPLOYE })
  role!: Role;

  @Column({ default: true })
  actif!: boolean;

  @Column({ nullable: true })
  dernierLogin?: Date;

  @Column({ nullable: true, select: false })
  refreshToken?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Entreprise, (e) => e.utilisateurs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entrepriseId' })
  entreprise!: Entreprise;

  @OneToMany(() => Facture, (f) => f.createur)
  factures!: Facture[];
}
