# Real Estate CRM

## Overview

APEX CRM is a production-ready enterprise real estate application designed to manage property inventory, sales pipelines, and unit bookings. It enforces strict ACID transactional guarantees to prevent double-booking of real estate units in high-concurrency environments.

The application allows a real estate sales team to:
- Manage leads
- Track lead stages
- Assign leads to sales employees
- Add notes and follow-ups
- Track property interests
- Manage projects, buildings, and units
- Create property bookings
- Prevent double booking
- View sales dashboard metrics
- Manage users with role-based permissions

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

| Layer | Technology |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Backend | Next.js |
| API | REST |
| ORM | Prisma |
| Database | PostgreSQL |
| Validation | Zod |
| Styling | Tailwind CSS |
| Hosting | Vercel + Render |
| Language | JavaScript / JSX |
| Package Manager | npm |

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
- `packages/shared/`: Shared enums and Zod validation schemas used by both frontend and backend.

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

## Deployment

**Frontend**:
[https://frontend-vikashini.vercel.app](https://frontend-vikashini.vercel.app/)

**Backend API**:
[https://real-estate-crm-application-backend.onrender.com](https://real-estate-crm-application-backend.onrender.com)

**Architecture**:
```text
GitHub
  |
  +---- Vercel
  |       |
  |       +---- React Frontend
  |
  +---- Render
          |
          +---- Next.js Backend
          |
          +---- PostgreSQL
```

## Authentication

### Demo Credentials

The database seed provides the following default accounts:

| Role | Name | Email | Password |
|------|------|-------|----------|
| **Admin** | Victoria Vance | `admin@realestatecrm.com` | `password123` |
| **Sales Rep** | John Miller | `john@realestatecrm.com` | `password123` |

Role-Based Access Control (RBAC) is enforced at the API level via custom middleware (`withAuth`).

| Role | Capabilities |
|------|--------------|
| `ADMIN` | Create projects/units, manage all users, view all bookings/leads. |
| `SALES_EMPLOYEE` | Create leads, book units, view assigned leads/bookings. |

## Double-Booking Protection

This CRM implements mission-critical guarantees to prevent double-booking of high-value real estate units through a strict database transaction.

```text
User A ----+
           |
           v
       Book Unit
           |
           v
       Database
           |
           +---- Booking succeeds
           |
           +---- Conflict rejected
User B ----+
```

1. **Validation**: The API strictly validates unit availability (`AVAILABLE`) before proceeding.
2. **ACID Transaction**: The entire booking process is executed inside a single `prisma.$transaction`.
3. **Atomic Updates**: The unit state is updated atomically with a version increment.
4. **Database Constraints**: `Booking.unitId` is enforced with a unique database index constraint.
5. **Conflict Resolution**: Concurrent booking attempts immediately receive a `409 Conflict` response.
6. **Guarantee**: This architecture guarantees that double-booking is physically impossible at the database level.

If a conflict occurs, the API returns:
```json
{
  "error": "Conflict: Unit was just booked or updated by another transaction."
}
```

## Database Relationship Overview

```text
User
 |
 +---- Lead
 |
 +---- Notes
 |
 +---- Property Interest (Optional)
 |
 +---- Booking
         |
         v
       Unit
         |
         v
      Building
         |
         v
      Project
```

## End-to-End CRM Flow

The CRM connects lead management, property inventory, and booking workflows into a unified process.

```text
User Login
    |
    v
Dashboard
    |
    +--------------------------------+
    |                                |
    v                                v
Lead Management               Property Management
    |                                |
    v                                v
Lead Assignment                   Project
    |                                |
    v                                v
Lead Follow-up                    Building
    |                                |
    v                                v
Property Interest                  Unit
    |
    v
Site Visit
    |
    v
Negotiation
    |
    v
Booking
    |
    v
Booking Confirmation
    |
    v
Dashboard Metrics
```

---

# API Documentation

The APEX CRM backend exposes REST APIs used by the frontend for authentication, lead management, property management, bookings, dashboard analytics, notes, and user management.

## 1. Base URL

**Production API:** `https://real-estate-crm-application-backend.onrender.com/api`
**Local API:** `http://localhost:3001/api`

Example usage:
```http
GET https://real-estate-crm-application-backend.onrender.com/api/leads
```

## 2. API Architecture

```text
React Frontend
      |
      | fetch()
      v
REST API / HTTPS
      |
      v
Authentication
      |
      v
Authorization
      |
      v
Validation
      |
      v
Business Logic
      |
      v
Prisma ORM
      |
      v
PostgreSQL Database
      |
      v
JSON Response
      |
      v
React UI
```

## 3. API Security

The API enforces strict security and access controls at the routing layer:
- **Authentication:** Enforced via `HttpOnly`, `Secure`, and `SameSite=None` JWT cookies.
- **Authorization:** `withAuth` middleware explicitly checks for required roles.
- **Data Isolation:** Sales employees can only access or modify leads explicitly assigned to them.
- **Validation:** All incoming request bodies are verified using shared Zod schemas before processing.

**Authorization Flow:**
```text
Request
  |
  v
Authentication
  |
  +---- Invalid -> 401 Unauthorized
  v
Authorization
  |
  +---- Not permitted -> 403 Forbidden
  v
Validation
  |
  +---- Invalid -> 400 Bad Request
  v
Business Logic
  v
Database
```

## 4. Error Handling (HTTP Status Codes)

The API utilizes standard HTTP status codes:

| Status | Meaning | Usage |
|--------|---------|-------|
| **200** | OK | Successful GET/PATCH requests. |
| **201** | Created | Successful POST requests. |
| **400** | Bad Request | Validation failures or missing parameters. |
| **401** | Unauthorized | Missing or invalid authentication token. |
| **403** | Forbidden | Valid token, but insufficient role or ownership permissions. |
| **404** | Not Found | Requested resource does not exist. |
| **409** | Conflict | Booking conflict due to concurrent database modifications. |
| **500** | Server Error | Internal backend exception. |

---

## 5. Authentication APIs

The application utilizes strict HTTP-Only cookies to manage sessions.

### `POST /api/auth/login`
**Purpose:** Authenticate a CRM user and establish a secure session cookie.
**Authentication:** None
**Request Body:**
```json
{
  "email": "admin@realestatecrm.com",
  "password": "password123"
}
```
**Response (200 OK):** Returns the authenticated user object. The JWT is attached silently as a `Set-Cookie` header.
**Errors:** `400 Bad Request` (Invalid input), `401 Unauthorized` (Invalid credentials), `403 Forbidden` (Inactive account).

### `GET /api/auth/me`
**Purpose:** Retrieve the currently authenticated user based on the session cookie.
**Authentication:** Required
**Response (200 OK):** Returns the user profile.

### `POST /api/auth/logout`
**Purpose:** Terminate the user session by clearing the JWT cookie.
**Authentication:** Required
**Response (200 OK):** `{ "success": true }`

---

## 6. Leads APIs

### `GET /api/leads`
**Purpose:** List leads. Admins see all leads; Sales Reps see only their assigned leads.
**Authentication:** Required

### `POST /api/leads`
**Purpose:** Create a new lead.
**Authentication:** Required
**Request Body:** Requires `name`, `phone`. Optional: `email`, `budget`, `requirement`, `interestedProjectId`, `interestedBuildingId`, `interestedUnitId`.

### `GET /api/leads/:id`
**Purpose:** Retrieve a specific lead, including their notes, property interests, and active booking details.
**Authentication:** Required (Must be Admin or the assigned Sales Rep).

### `PATCH /api/leads/:id`
**Purpose:** Update a lead's details, stage, assignment, or property interest. Automatically generates an audit Note if the stage changes.
**Authentication:** Required (Must be Admin or the assigned Sales Rep).

### `DELETE /api/leads/:id`
**Purpose:** Delete a lead entirely.
**Authentication:** Required (Admin ONLY).
**Errors:** `400 Bad Request` (Cannot delete a lead with an active booking).

---

## 7. Lead Stages

Leads strictly adhere to the following lifecycle:

```text
NEW
 |
 v
CONTACTED
 |
 v
SITE_VISIT
 |
 v
INTERESTED
 |
 v
NEGOTIATION
 |
 v
BOOKED
```
*`LOST` can be assigned as an alternative stage at any point.*

---

## 8. Lead Assignment

Leads can be assigned to specific Sales Employees.
- **Admin Users:** Can view, manage, and explicitly assign ANY lead to ANY sales employee.
- **Sales Employees:** Can only view and modify leads that have been assigned directly to them. Any attempt to access an unassigned lead or a lead belonging to another employee will result in a `403 Forbidden`.

---

## 9. Lead Notes & Follow-ups

Notes provide a chronological audit trail for a lead.

### `GET /api/leads/:id/notes`
*Note: Notes are retrieved eagerly via the `GET /api/leads/:id` endpoint.*

### `POST /api/leads/:id/notes`
**Purpose:** Append a new note to the lead's history.
**Authentication:** Required
**Request Body:**
```json
{
  "content": "Client requested a callback on Monday."
}
```

---

## 10. Property Management APIs

Property inventory follows a strict hierarchy: `Project -> Building -> Unit`.

### Projects
- **`GET /api/properties/projects`**: List all projects.
- **`POST /api/properties/projects`**: Create a project (Admin Only).
- **`GET /api/properties/projects/:id`**: Retrieve a project and its associated buildings.

### Buildings
- **`GET /api/properties/buildings`**: List all buildings.
- **`POST /api/properties/buildings`**: Create a building attached to a project (Admin Only).

### Units
- **`GET /api/properties/units`**: List all units.
- **`POST /api/properties/units`**: Create a unit (Admin Only).
- **`GET /api/properties/units/:id`**: Retrieve a specific unit's details.
- **`PATCH /api/properties/units/:id`**: Update unit price, type, or status (Admin Only).

---

## 11. Property Interest

A lead can express interest in a specific property without fully booking it.

```text
Lead
 |
 v
Property Interest
 |
 +---- Project
         |
         +---- Building
                 |
                 +---- Unit
```
**Validation:** If a lead selects an `interestedUnitId`, the backend automatically resolves and validates that the unit belongs to the correct Building and Project hierarchy.

**Important Rule:** 
Property Interest and Bookings are separate concepts. Selecting a property as an "interest" does NOT reserve the property, nor does it create a booking.

---

## 12. Booking APIs

The booking process converts a Lead into a confirmed buyer and formally reserves a Unit.

### `GET /api/bookings`
**Purpose:** List all active bookings.
**Authentication:** Required

### `POST /api/bookings`
**Purpose:** Process a transaction to book a unit for a lead.
**Authentication:** Required
**Request Body:** Requires `leadId`, `unitId`, `bookingAmount`, `finalPrice`.

### `POST /api/bookings/:id/cancel`
**Purpose:** Cancel an existing booking and free up the unit inventory.
**Authentication:** Required

---

## 13. Dashboard API

### `GET /api/dashboard/stats`
**Purpose:** Provides real-time CRM metrics for the frontend dashboard interface.
**Authentication:** Required
**Metrics Returned:**
- `totalLeads`
- `activeLeads`
- `leadsByStage` (Array of pipeline counts)
- `upcomingFollowUps` (Array of leads requiring contact)
- `recentBookings` (Recent transaction feed)
- `revenueStats` (Calculated from Booking final prices)

---

## 14. User APIs

### `GET /api/users`
**Purpose:** List all CRM users (Admin Only).

### `POST /api/users`
**Purpose:** Create a new CRM employee (Admin Only).

### `GET /api/users/:id`
**Purpose:** Retrieve a specific user profile (Admin Only).

### `PATCH /api/users/:id`
**Purpose:** Modify a user's role, name, or activation status (Admin Only).

---

## 15. Complete API Endpoint Table

| Module | Method | Endpoint | Description | Auth Required |
|---|---|---|---|---|
| Authentication | `POST` | `/api/auth/login` | Authenticate user | No |
| Authentication | `GET` | `/api/auth/me` | Get current user | Yes |
| Authentication | `POST` | `/api/auth/logout` | End session | Yes |
| Dashboard | `GET` | `/api/dashboard/stats` | Get dashboard statistics | Yes |
| Leads | `GET` | `/api/leads` | List leads | Yes |
| Leads | `POST` | `/api/leads` | Create lead | Yes |
| Leads | `GET` | `/api/leads/:id` | Get lead | Yes |
| Leads | `PATCH` | `/api/leads/:id` | Update lead | Yes |
| Leads | `DELETE`| `/api/leads/:id` | Delete lead | Yes (Admin) |
| Notes | `POST` | `/api/leads/:id/notes` | Add lead note | Yes |
| Projects | `GET` | `/api/properties/projects` | List projects | Yes |
| Projects | `POST` | `/api/properties/projects` | Create project | Yes (Admin) |
| Projects | `GET` | `/api/properties/projects/:id`| Get project | Yes |
| Buildings | `GET` | `/api/properties/buildings` | List buildings | Yes |
| Buildings | `POST` | `/api/properties/buildings` | Create building | Yes (Admin) |
| Units | `GET` | `/api/properties/units` | List units | Yes |
| Units | `POST` | `/api/properties/units` | Create unit | Yes (Admin) |
| Units | `GET` | `/api/properties/units/:id` | Get unit | Yes |
| Units | `PATCH` | `/api/properties/units/:id` | Update unit | Yes (Admin) |
| Bookings | `GET` | `/api/bookings` | List bookings | Yes |
| Bookings | `POST` | `/api/bookings` | Create booking | Yes |
| Bookings | `POST` | `/api/bookings/:id/cancel` | Cancel booking | Yes |
| Users | `GET` | `/api/users` | List users | Yes (Admin) |
| Users | `POST` | `/api/users` | Create user | Yes (Admin) |
| Users | `GET` | `/api/users/:id` | Get user | Yes (Admin) |
| Users | `PATCH` | `/api/users/:id` | Update user | Yes (Admin) |

## API Usage Example

Here is a standard example of the frontend establishing a connection to the backend REST API:

```javascript
const response = await fetch("https://real-estate-crm-application-backend.onrender.com/api/leads", {
  method: "GET",
  headers: {
    "Content-Type": "application/json"
  },
  credentials: "include" // CRITICAL: Ensures the HttpOnly JWT session cookie is transmitted securely
});

const data = await response.json();
```
