# Contest Rating System

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
