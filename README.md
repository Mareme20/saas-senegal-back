# 🇸🇳 SaaS PME/TPE Sénégal — Backend API Complet

API REST Node.js/Express/TypeScript — Plateforme de gestion tout-en-un pour les PME/TPE sénégalaises.

## 🏗 Stack technique

| Technologie | Usage |
|---|---|
| Node.js 20+ / TypeScript | Runtime + typage |
| Express.js | Framework HTTP |
| TypeORM + PostgreSQL | Base de données |
| Redis | Cache + sessions |
| Socket.io | Temps réel (WebSocket) |
| PDFKit | Génération factures PDF |
| Africa's Talking | SMS |
| WhatsApp Business API | WhatsApp |
| Nodemailer | Emails |
| Wave API | Paiement Wave |
| Orange Money API | Paiement Orange |
| node-cron | Tâches planifiées |
| Zod | Validation |
| Pino | Logs |

---

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env (DATABASE_URL, JWT_SECRET au minimum)

# 3. Lancer PostgreSQL + Redis
docker-compose up -d

# 4. Créer les tables (auto en développement via synchronize: true)
# En production : npm run db:migration:run

# 5. Données de démonstration
npm run db:seed

# 6. Démarrer
npm run dev   # http://localhost:4000

# 7. Documentation API
# Swagger UI: http://localhost:4000/api/v1/docs
# OpenAPI YAML: http://localhost:4000/api/v1/docs/openapi.yaml
```

---

## 🧱 Architecture Clean (mise à jour)

Le backend est organisé avec séparation claire des responsabilités :

- `src/dtos/` : validation et contrats d'entrée/sortie (Zod + types inférés)
- `src/repositories/interfaces/` : contrats métier d'accès aux données
- `src/repositories/implementations/` : implémentations TypeORM
- `src/services/` : logique métier (les services dépendent des interfaces repository)
- `src/routes/` : orchestration HTTP uniquement (parse DTO + appel service + réponse)

Documentation API:
- `docs/API_DOCUMENTATION.md` (vue rapide)
- `docs/openapi.yaml` (spec OpenAPI 3.0)
- Swagger UI: `http://localhost:4000/api/v1/docs`
- OpenAPI servi par l'app: `http://localhost:4000/api/v1/docs/openapi.yaml`

---

## 📚 Swagger / OpenAPI

- Interface Swagger: `GET /api/v1/docs`
- Fichier OpenAPI: `GET /api/v1/docs/openapi.yaml`

Notes:
- Si l'interface Swagger ne se charge pas (CDN/réseau), `/api/v1/docs` affiche automatiquement un fallback avec la spec OpenAPI brute.
- La spec couvre les modules: Auth, Entreprise, Utilisateurs, Produits, Catégories, Clients, Fournisseurs, Factures, Paiements, Mobile Money, Dashboard, Comptabilité, Notifications, Upload, PDF, Webhooks.

---

## 📖 API — Tous les endpoints

### 🔐 Auth
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Créer compte entreprise + gérant |
| POST | `/api/v1/auth/login` | Connexion |
| POST | `/api/v1/auth/refresh` | Renouveler access token |
| POST | `/api/v1/auth/logout` | Déconnexion |
| GET | `/api/v1/auth/me` | Profil courant |

### 🏢 Entreprise
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/v1/entreprise` | Infos entreprise |
| PUT | `/api/v1/entreprise` | Modifier infos |

### 👥 Utilisateurs
| Méthode | Route | Description | Rôle requis |
|---|---|---|---|
| GET | `/api/v1/utilisateurs` | Liste équipe | GERANT |
| POST | `/api/v1/utilisateurs` | Créer membre | GERANT |
| PUT | `/api/v1/utilisateurs/:id` | Modifier | GERANT |
| PATCH | `/api/v1/utilisateurs/mot-de-passe` | Changer mdp | Tous |
| DELETE | `/api/v1/utilisateurs/:id` | Désactiver | GERANT |

### 📦 Produits & Stock
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/v1/produits` | Liste (filtrable: search, categorieId, stockBas) |
| POST | `/api/v1/produits` | Créer produit |
| GET | `/api/v1/produits/alertes` | Produits en stock bas |
| GET | `/api/v1/produits/:id` | Détail + mouvements |
| PUT | `/api/v1/produits/:id` | Modifier |
| DELETE | `/api/v1/produits/:id` | Supprimer (soft) |
| POST | `/api/v1/produits/:id/stock` | Ajuster stock (ENTREE/SORTIE/AJUSTEMENT/RETOUR) |
| GET | `/api/v1/stock/mouvements` | Historique mouvements |

### 🏷 Catégories
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/v1/categories` | Liste avec produits |
| POST | `/api/v1/categories` | Créer |
| PUT | `/api/v1/categories/:id` | Modifier |
| DELETE | `/api/v1/categories/:id` | Supprimer |

### 👤 Clients
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/v1/clients` | Liste (filtrable: search) |
| POST | `/api/v1/clients` | Créer client |
| GET | `/api/v1/clients/:id` | Détail + historique factures |
| PUT | `/api/v1/clients/:id` | Modifier |

### 🏭 Fournisseurs
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/v1/fournisseurs` | Liste |
| POST | `/api/v1/fournisseurs` | Créer |
| GET | `/api/v1/fournisseurs/:id` | Détail |
| PUT | `/api/v1/fournisseurs/:id` | Modifier |
| DELETE | `/api/v1/fournisseurs/:id` | Supprimer |

### 🧾 Facturation
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/v1/factures` | Liste (filtrable: statut, clientId) |
| POST | `/api/v1/factures` | Créer (DEVIS/FACTURE/AVOIR/BON_COMMANDE) |
| GET | `/api/v1/factures/:id` | Détail complet |
| PATCH | `/api/v1/factures/:id/statut` | Changer statut |
| GET | `/api/v1/pdf/factures/:id` | Télécharger PDF |

### 💰 Paiements
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/v1/paiements` | Historique |
| POST | `/api/v1/paiements` | Enregistrer paiement manuel |
| POST | `/api/v1/mobile-money/wave/initier` | Créer lien de paiement Wave |
| POST | `/api/v1/mobile-money/orange/initier` | Initier Orange Money |

### 📊 Dashboard & Analytiques
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/v1/dashboard/kpis` | KPIs (ventes jour/mois, impayés, stock) |
| GET | `/api/v1/dashboard/ventes?jours=30` | Ventes par jour |
| GET | `/api/v1/dashboard/top-produits` | Top 5 produits |

### 📒 Comptabilité SYSCOHADA
| Méthode | Route | Description | Rôle |
|---|---|---|---|
| GET | `/api/v1/comptabilite/grand-livre` | Grand livre | GERANT/COMPTABLE |
| GET | `/api/v1/comptabilite/balance` | Balance des comptes | GERANT/COMPTABLE |
| GET | `/api/v1/comptabilite/compte-resultat?exercice=2024` | Compte de résultat | GERANT/COMPTABLE |

### 🔔 Notifications
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/v1/notif/facture/:id/envoyer-sms` | Envoyer facture par SMS |
| POST | `/api/v1/notif/facture/:id/envoyer-whatsapp` | Envoyer facture par WhatsApp |

### 📁 Upload
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/v1/upload/logo` | Uploader logo entreprise |
| POST | `/api/v1/upload/produit/:id/image` | Uploader image produit |

### 🔗 Webhooks
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/v1/webhooks/wave` | Webhook paiement Wave |
| POST | `/api/v1/webhooks/orange` | Webhook paiement Orange Money |
| GET/POST | `/api/v1/webhooks/whatsapp` | Webhook WhatsApp Business |

---

## 🔐 Authentification

```bash
# Register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nomEntreprise":"Ma Boutique","prenom":"Fatou","nom":"Diallo","email":"fatou@example.sn","motDePasse":"monmdp123"}'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aminata@example.sn","motDePasse":"password123","entrepriseId":"ENTREPRISE_ID"}'

# Utiliser le token
curl http://localhost:4000/api/v1/dashboard/kpis \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## ⚡ WebSocket (temps réel)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: 'ACCESS_TOKEN' }
});

socket.on('nouvelle_vente', (data) => console.log('Vente:', data));
socket.on('paiement_recu', (data) => console.log('Paiement:', data));
socket.on('alerte_stock', (data) => console.log('Stock bas:', data));
socket.on('dashboard_update', () => console.log('Dashboard à rafraîchir'));
```

---

## 📁 Structure du projet

```
docs/
├── API_DOCUMENTATION.md        # Vue fonctionnelle
└── openapi.yaml                # Spec OpenAPI (Swagger)

src/
├── index.ts                    # Bootstrap (HTTP + WS + Cron)
├── app.ts                      # Express + middlewares + routes + docs
├── config/
│   ├── database.ts             # TypeORM DataSource
│   ├── logger.ts               # Pino logger
│   ├── redis.ts                # Redis client
│   └── swagger.ts              # HTML Swagger UI + fallback
├── controllers/                # Couche HTTP
├── dtos/                       # Schémas de validation (Zod)
├── entities/                   # Entités TypeORM
├── middlewares/
│   ├── auth.middleware.ts      # JWT + rôles + tenant
│   └── errorHandler.ts         # Gestion d'erreurs globale
├── repositories/
│   ├── interfaces/             # Contrats repository
│   └── implementations/        # Implémentations TypeORM
├── services/                   # Logique métier
│   ├── notifications/          # SMS, WhatsApp, Email
│   ├── payments/               # Wave, Orange Money
│   └── pdf/                    # Génération PDF
├── routes/                     # Définition endpoints API
├── jobs/
│   └── cron.ts                 # Tâches planifiées
├── websocket/
│   └── socket.ts               # Événements temps réel
├── utils/
│   ├── ApiError.ts
│   └── ApiResponse.ts
├── database/
│   └── seed.ts
└── __tests__/
    ├── auth.test.ts
    ├── facture.service.test.ts
    └── webhook.controller.test.ts
```

---

## 🌍 Spécificités sénégalaises

- **TVA 18%** par défaut (taux Sénégal BCEAO)
- **SYSCOHADA** : Plan comptable OHADA (grand livre, balance, compte de résultat)
- **Wave, Orange Money, Free Money** : intégrés nativement
- **Africa's Talking** : SMS locaux avec numéros sénégalais (+221)
- **Devise XOF (FCFA)** par défaut
- **Langues** : Français + Wolof (`langue: "fr" | "wo"`)
- **Multi-tenant** : Isolation stricte par entreprise (row-level)

---

## 🤖 Cron jobs automatiques

| Heure | Tâche |
|---|---|
| Tous les jours 8h00 | Alertes SMS stock bas |
| Tous les jours 9h00 | Marquage factures en retard + SMS |
| Lundi 7h30 | Rapport hebdomadaire par email |

---

## 🧪 Tests

```bash
npm test            # Lance tous les tests
npm run test:watch  # Mode watch
```

---

## 🐳 Docker

```bash
docker-compose up -d    # Lance PostgreSQL + Redis
docker-compose down     # Arrête tout
docker-compose logs -f  # Voir les logs
```
