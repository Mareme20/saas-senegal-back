import 'reflect-metadata';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { Entreprise, Utilisateur, Role, Categorie, Produit, Client, TypeClient } from '../entities';

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Seed TypeORM démarré...');

  const entrepriseRepo = AppDataSource.getRepository(Entreprise);
  const userRepo = AppDataSource.getRepository(Utilisateur);
  const categorieRepo = AppDataSource.getRepository(Categorie);
  const produitRepo = AppDataSource.getRepository(Produit);
  const clientRepo = AppDataSource.getRepository(Client);

  // Entreprise de démonstration
  let entreprise = await entrepriseRepo.findOneBy({ nom: 'Boutique Aminata' });
  if (!entreprise) {
    entreprise = entrepriseRepo.create({
      nom: 'Boutique Aminata',
      telephone: '+221 77 000 00 00',
      email: 'aminata@example.sn',
      adresse: 'Marché Sandaga, Dakar',
      ville: 'Dakar',
    });
    await entrepriseRepo.save(entreprise);
    console.log('✅ Entreprise créée:', entreprise.id);
  }

  // Gérant
  let gerant = await userRepo.findOneBy({ email: 'aminata@example.sn', entrepriseId: entreprise.id });
  if (!gerant) {
    const hash = await bcrypt.hash('password123', 12);
    gerant = userRepo.create({
      entrepriseId: entreprise.id,
      email: 'aminata@example.sn',
      motDePasse: hash,
      prenom: 'Aminata',
      nom: 'Diallo',
      telephone: '+221 77 000 00 00',
      role: Role.GERANT,
    });
    await userRepo.save(gerant);
    console.log('✅ Gérant créé');
  }

  // Catégories
  const cats = await categorieRepo.findBy({ entrepriseId: entreprise.id });
  if (cats.length === 0) {
    const [catAlim, catElec, catTex] = await categorieRepo.save([
      categorieRepo.create({ entrepriseId: entreprise.id, nom: 'Alimentation' }),
      categorieRepo.create({ entrepriseId: entreprise.id, nom: 'Électronique' }),
      categorieRepo.create({ entrepriseId: entreprise.id, nom: 'Textile' }),
    ]);
    console.log('✅ Catégories créées');

    // Produits
    await produitRepo.save([
      produitRepo.create({ entrepriseId: entreprise.id, categorieId: catAlim.id, nom: 'Riz parfumé 25kg', prixVente: 18000, prixAchat: 14000, stockActuel: 50, stockMinimum: 10, unite: 'sac', reference: 'RIZ-25KG' }),
      produitRepo.create({ entrepriseId: entreprise.id, categorieId: catAlim.id, nom: 'Huile végétale 5L', prixVente: 7500, prixAchat: 5500, stockActuel: 30, stockMinimum: 5, unite: 'bidon', reference: 'HUILE-5L' }),
      produitRepo.create({ entrepriseId: entreprise.id, categorieId: catAlim.id, nom: 'Sucre 1kg', prixVente: 950, prixAchat: 700, stockActuel: 3, stockMinimum: 20, unite: 'kg', reference: 'SUCRE-1KG' }), // stock bas!
      produitRepo.create({ entrepriseId: entreprise.id, categorieId: catElec.id, nom: 'Chargeur USB-C', prixVente: 5000, prixAchat: 2500, stockActuel: 15, stockMinimum: 5, unite: 'pièce', reference: 'CHG-USBC' }),
      produitRepo.create({ entrepriseId: entreprise.id, categorieId: catTex.id, nom: 'Tissu Wax 6 yards', prixVente: 12000, prixAchat: 8000, stockActuel: 25, stockMinimum: 5, unite: 'pièce', reference: 'WAX-6Y' }),
    ]);
    console.log('✅ Produits créés');
  }

  // Client de démo
  const clientExist = await clientRepo.findOneBy({ entrepriseId: entreprise.id, nom: 'Moussa Sow' });
  if (!clientExist) {
    await clientRepo.save(clientRepo.create({
      entrepriseId: entreprise.id,
      nom: 'Moussa Sow',
      telephone: '+221 70 111 22 33',
      quartier: 'Plateau',
      ville: 'Dakar',
      type: TypeClient.PARTICULIER,
    }));
    console.log('✅ Client créé');
  }

  console.log('\n📋 Compte de démonstration:');
  console.log('   Email        : aminata@example.sn');
  console.log('   Mot de passe : password123');
  console.log('   Entreprise ID:', entreprise.id);

  await AppDataSource.destroy();
}

seed().catch((e) => { console.error(e); process.exit(1); });
