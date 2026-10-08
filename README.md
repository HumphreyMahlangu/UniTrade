# UniTrade — Community Store Mobile-First Marketplace

A mobile-first web marketplace where CPUT students (`@mycput.ac.za` accounts) buy and sell goods and services, check out with a simulated payment, review sellers, and post on a community bulletin board.
Academic project for **PRM372S Project Management 3**, CPUT.

- `backend/` — Spring Boot 3.5 REST API (Java 17+, Maven wrapper, MySQL 8)
- `frontend/` — React 19 + Vite 7 single-page app
- `docs/EVIDENCE.md` — test results, performance runs, architecture, decisions, limitations
- `scripts/` — evidence scripts (test report, search load test)

> **Status:** Slice 0 (scaffolding). Features are added slice by slice; see `docs/EVIDENCE.md` section 1.

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Java JDK | 17 or newer | Verified with 21.0.9 |
| Node.js | 20.19+ or 22.12+ | Verified with 22.21.1 (npm 10.9.4) |
| MySQL | 8.x | Verified with 8.0.44. Not needed for the H2 quick start (section 3b) |
| Docker Desktop | optional | Only for Redis (search cache) |

Maven does **not** need to be installed: use the wrapper (`mvnw` / `mvnw.cmd`).

## 2. Database setup (MySQL, once)

Open a MySQL prompt as root (Windows: `& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p`) and run, choosing your own password:

```sql
CREATE DATABASE IF NOT EXISTS unitrade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'unitrade'@'localhost' IDENTIFIED BY 'choose-a-password';
-- ALTER makes sure the password is set even if the user already existed
ALTER USER 'unitrade'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT ALL PRIVILEGES ON unitrade.* TO 'unitrade'@'localhost';
FLUSH PRIVILEGES;
```

Then give the backend that password, **either**:
- copy `backend/application-local.properties.example` to `backend/application-local.properties` and fill it in (this file is git-ignored), **or**
- set environment variables `DB_USERNAME` and `DB_PASSWORD`.

Tables are created automatically when the backend starts.

## 3. Run the backend (port 8080)

### 3a. With MySQL (normal)
```powershell
cd backend
.\mvnw.cmd spring-boot:run          # Windows PowerShell
./mvnw spring-boot:run              # macOS / Linux / Git Bash
```

### 3b. Quick start without MySQL (H2 file database in `backend/data/`)
```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=h2"     # PowerShell needs the quotes
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2           # macOS / Linux / Git Bash
```

Check it: open <http://localhost:8080/api/health> → `{"status":"UP","database":"UP",...}`.

**Troubleshooting**
| Message at startup | Cause | Fix |
|---|---|---|
| `Access denied for user 'unitrade'@'localhost' (using password: YES)` | MySQL user missing, or its password differs from `application-local.properties` | Re-run the SQL in section 2 (the `ALTER USER` line resets the password) |
| `Access denied ... (using password: NO)` | No password configured | Create `backend/application-local.properties` or set `DB_PASSWORD` |
| `Communications link failure` | MySQL is not running | Start it (Windows: `services.msc` → MySQL80 → Start) |
| `Port 8080 was already in use` | An earlier backend is still running | Stop it, or find it with `Get-NetTCPConnection -LocalPort 8080` |

## 4. Run the frontend (port 5173)
```powershell
cd frontend
npm ci          # installs the exact versions in package-lock.json
npm run dev
```
Open <http://localhost:5173>. The dev server forwards `/api` calls to the backend on port 8080.
For a phone-sized view use the browser's device toolbar (F12 → Ctrl+Shift+M).

## 5. Run the tests and the evidence report
```powershell
cd backend;  .\mvnw.cmd test;        cd ..     # JUnit 5 + MockMvc on in-memory H2 (no MySQL needed)
cd frontend; npm test -- --run;      cd ..     # Vitest + React Testing Library
node scripts/test-report.mjs                    # writes the results into docs/EVIDENCE.md section 2
```

## 6. Configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/unitrade?...` | JDBC URL |
| `DB_USERNAME` | `unitrade` | DB user |
| `DB_PASSWORD` | _(empty)_ | DB password (or use `application-local.properties`) |
| `APP_CORS_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed to call the API |
| `PORT` | `8080` | HTTP port (set automatically by Render) |
| `SPRING_PROFILES_ACTIVE` | _(unset)_ | `prod` on Render (uses `application-prod.properties`); `h2` for the no-MySQL quick start |
| `JWT_SECRET` | _(unset)_ | Login-token signing key; required with `prod` |
| `VITE_API_URL` (frontend) | _(unset locally)_ | API address for production builds; committed in `frontend/.env.production` |

No secrets are stored in git. With the `prod` profile the API refuses to start if `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` or `JWT_SECRET` is missing, and names the missing one.

## 7. Demo logins
_Added in Slice 1 (seed data)._

## 8. Optional: Redis cache and load test
_Added in Slice 7._

## 9. Deployment (optional)
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (Vercel frontend, Render backend, Aiven MySQL — all free tiers; current state, rebuild steps, troubleshooting). The Render service is described in [render.yaml](render.yaml). Check a deployment with:
```
node scripts/check-deploy.mjs --web https://uni-trade-eight.vercel.app --api https://unitrade-cput-api.onrender.com
```
Local HTTP is for development; the deployed site uses HTTPS.

## 10. Project structure
```
backend/                 Spring Boot API (package za.ac.cput.unitrade)
  src/main/java/...      controller / service / repository / domain / dto / config
  src/main/resources/    application.properties (+ application-h2.properties)
  src/test/              JUnit tests, application-test.properties (H2)
  Dockerfile             container build used by Render
frontend/                React + Vite app
  src/api/client.js      every backend call goes through here
  src/components/        layout and shared UI (loading / empty / error states)
  src/pages/             one file per screen
  vercel.json            SPA routing on Vercel
docs/EVIDENCE.md         evidence for the portfolio
scripts/                 test-report.mjs, perf-search.mjs
```
