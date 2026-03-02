import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Entreprise } from './Entreprise';
import { Facture } from './Facture';

export enum TypeClient {
  PARTICULIER = 'PARTICULIER',
  ENTREPRISE = 'ENTREPRISE',
  ADMINISTRATION = 'ADMINISTRATION',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entrepriseId!: string;

  @Column({ nullable: true })
  code?: string;

  @Column({ length: 100 })
  nom!: string;

  @Column({ nullable: true })
  prenom?: string;

  @Column({ nullable: true })
  telephone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  adresse?: string;

  @Column({ nullable: true })
  quartier?: string;  // Spécifique Sénégal

  @Column({ nullable: true })
  ville?: string;

  @Column({ type: 'enum', enum: TypeClient, default: TypeClient.PARTICULIER })
  type!: TypeClient;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Entreprise, (e) => e.clients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entrepriseId' })
  entreprise!: Entreprise;

  @OneToMany(() => Facture, (f) => f.client)
  factures!: Facture[];
}
