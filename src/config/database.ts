import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {
  Entreprise, Utilisateur, Categorie, Produit,
  MouvementStock, Client, Facture, LigneFacture,
  Paiement, Fournisseur, EcritureComptable,
} from '../entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['warn', 'error'],
  entities: [
    Entreprise, Utilisateur, Categorie, Produit,
    MouvementStock, Client, Facture, LigneFacture,
    Paiement, Fournisseur, EcritureComptable,
  ],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const getRepo = <T>(entity: new () => T) => AppDataSource.getRepository(entity);
