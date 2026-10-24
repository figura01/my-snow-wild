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

### Modèle de données

- `Category` 1—n `Material` (référence : nom, prix par jour, visibilité)
- `Material` 1—n `MaterialVariant` (taille + stock de cette taille)
- `Reservation` (période du … au …, statut, total) 1—n `ReservationItem` (taille réservée, quantité, prix figé)

Disponible sur une période = stock de la taille − quantités des réservations `PENDING`/`PAID` qui chevauchent la période.
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

Données de démonstration (catégories et matériels) :
`docker compose up -d --build backend` puis `docker compose exec backend npm run seed:demo`.

Les dépendances npm sont installées automatiquement au démarrage des conteneurs :
après l'ajout d'un paquet, un simple `docker compose restart frontend` (ou `backend`) suffit.

Pour l'autocomplétion dans l'éditeur, installe aussi les dépendances en local :
`cd backend && npm install`, puis `cd ../frontend && npm install`.

## Avancement (MVP)

- [x] Socle : Docker Compose, PostgreSQL, API GraphQL, front Next.js
- [x] Authentification JWT, rôles ADMIN / USER, layouts USER et ADMIN
- [x] Catégories et matériels : références, tailles et stock par taille, CRUD admin
- [x] Catalogue et recherche par nom, catégorie et plage de dates (disponibilité par taille)
- [x] Panier (Zustand, persistant en localStorage) avec devis recalculé par l'API
- [~] Récapitulatif, facturation et paiement Stripe (mode test) — écrit, reste à tester
- [~] Réservations : consultation côté admin — écrit, reste à tester
- [ ] Utilisateurs : gestion côté admin
- [ ] Tests (Jest, React Testing Library) et CI GitHub Actions
- [ ] Déploiement sur le VPS (Docker, Caddy)
