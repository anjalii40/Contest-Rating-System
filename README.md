# 🏆 Contest Rating System

A percentile-based rating engine for competitive programming platforms. Users are ranked after each contest using a performance bracket model, and their tier is automatically recalculated — no manual intervention needed.

**Live Demo:**
- **Frontend:** [contest-rating-system-beige.vercel.app](https://contest-rating-system-beige.vercel.app)
- **Backend API:** [contest-rating-system-o84v.onrender.com](https://contest-rating-system-o84v.onrender.com)

> **Quick test:** Open the frontend, click any of the 6 demo user cards (Alice → Frank), and explore their rating history, tier progress bar, and contest breakdown table.

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Backend** | Go 1.22, Gin Framework, pgx (connection pooling) |
| **Frontend** | Next.js 15 (App Router, Server Components), TypeScript, Tailwind CSS, Recharts |
| **Database** | PostgreSQL 15, golang-migrate |
| **Infrastructure** | Docker, docker-compose multi-stage builds |

---

## 🏗️ System Architecture

Shows how the three containers communicate over a shared Docker network.

```mermaid
graph TD
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef backend  fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef database fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff
    classDef infra    fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff

    subgraph Browser["🌐 Browser"]
        USER([User])
    end

    subgraph Docker["🐳 Docker Network"]
        subgraph FE["Frontend Container :3000"]
            Next["Next.js 15\nApp Router\nServer Components"]:::frontend
        end

        subgraph BE["Backend Container :8080"]
            Gin["Gin HTTP Router"]:::backend
            Engine["Rating Engine\nPure Go — no DB deps"]:::backend
            Repo["pgx Repository\nConnection Pool"]:::backend
            Gin --> Engine --> Repo
        end

        subgraph DB["Database Container :5432"]
            PG[("PostgreSQL 15\nusers · contests\nrating_history")]:::database
        end

        Migrate["golang-migrate\nRuns on startup"]:::infra
    end

    USER -- "HTTP (Browser)" --> Next
    Next -- "REST/JSON via Axios" --> Gin
    Repo -- "TCP / SQL" --> PG
    Migrate -- "SQL migrations" --> PG
```

---

## 🔄 Request Lifecycle: User Profile Load

Traces what happens from the moment a user clicks a profile card to when data appears on screen.

```mermaid
sequenceDiagram
    autonumber
    actor Browser
    participant Next as Next.js Server Component
    participant Gin as Go/Gin API :8080
    participant Repo as pgx Repository
    participant PG as PostgreSQL

    Browser->>Next: GET /profile/1
    Note over Next: Server-side render (no client JS needed)

    Next->>Gin: GET /api/users/1/profile
    Gin->>Repo: GetUserByID(1)
    Repo->>PG: SELECT * FROM users WHERE id=1
    PG-->>Repo: user row
    Repo-->>Gin: User struct

    Gin->>Repo: GetUserRatingHistory(1)
    Repo->>PG: SELECT rh.*, c.name, c.date\nFROM rating_history rh\nJOIN contests c ON...
    PG-->>Repo: []RatingHistory rows
    Repo-->>Gin: history slice

    Gin-->>Next: JSON {user, history}
    Note over Next: Renders profile card,\ntier progress bar,\nchart, history table
    Next-->>Browser: Full HTML response
```

---

## ⚙️ Rating Calculation Flow

Traces a single `POST /api/contests/:id/submit-results` call from JSON payload to committed database row.

```mermaid
flowchart TD
    A([POST /api/contests/:id/submit-results\n{user_id, rank} array]) --> B{Validate\ncontest exists?}
    B -- No --> ERR1[404 Contest Not Found]
    B -- Yes --> C{Results count\n≤ total_participants?}
    C -- No --> ERR2[400 Bad Request]
    C -- Yes --> D[For each result...]

    D --> E[Fetch user's\ncurrent_rating from DB]
    E --> F{User found?}
    F -- No --> SKIP[Log error\nSkip this user]
    F -- Yes --> G["🧮 Rating Engine\nCalculateRating()"]

    subgraph Engine["Pure Go — No DB access"]
        G --> H["beaten = total − rank\npercentile = beaten / total"]
        H --> I{Map percentile\nto standard perf}
        I -- "≥ 99%" --> P1[Standard Perf = 1800]
        I -- "≥ 95%" --> P2[Standard Perf = 1400]
        I -- "≥ 90%" --> P3[Standard Perf = 1200]
        I -- "≥ 80%" --> P4[Standard Perf = 1150]
        I -- "≥ 70%" --> P5[Standard Perf = 1100]
        I -- "≥ 50%" --> P6[Standard Perf = 1000]
        I -- "< 50%" --> P7[Standard Perf = 800]
        P1 & P2 & P3 & P4 & P5 & P6 & P7 --> J["rating_change =\n(std_perf − old_rating) / 2\nnew_rating = old + change"]
    end

    J --> K["DetermineTier(new_rating)"]
    K --> L[Build ContestResultUpdate struct]
    L --> D

    D -- All processed --> M["SubmitContestResultsTx()\nSingle atomic transaction"]
    M --> N[(INSERT rating_history\nUPDATE users\ncurrent_rating, max_rating, tier)]
    N --> O{Any\nerrors?}
    O -- Partial --> WARN[207 Multi-Status\npartial success]
    O -- None --> SUCCESS[200 OK ✅]
```

---

## 🏅 Tier Assignment Logic

Shows how a final rating maps to a tier badge.

```mermaid
flowchart LR
    R([new_rating]) --> T1{"≥ 1800?"}
    T1 -- Yes --> GM["🔴 Grandmaster"]
    T1 -- No  --> T2{"≥ 1600?"}
    T2 -- Yes --> MA["🟣 Master"]
    T2 -- No  --> T3{"≥ 1400?"}
    T3 -- Yes --> EX["🔵 Expert"]
    T3 -- No  --> T4{"≥ 1200?"}
    T4 -- Yes --> SP["🩵 Specialist"]
    T4 -- No  --> T5{"≥ 1000?"}
    T5 -- Yes --> PU["🟢 Pupil"]
    T5 -- No  --> NB["⚪ Newbie"]
```

---

## 🐳 Docker Startup Sequence

Shows how the three containers start up in dependency order.

```mermaid
sequenceDiagram
    participant DC as docker compose up
    participant PG as postgres container
    participant BE as backend container
    participant FE as frontend container

    DC->>PG: Start PostgreSQL 15
    loop Healthcheck (every 5s)
        DC-->>PG: pg_isready?
        PG-->>DC: not ready yet...
    end
    PG-->>DC: ✅ healthy

    DC->>BE: Start Go backend (depends_on postgres healthy)
    Note over BE: entrypoint.sh runs\ngolang-migrate up\nthen starts Gin server
    BE-->>DC: listening on :8080

    DC->>FE: Start Next.js frontend (depends_on backend)
    FE-->>DC: listening on :3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/health` | Service health check |
| `POST` | `/api/users` | Create a new user (starts at rating 800, Newbie) |
| `POST` | `/api/contests` | Create a new contest |
| `POST` | `/api/contests/:id/submit-results` | Submit `[{user_id, rank}]` array — triggers full rating calculation |
| `GET` | `/api/users/:id/profile` | Get user stats + full rating history |
| `GET` | `/api/contests` | List all contests |
| `GET` | `/api/contests/:id` | Get contest details + standings |
| `GET` | `/api/leaderboard?tier=&page=&limit=` | Paginated leaderboard, optional tier filter |

---

## 🧠 Rating Math

Given a contest with `N` total participants and a user finishing at rank `R` with current rating `CR`:

```
beaten      = N - R
percentile  = beaten / N          # float 0.0 → <1.0

std_perf    = bracket lookup (see table below)

rating_change = (std_perf - CR) / 2
new_rating    = CR + rating_change
```

| Percentile | Standard Performance |
|:---|:---|
| ≥ 99% (top 1%) | 1800 |
| ≥ 95% (top 5%) | 1400 |
| ≥ 90% (top 10%) | 1200 |
| ≥ 80% (top 20%) | 1150 |
| ≥ 70% (top 30%) | 1100 |
| ≥ 50% (top 50%) | 1000 |
| < 50% (bottom) | 800 |

---

## 💻 How to Run

### Method 1: Docker (Recommended)

Runs the full stack — no Go, Node, or Postgres needed locally.

```bash
git clone https://github.com/anjalii40/Contest-Rating-System.git
cd Contest-Rating-System

cp .env.example .env          # fill in your values
docker compose up --build
```

| Service | URL |
|:---|:---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

### Method 2: Local Development

**1. Database** — ensure PostgreSQL is running and `DATABASE_URL` is set.

**2. Backend:**
```bash
cd backend
go mod tidy
migrate -path migrations -database "$DATABASE_URL" up
go run cmd/main.go
```

**3. Frontend:**
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### Seed Test Data

To populate the 6 demo users (Alice → Frank) with 3 contests each:

```bash
psql "$DATABASE_URL" -f backend/seeds/fake_test_data.sql
```

---

## ⚙️ Environment Variables

| Variable | Description | Example |
|:---|:---|:---|
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `secretpassword` |
| `DB_NAME` | Database name | `contest_engine` |
| `DB_PORT` | Host port for Postgres | `5432` |
| `DATABASE_URL` | Full connection string (used by backend & migrate) | `postgres://postgres:pass@localhost:5432/contest_engine?sslmode=disable` |
| `BACKEND_PORT` | Host port for the Go API | `8080` |
| `FRONTEND_PORT` | Host port for Next.js | `3000` |
| `NEXT_PUBLIC_API_URL` | API base URL seen by the browser | `http://localhost:8080` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins for the backend | `http://localhost:3000` |

---

## 📁 Project Structure

```
Contest-Rating-System/
├── backend/
│   ├── cmd/main.go                    # Entry point — sets up Gin, connects DB
│   ├── entrypoint.sh                  # Runs migrations then starts server
│   ├── internal/
│   │   ├── handler/
│   │   │   ├── handlers.go            # All HTTP route handlers
│   │   │   └── health.go             # GET /health
│   │   ├── repository/                # pgx DB queries (users, contests, history)
│   │   └── service/
│   │       ├── rating.go              # Pure rating math + tier logic
│   │       └── rating_test.go         # Unit tests for rating engine
│   ├── migrations/                    # SQL migration files (golang-migrate)
│   ├── seeds/fake_test_data.sql       # 6 demo users + 3 contests seed
│   └── Dockerfile                     # Alpine Go multi-stage build
├── frontend/
│   ├── app/
│   │   ├── page.tsx                   # Home page (Server Component, live demo cards)
│   │   └── profile/[userId]/
│   │       ├── page.tsx               # Profile page (tier bar, chart, history table)
│   │       ├── loading.tsx            # Suspense skeleton
│   │       └── error.tsx              # Error boundary
│   ├── components/
│   │   ├── RatingChart.tsx            # Recharts line chart with custom tooltip
│   │   └── TierBadge.tsx              # Colored pill badge per tier
│   ├── lib/api.ts                     # Axios client + TypeScript interfaces
│   └── Dockerfile                     # Node 20 slim Next.js builder
├── docker-compose.yml                 # Orchestrates all 3 containers
├── e2e_sim.go                         # End-to-end simulation script
└── .env.example                       # Config template
```
