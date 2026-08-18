# 🛡️ GateKeeper — Visitor Management System

GateKeeper is a visitor and access-management application for offices, facilities, and secure buildings. It helps staff log visitors, track who is currently inside, manage check-outs, and review daily activity from a single dashboard.

The app is built for security officers and office administrators who need a fast, reliable way to:
- record visitor check-ins
- track guest host and visit type
- see who is currently inside the building
- filter and search visitor records
- monitor daily statistics and access activity

---

## Tech Stack
- Frontend: React + Vite + React Router
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: JWT + bcrypt
- Testing: Vitest + Supertest

---

## How the App Works

The workflow is simple:
1. A staff member or officer logs in.
2. A visitor is checked in with their personal details, host, floor, and visit type.
3. The backend stores that record in PostgreSQL.
4. The dashboard reads live data and shows totals such as visitors today, currently inside, checked out, and visitor trends.
5. Management can search the log and review previous access activity.

---

## Backend Setup

### 1. Install dependencies

From the project root:

```bash
cd gatekeeper
npm install

cd backend
npm install
```

### 2. Configure the database

Create a PostgreSQL database and set the connection string in `backend/.env`.

```bash
cp backend/.env.example backend/.env
```

Then update the file with your values, for example:

```env
DATABASE_URL=postgres://your_user:your_password@localhost:5432/gatekeeper
JWT_SECRET=your-secret-key
PORT=4000
NODE_ENV=development
```

The app uses PostgreSQL and the backend creates the required tables automatically if they are missing.

### 3. Start the backend

```bash
cd backend
npm start
```

The backend runs on:

```text
http://localhost:4000
```

### 4. Start the frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

---

## Database Used

This project uses PostgreSQL as its main database.

The backend connects with the `pg` package and initializes the schema inside `backend/db.js`. It creates tables including:
- companies
- officers
- visitors
- blacklist
- preregistrations

At startup, the app runs `CREATE TABLE IF NOT EXISTS` statements to ensure the database structure exists. It also runs migrations to add missing columns and update foreign keys when needed.

---

## Statistics API Endpoint

The main stats endpoint is:

```http
GET /api/visitors/stats
```

This endpoint is protected by authentication and is defined in `backend/routes/visitors.js`.

Example response:

```json
{
  "today": {
    "total": 48,
    "inside": 12,
    "checkedOut": 36
  },
  "byType": [
    { "visitor_type": "work", "count": 26 },
    { "visitor_type": "delivery", "count": 10 }
  ],
  "byHour": [
    { "hour": 9, "count": 5 },
    { "hour": 10, "count": 8 }
  ],
  "last7Days": [
    { "date": "2026-08-11", "count": 7 },
    { "date": "2026-08-12", "count": 9 }
  ],
  "byFloor": [
    { "floor": "2", "count": 14 }
  ],
  "avgDurationMins": 42
}
```

---

## How the Backend Retrieves Statistics from the Database

The statistics flow is:

1. `backend/routes/visitors.js` receives the request to `/api/visitors/stats`
2. `backend/controllers/visitorsController.js` calls the service layer
3. `backend/services/visitorService.js` calculates the current date and executes multiple queries in parallel
4. `backend/repositories/visitorsRepository.js` runs SQL against PostgreSQL to fetch the numbers

The service uses `Promise.all(...)` to collect these values at once:
- total visitors for today
- visitors currently inside
- visitors already checked out
- totals by visitor type
- totals by hour
- last 7 days activity
- top floors used
- recent visitors
- average visit duration

Example repository queries:

```sql
SELECT COUNT(*) as c
FROM visitors
WHERE company_id = ? AND DATE(checked_in_at) = DATE(?)
```

```sql
SELECT visitor_type, COUNT(*) as count
FROM visitors
WHERE company_id = ? AND DATE(checked_in_at) = DATE(?)
GROUP BY visitor_type
```

```sql
SELECT EXTRACT(HOUR FROM checked_in_at)::INTEGER as hour, COUNT(*) as count
FROM visitors
WHERE company_id = ? AND DATE(checked_in_at) = DATE(?)
GROUP BY hour
ORDER BY hour
```

These queries are executed directly against the `visitors` table in PostgreSQL, so the stats are always based on the latest records in the database.

---

## Useful API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Officer login |
| GET | `/api/auth/me` | Get current officer |
| GET | `/api/visitors` | List visitors with filters |
| POST | `/api/visitors` | Check in a visitor |
| PATCH | `/api/visitors/:id/checkout` | Check out a visitor |
| GET | `/api/visitors/stats` | Get visitor statistics |

### Query params for GET /api/visitors
- `search` — name, ID, or host
- `type` — work / family / delivery / contractor
- `status` — in / out
- `date` — YYYY-MM-DD

---

## Running Tests

```bash
cd backend
npm test
```

The test suite uses Vitest and Supertest. It mocks the repository layer, so the tests do not require a live database connection.

---

## Production Notes
- Use a strong, unique `JWT_SECRET`
- Keep PostgreSQL credentials in environment variables, not in source code
- Set `NODE_ENV=production` and use a process manager such as PM2
- Update the CORS origin to your production frontend domain
