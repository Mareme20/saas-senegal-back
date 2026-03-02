import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Produit } from './Produit';

export enum TypeMouvement {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
  AJUSTEMENT = 'AJUSTEMENT',
  RETOUR = 'RETOUR',
}

@Entity('mouvements_stock')
export class MouvementStock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  produitId!: string;

  @Column({ type: 'enum', enum: TypeMouvement })
  type!: TypeMouvement;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantite!: number;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantiteAvant!: number;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantiteApres!: number;

  @Column({ nullable: true })
  motif?: string;

  @Column({ nullable: true })
  reference?: string;  // N° facture lié

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Produit, (p) => p.mouvementsStock)
  @JoinColumn({ name: 'produitId' })
  produit!: Produit;
}
