# Snow Wild

Application de réservation de matériel de ski : catalogue, recherche par dates,
panier, paiement et back-office d'administration.

Réécriture personnelle du projet réalisé en équipe de 5 pendant ma formation
**Concepteur Développeur d'Applications** (titre RNCP niveau 6) à la Wild Code School.

## Stack

| Couche | Technologies |
| --- | --- |
| Présentation | Next.js (App Router), React, Tailwind CSS, composants façon shadcn/ui, Apollo Client |
| Métier (API) | Node.js, Express, Apollo Server, GraphQL, TypeGraphQL |
| Accès aux données | TypeORM, PostgreSQL |
| Paiement | Stripe (mode test) — à venir |
| Infra | Docker Compose (dev), VPS + Caddy (prod) — à venir |

## Architecture

Architecture 3 couches :

- **`frontend/`** : présentation. Le navigateur appelle `/graphql` sur le même
  domaine ; Next.js relaie vers l'API (`next.config.ts`), ce qui garde le cookie
  d'authentification en « same-site ».
- **`backend/`** : couche métier (resolvers TypeGraphQL) et accès aux données
  (entités TypeORM). Une même classe sert d'entité et de type GraphQL.
- **PostgreSQL** : persistance.

### Sécurité

- Mots de passe hachés avec bcrypt ; jamais exposés par l'API.
- Session : JWT signé (HS256) dans un cookie `httpOnly`, `SameSite=Lax`, `Secure` en production.
- Autorisation côté serveur avec `@Authorized()` / `@Authorized("ADMIN")` (TypeGraphQL `authChecker`).
- L'inscription crée toujours un compte `USER` ; le premier `ADMIN` est créé au
  démarrage depuis `ADMIN_EMAIL` / `ADMIN_PASSWORD`, sans identifiant écrit en dur.

## Démarrer en local

Prérequis : Docker Desktop.

```bash
cp .env.example .env   # puis remplace les valeurs (un .env de dev peut déjà exister)
docker compose up --build
```

- Site : http://localhost:3000
- Back-office : http://localhost:3000/admin (identifiants `ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env`)
- API / Apollo Sandbox : http://localhost:4000/graphql
- pgAdmin : http://localhost:5050 (serveur : hôte `db`, port `5432`, identifiants `POSTGRES_*`)

Pour l'autocomplétion dans l'éditeur, installe aussi les dépendances en local :
`cd backend && npm install`, puis `cd ../frontend && npm install`.

## Avancement (MVP)

- [x] Socle : Docker Compose, PostgreSQL, API GraphQL, front Next.js
- [x] Authentification JWT, rôles ADMIN / USER, layouts USER et ADMIN
- [ ] Catégories et matériels (références + exemplaires en stock), CRUD admin
- [ ] Catalogue et recherche par nom et par plage de dates
- [ ] Panier (Zustand, persistant en localStorage)
- [ ] Récapitulatif, facturation et paiement Stripe (mode test)
- [ ] Réservations : consultation côté admin
- [ ] Utilisateurs : gestion côté admin
- [ ] Tests (Jest, React Testing Library) et CI GitHub Actions
- [ ] Déploiement sur le VPS (Docker, Caddy)
