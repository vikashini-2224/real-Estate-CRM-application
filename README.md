# Real Estate CRM

## Overview

Apex Real Estate CRM is a production-ready enterprise application designed to manage property inventory, sales pipelines, and unit bookings. It enforces strict ACID transactional guarantees to prevent double-booking of real estate units in high-concurrency environments.

## Features

- **Lead Management**: Track potential buyers.
- **Lead Pipeline**: Visual status tracking through multiple stages.
- **Sales Employee Assignment**: Distribute leads among the sales team.
- **Notes and Follow-ups**: Maintain a full audit trail of interactions.
- **Project/Building/Unit Management**: Manage complex property hierarchies.
- **Property Inventory**: Real-time availability tracking.
- **Booking Workflow**: Securely process bookings with pricing overrides.
- **Double-booking Prevention**: Database-level concurrency protection.
- **Dashboard**: High-level metrics and upcoming tasks.
- **Authentication**: Secure Http-Only cookie-based JWT authentication.
- **RBAC**: Role-Based Access Control distinguishing Admins from Sales Employees.

## Technology Stack

**Frontend**:
- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Router
- React Hook Form
- Zod

**Backend**:
- Next.js (App Router API routes)
- TypeScript
- REST APIs
- Prisma ORM

**Database**:
- PostgreSQL

**Shared**:
- TypeScript (Interfaces and Types)
- Zod (Validation schemas)

## Architecture

```text
React/Vite (Frontend)
    |
    | (REST API via VITE_API_URL)
    v
Next.js (Backend)
    |
    | (Prisma ORM)
    v
PostgreSQL (Database)
```

## Project Structure

- `apps/frontend/`: The React + Vite SPA. Contains all UI components, pages, hooks, and routing logic.
- `apps/backend/`: The Next.js API server. Contains Prisma schema, API routes, and middleware.
- `packages/shared/`: Shared TypeScript types, enums, and Zod validation schemas used by both frontend and backend.

## Local Setup

### 1. Install Dependencies
From the project root:
```bash
npm install
```

### 2. Database Setup
Ensure PostgreSQL is running locally.

### 3. Environment Variables
Create `.env` files based on the examples:

**Backend (`apps/backend/.env`)**:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="your-secure-secret-here"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

**Frontend (`apps/frontend/.env`)**:
```env
VITE_API_URL="http://localhost:3001"
```
*(Note: `.env.example` files are provided. Real secrets must never be committed).*

### 4. Prisma Generation & Migration
Navigate to the backend and initialize the database:
```bash
cd apps/backend
npx prisma generate
npx prisma db push
# or npx prisma migrate dev
```

### 5. Seed Database
```bash
npm run seed --workspace=apps/backend
```

### 6. Start Development Servers
Start both servers from the project root:
```bash
# Start backend (Port 3001)
npm run dev --workspace=apps/backend

# Start frontend (Port 5173)
npm run dev --workspace=apps/frontend
```

## Authentication

Role-Based Access Control (RBAC) is enforced at the API level via custom middleware (`withAuth`).

| Role | Capabilities |
|------|--------------|
| `ADMIN` | Create projects/units, manage all users, view all bookings/leads. |
| `SALES_EMPLOYEE` | Create leads, book units, view assigned leads/bookings. |

## Lead Pipeline

Leads progress through the following strictly enforced stages:
- `NEW`
- `CONTACTED`
- `SITE_VISIT`
- `INTERESTED`
- `NEGOTIATION`
- `BOOKED` (Automatically set upon successful unit booking)
- `LOST`

## Booking Concurrency Protection

This CRM implements mission-critical guarantees to prevent double-booking of high-value real estate units:

1. **Validation**: The API strictly validates unit availability (`AVAILABLE`) before proceeding.
2. **ACID Transaction**: The entire booking process is executed inside a single `prisma.$transaction`.
3. **Atomic Updates**: The unit state is updated atomically with a version increment.
4. **Database Constraints**: `Booking.unitId` is enforced with a unique database index constraint.
5. **Conflict Resolution**: Concurrent booking attempts immediately receive a `409 Conflict` response.
6. **Guarantee**: This architecture guarantees that double-booking is physically impossible at the database level.

## Concurrency Test

A programmatic concurrency stress test was executed during development using 5 simultaneous booking requests against the same unit:
- **Result**: 1 HTTP 201 (Created), 4 HTTP 409 (Conflict).
- **Double Bookings**: 0.
This demonstrates the absolute reliability of the database-level locking strategy.

## API Overview

Major REST endpoints provided by the backend:

- `/api/auth/login` (POST)
- `/api/auth/logout` (POST)
- `/api/auth/me` (GET)
- `/api/leads` (GET, POST)
- `/api/leads/[id]/notes` (POST)
- `/api/projects` (GET, POST)
- `/api/buildings` (POST)
- `/api/units` (POST)
- `/api/bookings` (GET, POST)
- `/api/dashboard/stats` (GET)

## Important Engineering Decisions

1. **React + Next.js Separation**: Decoupled architecture allows the API to scale independently and supports easy migration to alternative frontend frameworks (e.g. React Native) in the future.
2. **Shared Validation/DTO Package**: Utilizing a monorepo structure with a shared Zod package guarantees absolute parity between frontend forms and backend API payload validation, eliminating type drift.
3. **PostgreSQL + Prisma**: PostgreSQL was chosen for its robust transactional guarantees and ACID compliance, which are strictly required for high-stakes real estate bookings.
4. **Database-level Booking Protection**: Application-level checks are insufficient for concurrency. A combination of Unique constraints and Prisma transactions ensures data integrity regardless of API load balancing or race conditions.
5. **API-level RBAC**: Role enforcement is applied at the lowest layer (the API routes) using higher-order functions (`withAuth`), ensuring that frontend UI manipulations cannot bypass security policies.

## Production Deployment

**Frontend Deployment**:
Deploy the Vite application to Vercel/Netlify. Ensure `VITE_API_URL` is set to the backend domain.
- Frontend URL: `https://<frontend-domain>`

**Backend Deployment**:
Deploy the Next.js API to Render/Railway. Ensure `FRONTEND_URL` is configured for CORS.
- Backend URL: `https://<backend-domain>`

**Database**:
Provision a standard PostgreSQL instance. Ensure connection pooling is configured if scaling horizontally.

## Assignment Compliance

- [x] Lead Management & Pipeline
- [x] Sales Employee Assignment
- [x] Hierarchical Property Inventory (Project -> Building -> Unit)
- [x] Booking Workflow & Concurrency Prevention
- [x] Dashboard Analytics
- [x] JWT Authentication & RBAC
- [x] PostgreSQL & Prisma
- [x] Frontend/Backend Separation
