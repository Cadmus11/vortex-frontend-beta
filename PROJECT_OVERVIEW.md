# Vortex Project Overview (Alpha + Beta)

A dual-repo style monorepo combining a backend server (alpha-vortex) and a frontend client (beta-vortex). The project supports a voting/election platform with facial recognition, media handling, and deployment artifacts for containerized environments.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Core Artifacts](#core-artifacts)
- [API Surface](#api-surface)
- [Data Models (High Level)](#data-models-high-level)
- [Local Setup](#local-setup)
- [Deployment & DevOps](#deployment-devops)
- [Testing & Quality](#testing--quality)
- [Security Considerations](#security-considerations)
- [Roadmap & Changelog](#roadmap--changelog)
- [Appendix: Key Files](#appendix-key-files)

## Overview
- Backend: `server/vortex-server-alpha` — Node.js/Express API with PostgreSQL via Drizzle ORM.
- Frontend: `client/vortex-frontend-beta` — React + TypeScript + Vite SPA with Tailwind and modern UI tooling.
- Deployment: Kubernetes manifests exist under `server/vortex-server-alpha/k8s` for containerized deployment.
- Shared concerns: Cloudinary-based media handling, facial recognition integration hooks, and JWT-based authentication.

## Architecture
- Client → API: The SPA communicates with REST endpoints prefixed by `/api` exposed by the Express server.
- Server layers:
  - Routing: `src/routes` provides modular endpoints (auth, users, elections, votes, media, face, etc.).
  - Services: `src/modules/*` implement business logic (elections, votes, users, etc.).
  - Data: Drizzle ORM connects to PostgreSQL; migrations live under `drizzle/migrations`.
  - Media/Identity: Cloudinary integration for media assets; facial recognition hooks for identity verification.
- Optional event publishing via ArcJet (dynamic import) for decoupled eventing.

## Tech Stack
- Backend
  - Runtime: Node.js (ES Modules)
  - Framework: Express
  - ORM/DB: Drizzle ORM + PostgreSQL (also Prisma present in dependencies)
  - Auth/Security: JWT (`jsonwebtoken`), bcrypt, Helmet, CORS
  - Media: Cloudinary
  - Utilities: dotenv, morgan, cookie-parser
  - Build/Dev: TypeScript, ts-node, nodemon, drizzle-kit
- Frontend
  - Framework: React with TypeScript
  - Build: Vite
  - Styling: Tailwind CSS
  - State/Queries: Zustand, React Query
  - Forms: react-hook-form, Formik
  - Routing: react-router
  - Theme: next-themes

## Core Artifacts
- Server
  - `server/vortex-server-alpha/src/routes/routes.ts` – central API router
  - `server/vortex-server-alpha/src/modules/elections/*` – elections feature
  - `server/vortex-server-alpha/src/db/schema/*` – database schemas
  - `server/vortex-server-alpha/drizzle.config.ts` – Drizzle config
  - `server/vortex-server-alpha/k8s/` – Kubernetes manifests
- Client
  - `client/vortex-frontend-beta/package.json` – frontend scripts and deps
  - `client/vortex-frontend-beta/src/**` – app code (features, hooks, components)
- Shared
  - Seeds/data: `server/vortex-server-alpha/data/data.ts`
  - ArcJet gateway: `src/arcjet/arcjet.gateway.ts` in server

## API Surface
- Base path: `/api`
- Key routes (from code):
  - `/api/auth` (authentication and authorization)
  - `/api/users` (user management)
  - `/api/elections` (create/list elections)
  - `/api/positions`, `/api/candidates` (election positions and candidates)
  - `/api/votes` (vote casting and retrieval)
  - `/api/media` (media assets)
  - `/api/face` (facial recognition related endpoints)
- Example endpoints gleaned from code:
  - GET `/api/elections`
  - POST `/api/elections`
  - GET `/api/votes`
  - POST `/api/votes`

## Data Models (High Level)
- Elections: `src/db/schema/elections.ts`
- Votes: `src/db/schema/votes.ts`
- Users: `src/db/schema/users.ts`
- Positions: `src/db/schema/position.ts`
- Face: `src/db/schema/face.ts`
- Core data interactions via `src/modules/elections/elections.service.ts` and `election.controller.ts` (create and fetch)

## Local Setup
- Prereqs: Node.js, npm/yarn, PostgreSQL, access to Cloudinary for media (or mocks), environment variables.
- Server (alpha):
  - Navigate to `server/vortex-server-alpha`.
  - Install: `npm install`.
  - Prepare env: set `DATABASE_URL` and other secrets.
  - Migrate: use Drizzle tooling (`npm run db:migrate`, `db:generate` if configured).
  - Run: `npm run dev` (or `ts-node-dev`/`nodemon` depending on setup).
- Client (beta):
  - Navigate to `client/vortex-frontend-beta`.
  - Install: `npm install`.
  - Run: `npm run dev` (Vite dev server).

## Deployment & DevOps
- Kubernetes manifests exist in `server/vortex-server-alpha/k8s/` with:
  - `deployment.yaml` (2 replicas) with Cloudinary credentials via a Secret.
  - `service.yaml` (ClusterIP on port 80).
  - `secret-cloudinary.yaml` (credentials to be filled).
- DB: PostgreSQL (via `pg` driver) and Drizzle migrations managed by `drizzle-kit`.
- Secrets and config should be provided via environment variables (e.g., `DATABASE_URL`, Cloudinary keys).

## Testing & Quality
- Code appears TypeScript-first with unit/integration patterns implied by modules and services; explicit tests are not visible in the scanned files.
- Local validation: compile TS, run migrations, and perform manual API checks; consider adding tests for elections and voting flows.

## Security Considerations
- Secrets in Kubernetes secrets; Cloudinary credentials; environment variables for DB connection.
- JWT-based authentication; ensure secure storage of tokens and proper CORS/helmet defaults.
- Input validation and error handling should be enforced across routes.

## Roadmap & Changelog
- Consolidate API contracts and schemas into a single API spec (OpenAPI) for both server and client.
- Migrate to a single ORM strategy (prefer either Drizzle or Prisma) to reduce complexity.
- Implement end-to-end tests for elections, voting, and facial-gate flows.
- Document deployment procedures (Dockerfiles, Helm charts) for reproducible environments.

## Appendix: Key Files
- Server/Backend
  - `server/vortex-server-alpha/package.json` – dev/build scripts and dependencies
  - `server/vortex-server-alpha/src/app.ts` – Express setup and middleware
  - `server/vortex-server-alpha/src/routes/routes.ts` – API router
  - `server/vortex-server-alpha/src/modules/elections/election.controller.ts` – controller
  - `server/vortex-server-alpha/src/modules/elections/elections.service.ts` – service
  - `server/vortex-server-alpha/drizzle.config.ts` – drizzle config
  - `server/vortex-server-alpha/k8s/` – Kubernetes manifests
- Client/Frontend
  - `client/vortex-frontend-beta/package.json` – frontend scripts and deps
  - `client/vortex-frontend-beta/src/app/App.tsx` etc. – application code
- Shared/Data
  - `server/vortex-server-alpha/data/data.ts` – sample seed data
  - `server/vortex-server-alpha/src/arcjet/arcjet.gateway.ts` – ArcJet integration helper

If you want, I can also generate a companion OpenAPI spec from the observed routes and data models, or weave this doc into the root README with a prominent link. Would you like me to proceed with either of those?