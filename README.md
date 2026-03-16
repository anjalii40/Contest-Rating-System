# Contest Rating System

> **Hiring Assessment — Codehurdle**
> This project was built as a take-home engineering assessment for [Codehurdle](https://codehurdle.com). It demonstrates a full-stack percentile-based contest rating system using Go, Next.js, and PostgreSQL.

A percentile-based contest rating engine built with Next.js, Go, and PostgreSQL. The app generates contests, assigns ranks, recalculates ratings and tiers, stores every update in the database, and shows the results through a searchable standings page and per-user profile history.

## Live Deployment

- Frontend: [contest-rating-system-beige.vercel.app](https://contest-rating-system-beige.vercel.app)
- Backend API: [contest-rating-system-o84v.onrender.com](https://contest-rating-system-o84v.onrender.com)

## Current Product Flow

1. Open the homepage and click `Generate Demo Contest For All Users`.
2. The backend creates a contest with a random contest name.
3. Users receive random ranks and placeholder names are replaced with random real-looking names when needed.
4. Ratings, max ratings, tiers, and contest history are updated in PostgreSQL.
5. The app redirects to `/contest/[contestId]`, where you can search the full rank list.
6. Clicking any user in the standings opens `/profile/[userId]`.

## Features

- Random demo contest generation for all users
- Searchable contest rank list
- Click-through user profiles
- Rating graph with contest history
- Automatic tier updates based on percentile brackets
- PostgreSQL-backed rating history and standings
- Deployed frontend and backend connected through REST APIs

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Recharts |
| Backend | Go, Gin, pgx |
| Database | PostgreSQL, golang-migrate |
| Infra | Docker, Docker Compose |

## Architecture Diagram

```mermaid
graph LR
    U["User Browser"]
    FE["Next.js Frontend<br/>Vercel"]
    BE["Go API<br/>Gin + pgx<br/>Render"]
    DB[("PostgreSQL")]

    U --> FE
    FE -->|REST / JSON| BE
    BE -->|read / write| DB
    DB -->|profiles, contests, rating history| BE
    BE -->|contest data, standings, profile data| FE
```

## Contest Flow Diagram

```mermaid
flowchart TD
    A["Click Generate Demo Contest"] --> B["POST /api/contests/generate-demo"]
    B --> C["Fetch users from PostgreSQL"]
    C --> D["Assign random ranks"]
    D --> E["Calculate percentile, performance rating, rating change, new tier"]
    E --> F["Store contest + rating_history rows"]
    F --> G["Update user current_rating, max_rating, contests_played, tier"]
    G --> H["Redirect to /contest/[contestId]"]
    H --> I["Search standings and open /profile/[userId]"]
```

## Rating Logic

For a contest with total participants `N`, rank `R`, and current rating `CR`:

```text
beaten = N - R
percentile = beaten / N
standard_performance = bracket lookup
rating_change = (standard_performance - CR) / 2
new_rating = CR + rating_change
```

### Performance Brackets

| Percentile | Standard Performance |
| :--- | :--- |
| >= 99% | 1800 |
| >= 95% | 1400 |
| >= 90% | 1200 |
| >= 80% | 1150 |
| >= 70% | 1100 |
| >= 50% | 1000 |
| < 50% | 800 |

### Tier Mapping

| Rating | Tier |
| :--- | :--- |
| >= 1800 | Grandmaster |
| >= 1600 | Master |
| >= 1400 | Expert |
| >= 1200 | Specialist |
| >= 1000 | Pupil |
| < 1000 | Newbie |

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health check |
| `POST` | `/api/users` | Create a new user |
| `GET` | `/api/users/:id/profile` | Fetch one user with full rating history |
| `GET` | `/api/leaderboard?tier=&page=&limit=` | Paginated leaderboard |
| `POST` | `/api/contests` | Create a contest |
| `POST` | `/api/contests/generate-demo` | Generate one random contest for the current user base |
| `GET` | `/api/contests` | List contests |
| `GET` | `/api/contests/:id` | Fetch a contest with standings |
| `POST` | `/api/contests/:id/submit-results` | Submit rank results for a contest |

## Frontend Routes

| Route | Purpose |
| :--- | :--- |
| `/` | Generate a contest |
| `/contest/[contestId]` | Searchable standings page with profile links |
| `/profile/[userId]` | User rating summary, chart, and contest history |

## Local Development

### Docker

```bash
git clone https://github.com/anjalii40/Contest-Rating-System.git
cd Contest-Rating-System
cp .env.example .env
docker compose up --build
```

Local services:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8080](http://localhost:8080)
- PostgreSQL: `localhost:5432`

### Run Without Docker

Backend:

```bash
cd backend
go mod tidy
migrate -path migrations -database "$DATABASE_URL" up
go run cmd/main.go
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## View Database In Real Time

If you are running PostgreSQL through Docker, open the live database with:

```bash
docker exec -it contest_db psql -U postgres -d contest_engine
```

Useful `psql` commands:

```sql
\dt
\d users
\d contests
\d rating_history
```

Live data queries:

```sql
SELECT * FROM users ORDER BY id DESC LIMIT 20;
SELECT * FROM contests ORDER BY id DESC LIMIT 20;
SELECT * FROM rating_history ORDER BY id DESC LIMIT 20;
```

Joined contest history view:

```sql
SELECT
  rh.id,
  u.name,
  c.name AS contest_name,
  rh.rank,
  rh.old_rating,
  rh.new_rating,
  rh.rating_change,
  rh.percentile
FROM rating_history rh
JOIN users u ON rh.user_id = u.id
JOIN contests c ON rh.contest_id = c.id
ORDER BY rh.id DESC
LIMIT 20;
```

Helpful extras:

```sql
\x on
\q
```

## Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string used by the backend | `postgres://postgres:pass@localhost:5432/contest_engine?sslmode=disable` |
| `DB_USER` | Postgres username for Docker | `postgres` |
| `DB_PASSWORD` | Postgres password for Docker | `secretpassword` |
| `DB_NAME` | Postgres database name for Docker | `contest_engine` |
| `DB_PORT` | Exposed Postgres port | `5432` |
| `BACKEND_PORT` | Local backend port | `8080` |
| `FRONTEND_PORT` | Local frontend port | `3000` |
| `NEXT_PUBLIC_API_URL` | Browser-visible API base URL | `https://contest-rating-system-o84v.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins for the Go API | `https://contest-rating-system-beige.vercel.app` |

## Seed Data

Optional SQL seed:

```bash
psql "$DATABASE_URL" -f backend/seeds/fake_test_data.sql
```

This is useful for local testing, but the app now relies on live database data rather than frontend fallback history.

## Project Structure

```text
Contest-Rating-System/
├── backend/
│   ├── cmd/main.go
│   ├── entrypoint.sh
│   ├── internal/
│   │   ├── handler/
│   │   │   ├── demo_data.go
│   │   │   ├── handlers.go
│   │   │   └── health.go
│   │   ├── repository/
│   │   │   ├── models.go
│   │   │   └── repository.go
│   │   └── service/
│   │       ├── rating.go
│   │       └── rating_test.go
│   ├── migrations/
│   └── seeds/fake_test_data.sql
├── frontend/
│   ├── app/
│   │   ├── contest/[contestId]/page.tsx
│   │   ├── profile/[userId]/page.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ContestStandings.tsx
│   │   ├── RatingChart.tsx
│   │   └── TierBadge.tsx
│   └── lib/api.ts
├── docker-compose.yml
└── .env.example
```

## Notes

- Ratings, max ratings, and contest counts shown on profiles are derived from stored history so the UI stays in sync with the database.
- Demo contest generation updates every selected user in a single backend flow and persists the result before redirecting.
- The frontend and backend are configured to use the deployed services by default.
