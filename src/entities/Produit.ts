import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Entreprise } from './Entreprise';
import { Categorie } from './Categorie';
import { LigneFacture } from './LigneFacture';
import { MouvementStock } from './MouvementStock';

@Entity('produits')
export class Produit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entrepriseId!: string;

  @Column({ nullable: true })
  categorieId?: string;

  @Column({ nullable: true })
  reference?: string;

  @Column({ nullable: true })
  codeBarres?: string;

  @Column({ length: 200 })
  nom!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  prixVente!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  prixAchat?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 18 })
  tva!: number;  // TVA Sénégal 18%

  @Column({ default: 'pièce' })
  unite!: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  stockActuel!: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  stockMinimum!: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  stockMaximum?: number;

  @Column({ default: true })
  actif!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Entreprise, (e) => e.produits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entrepriseId' })
  entreprise!: Entreprise;

  @ManyToOne(() => Categorie, (c) => c.produits, { nullable: true })
  @JoinColumn({ name: 'categorieId' })
  categorie?: Categorie;

  @OneToMany(() => LigneFacture, (l) => l.produit)
  lignesFacture!: LigneFacture[];

  @OneToMany(() => MouvementStock, (m) => m.produit)
  mouvementsStock!: MouvementStock[];
}
