import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Entreprise } from './Entreprise';
import { Produit } from './Produit';

@Entity('categories')
export class Categorie {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entrepriseId!: string;

  @Column({ length: 100 })
  nom!: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Entreprise, (e) => e.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entrepriseId' })
  entreprise!: Entreprise;

  @OneToMany(() => Produit, (p) => p.categorie)
  produits!: Produit[];
}
