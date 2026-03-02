import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Entreprise } from './Entreprise';

@Entity('fournisseurs')
export class Fournisseur {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entrepriseId!: string;

  @Column({ length: 100 })
  nom!: string;

  @Column({ nullable: true })
  telephone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  adresse?: string;

  @Column({ nullable: true })
  ville?: string;

  @Column({ nullable: true })
  ninea?: string;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ default: true })
  actif!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Entreprise, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entrepriseId' })
  entreprise!: Entreprise;
}
