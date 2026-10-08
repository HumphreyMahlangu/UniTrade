# Deployment (optional, free tiers)

The marker runs the app locally (see README). This deployment is for the demo video and to catch hosting problems early.

| Part | Host | Why |
|---|---|---|
| Frontend (React build) | **Vercel** | Free static hosting, HTTPS, redeploys on every push |
| Backend (Spring Boot) | **Render** (Docker, free web service) | Vercel cannot run a long-running Java server |
| Database (MySQL 8) | **Aiven** (free MySQL plan) | Managed MySQL; Render's free database is PostgreSQL only |

Redis is **not** used in deployment (the app runs without it).
Free plans change over time: check the current limits when signing up. No credit card or paid plan should be needed; if a host asks for one, stop and choose another.

**Known free-tier behaviour:** Render's free service sleeps after ~15 minutes without traffic; the first request then takes up to a minute. Open the site a minute before recording the demo.

Do the steps in this order (each needs a value from the previous one).

## Step 1 — Database on Aiven
1. Sign up at aiven.io (sign in with GitHub) → **Create service** → **MySQL** → **Free plan** → pick the closest region → create.
2. When it is running, open the service **Overview** and note: **Host**, **Port**, **User** (`avnadmin`), **Password**, **Database** (`defaultdb`).
3. Your JDBC URL is:
   `jdbc:mysql://HOST:PORT/defaultdb?sslMode=REQUIRED&serverTimezone=UTC`

## Step 2 — Backend on Render
1. Sign up at render.com (sign in with GitHub) → **New** → **Web Service** → connect the `UniTrade` repository.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime / Language:** Docker (it finds `backend/Dockerfile`)
   - **Instance type:** Free
   - **Health check path:** `/api/health`
3. **Environment variables:**
   | Key | Value |
   |---|---|
   | `DB_URL` | the JDBC URL from step 1 |
   | `DB_USERNAME` | `avnadmin` |
   | `DB_PASSWORD` | the Aiven password |
   | `APP_CORS_ORIGINS` | leave for now; set in step 4 |
4. Create the service and wait for the build (first build ~5 min). Note the URL, e.g. `https://unitrade-api.onrender.com`.
5. Check `https://<your-render-url>/api/health` shows `"database":"UP"`.

## Step 3 — Frontend on Vercel
1. Sign up at vercel.com (sign in with GitHub) → **Add New → Project** → import `UniTrade`.
2. **Root Directory:** `frontend` (framework preset Vite is detected automatically).
3. **Environment variable:** `VITE_API_URL` = your Render URL from step 2 (no trailing slash).
4. Deploy. Note the URL, e.g. `https://unitrade.vercel.app`.

## Step 4 — Allow the Vercel site to call the API
In Render → your service → **Environment**, set `APP_CORS_ORIGINS` to your Vercel URL (no trailing slash), e.g. `https://unitrade.vercel.app`, and save (Render redeploys).
Open the Vercel URL: the home page should show *API: UP · Database: UP*.

## After that
Every `git push` to `main` redeploys both automatically. If something breaks, check: Render → **Logs**; Vercel → **Deployments → build logs**; the browser console (F12) for CORS errors.
