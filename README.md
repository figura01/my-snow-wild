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
- [x] Récapitulatif, facturation et paiement (simulé testé ; Stripe test prêt, à brancher avec les clés)
- [x] Réservations : consultation côté admin, « Mon compte » côté client
- [x] Utilisateurs : gestion côté admin (rôles, suppression avec garde-fous)
- [x] Maintenance du matériel par taille (motif, retour prévu, historique, alertes sur les réservations touchées)
- [x] Tests automatisés : Jest (API, sur une base PostgreSQL de test) et Jest + React Testing Library (front)
- [x] CI GitHub Actions : TypeScript, tests, build, images GHCR, déploiement SSH (activable)
- [~] Déploiement sur le VPS : images de prod, migrations, compose de prod et Caddy prêts (voir « Mise en production »)

## Mise en production (VPS)

Fichiers dans `deploy/` : `docker-compose.prod.yml`, `Caddyfile.snippet`, `.env.production.example`.

### 1. Générer la migration initiale (une fois, en local)

En production, TypeORM ne modifie jamais les tables tout seul : le schéma est créé
par des migrations versionnées, appliquées au démarrage de l'API. La première se
génère contre une base **vide** :

```bash
docker compose exec db createdb -U snowwild snowwild_migrations
docker compose exec -e POSTGRES_DB=snowwild_migrations backend \
  npm run migration:generate -- src/migrations/Init
docker compose exec db dropdb -U snowwild snowwild_migrations
```

Le fichier apparaît dans `backend/src/migrations/` : committe-le.

À chaque modification d'entité, même principe, mais en appliquant d'abord les
migrations existantes à la base temporaire, pour ne générer que la différence :

```bash
docker compose exec db createdb -U snowwild snowwild_migrations
docker compose exec -e POSTGRES_DB=snowwild_migrations backend npm run migration:run:dev
docker compose exec -e POSTGRES_DB=snowwild_migrations backend \
  npm run migration:generate -- src/migrations/AddX
docker compose exec db dropdb -U snowwild snowwild_migrations
```

### 2. Préparer le VPS

En ligne sur **https://snow-wild.laurent-vuillaume.ovh** (VPS `51.91.99.187`, utilisateur `ubuntu`).

```bash
ssh ubuntu@51.91.99.187 "sudo mkdir -p /srv/snow-wild && sudo chown ubuntu:ubuntu /srv/snow-wild"
scp deploy/docker-compose.prod.yml deploy/.env.production.example deploy/Caddyfile.snippet ubuntu@51.91.99.187:/srv/snow-wild/
```

Sur le VPS, dans `/srv/snow-wild` : copier `.env.production.example` en `.env` (`chmod 600`) et
générer les secrets sur place (`openssl rand -hex 32`). `PROXY_NETWORK=vps-infra_web` est le
réseau du Caddy de `/srv/vps-infra`. Sur ce réseau partagé, les conteneurs sont joignables
sous les noms uniques `snow-wild-frontend` et `snow-wild-backend`.

Ajouter `Caddyfile.snippet` à la fin de `/srv/vps-infra/Caddyfile` (après une copie de
sauvegarde), puis :

```bash
docker exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Premier démarrage et catalogue de démonstration :

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend node dist/seed-demo.js
```

L'administrateur (`ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env`) n'est créé qu'au premier démarrage.

### 3. Déploiement automatique

Dans le dépôt GitHub (Settings > Secrets and variables > Actions) :
- **Repository secrets** `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (clé SSH dédiée,
  `~/.ssh/snow-wild-deploy`, autorisée sur le VPS) ;

Chaque push sur `main` vérifie le code (TypeScript, tests, build), publie les images sur GHCR,
puis met à jour le VPS. Les migrations sont appliquées au démarrage de l'API.

### 4. Stripe en production (mode test)

Dans le tableau de bord Stripe, ajouter un endpoint webhook
`https://<ton-domaine>/stripe/webhook` (événements `checkout.session.completed`
et `checkout.session.expired`), puis renseigner `STRIPE_SECRET_KEY` et
`STRIPE_WEBHOOK_SECRET` dans le `.env` du VPS.

## Tests automatisés

```bash
docker compose exec backend npm test    # API : règles de dates, devis, disponibilité, concurrence, autorisations
docker compose exec frontend npm test   # Front : store du panier, utilitaires, composants
```

Les tests de l'API utilisent une base dédiée (`<POSTGRES_DB>_test`), créée automatiquement
et vidée entre chaque test : les données de développement ne sont jamais touchées.
