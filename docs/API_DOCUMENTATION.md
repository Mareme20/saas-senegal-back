# Documentation API - SaaS Senegal

Base URL: `/api/v1`

## Auth
- `POST /auth/register`: créer une entreprise + compte admin
- `POST /auth/login`: connexion
- `GET /auth/me`: utilisateur courant

## Entreprise
- `GET /entreprise/public/liste`: liste publique `{id, nom}`
- `GET /entreprise`: infos entreprise courante (auth)
- `PUT /entreprise`: mise à jour entreprise (auth)

## Clients
- `GET /clients?page=1&limit=10&search=`: liste paginée
- `GET /clients/:id`: détail client
- `POST /clients`: création client
- `PUT /clients/:id`: mise à jour client

## Factures
- `GET /factures`: liste paginée
- `GET /factures/:id`: détail facture
- `POST /factures`: création facture
- `PATCH /factures/:id/statut`: changement de statut

## Paiements
- `GET /paiements?page=1&limit=20`: liste paiements
- `POST /paiements`: création paiement + synchronisation facture

## Stock
- `GET /stock/mouvements?page=1&limit=20`: mouvements de stock

## Dashboard
- `GET /dashboard/kpis`
- `GET /dashboard/ventes?jours=30`
- `GET /dashboard/top-produits`

## Catégories
- `GET /categories`: liste catégories
- `POST /categories`: création catégorie
- `PUT /categories/:id`: mise à jour catégorie
- `DELETE /categories/:id`: suppression catégorie

## Upload
- `POST /upload/logo`: upload logo entreprise
- `POST /upload/produit/:id/image`: upload image produit

## Webhooks
- `POST /webhooks/wave`: webhook Wave
- `POST /webhooks/orange`: webhook Orange Money
- `GET /webhooks/whatsapp`: vérification webhook WhatsApp
- `POST /webhooks/whatsapp`: réception messages WhatsApp

## Format de réponse
- Succès:
```json
{
  "success": true,
  "message": "Succès",
  "data": {}
}
```

- Pagination:
```json
{
  "success": true,
  "message": "Succès",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

## OpenAPI
La spécification OpenAPI est disponible dans `docs/openapi.yaml`.
