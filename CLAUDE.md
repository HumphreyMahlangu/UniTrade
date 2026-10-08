# UniTrade — Project Context (read this first, every session)

> **Current status and handover:** read [`docs/HANDOVER.md`](docs/HANDOVER.md) next. It records what is done, what is next, decisions from earlier sessions, account ownership and known gotchas. A new person or machine continues from there; earlier Claude sessions are not available.

## 1. What this is
- Academic project **PRM372S Project Management 3**, CPUT, Diploma in ICT. Product: **Community Store Mobile-First Marketplace** (repo: UniTrade).
- I (Collins) am the only active developer (teammates are unresponsive). **Deadline: 9 Oct 2026.** Everything must be demoable and submit-ready by then.
- The app is the graded "Artefact" (10%), is demoed in a ≤10-minute video (15%), and is evaluated in my Final Report (testing and evaluation). So it must **run reliably on a marker's machine**, match the requirements below, and I need **real evidence** (tests, measurements, screenshots) recorded in `docs/EVIDENCE.md`.
- Reference material is in `docs/context/`: the assignment brief (.docx), my Term 1 submission (charter, stakeholders, requirements, risk register — PDF), and the marking rubric as images plus `rubric.md`. Read `docs/context/rubric.md` before starting.

## 2. How the app is graded (design for this)
- **Proficient (75–100%)**: fully operational, meets all requirements, flawless execution, robust error handling, no bugs.
- **Competent (50–75%)**: complete and working, minor bugs, main flows work, lacks deep error handling.
- **Requires improvement (25–50%)**: partially working, frequent crashes/bugs/missing logic.
- **Unacceptable**: non-functional, or crashes on deployment.
- Priority order: (1) main flows work end to end without crashing, (2) error handling and validation, (3) mobile-first polish, (4) extras. **Never trade a working flow for an extra feature.**

## 3. Decisions already made (do not reopen)
- **Web app**, mobile-first and responsive (brief allows "mobile app and/or web portal"). Design at 360–414 px first.
- **Students only.** The only account type is STUDENT. No vendors, faculty, residents, or admin-approval flows. (Record this as limitation L1.)
- Allowed email domain: **`@mycput.ac.za`** (config property, default `mycput.ac.za`). The Term 1 charter wrote `cput.ac.za`; record as L2.
- Payment is a **mock gateway** (charter allowed "simulated or functional").
- Repo layout: `backend/` (Spring Boot, Maven wrapper) and `frontend/` (React + Vite). If the repo already contains a different layout or Gradle, keep what exists and tell me; the scripts in `scripts/` accept `--dir` for other result folders.

## 4. Requirements (from my submitted Term 1 charter; the report evaluates the app against these IDs)
**FR1 Authentication.** Register/login. Email must end with `@` + the configured domain (compare lower-cased and trimmed; match the whole domain after `@`, so `x@evilmycput.ac.za` is rejected). Password min 8 chars, BCrypt. Login returns a JWT. Protected endpoints return 401 without a valid token. *Known limitation to record (L6): this is a domain check, not proof the person owns the mailbox.*
**FR2 Listings.** Authenticated students create, edit, delete listings. Fields: title, description, category, type (`GOOD`/`SERVICE`), price (ZAR), condition (`NEW`/`USED`, null for services), imageUrl (URL string only), status (`ACTIVE`/`SOLD`/`REMOVED`), seller, createdAt. Only the owner may edit/delete (403 otherwise). Validation: title required, price ≥ 0.
**FR3 Search & filter.** `GET /api/listings` with optional `q` (case-insensitive, title/description), `category`, `type`, `condition`, `minPrice`, `maxPrice`, `page`, `size`. Only ACTIVE listings. DB indexes on filtered columns. Return a custom paged DTO (not Spring's `PageImpl`, which caches/serialises badly).
**FR4 Cart, checkout, payment.** Cart is client-side (React state + localStorage). Checkout creates an `Order` with items and total. Payment goes through a `PaymentGateway` **interface** with a `MockPaymentGateway` that simulates a PayFast-style flow: approves normally, **declines for a documented test input** (so the failure path can be demoed). Order status `PENDING → PAID → COMPLETED` (buyer confirms receipt). Paying marks listings `SOLD`. Users cannot buy their own listing. Race condition: two buyers paying for the same listing — only one may succeed (handle and test it).
**FR5 Bulletin board.** Non-commercial posts: title, body, category (`ANNOUNCEMENT`/`EVENT`/`SERVICE`), author, createdAt. Authenticated students post; list is public; author can delete own post.
**FR6 Reviews.** After an order is `COMPLETED` the buyer rates the seller 1–5 plus text. One review per order. Seller's average rating shown on listing detail and profile.
**NFR1 Security.** BCrypt, JWT, validation, JPA parameterised queries only, CORS configured, **no secrets in git** (env vars or git-ignored local properties). HTTPS only when deployed; local is HTTP (record as limitation).
**NFR2 Performance & architecture (charter: microservices + Redis, search < 2 s at peak).** We attempt it in tiers (section 6). Our measurable definition: **p95 of `GET /api/listings` < 2000 ms with zero errors at 50 concurrent users for 30 s on a database of ~10,000 listings** (my own definition — the charter did not define "peak"). Report whatever the real numbers are, including failures.
**NFR3 Mobile-first usability.** Responsive, touch-friendly, loading/empty/error states on every screen.

**Not building (log each in EVIDENCE.md section 4):** in-app messaging, notifications, real PayFast/SnapScan, 2FA, escrow, AI fraud detection, vendor/faculty/resident roles, penetration testing.

## 5. Stack and conventions
- Backend: Java 17+, Spring Boot 3.x, Spring Web, Spring Data JPA, Spring Security + JWT, Bean Validation, MySQL 8 (db `unitrade`), package `za.ac.cput.unitrade`, Maven wrapper.
- Frontend: React (Vite), React Router, one styling approach used consistently.
- Layered: controller → service → repository → domain; DTOs at the API boundary; constructor injection; SOLID. Builder pattern on domain classes and `JpaRepository` are welcome.
- **Simplicity:** I must explain every part of this code in my presentation. Standard, readable patterns; comment anything non-obvious.
- Errors: one `@RestControllerAdvice` returning `{timestamp, status, error, message, path, fieldErrors?}` with correct status codes (400/401/403/404/409). The UI shows friendly messages, loading and empty states; never a blank screen or raw stack trace.
- Tests: JUnit 5 + MockMvc + H2 (test profile, cache disabled) for the backend; Vitest + React Testing Library for a few critical frontend components. **Name tests with the requirement ID**, e.g. method `fr1_01_registerRejectsNonStudentEmail`, class `Fr3SearchTest`, `nfr2_01_cacheEvictedWhenListingSold`. The report script groups results by that ID.

## 6. Build order (vertical slices) and what we try to finish
Each slice = backend + UI + tests + evidence, then the person commits (see section 9), then **stop and summarise** (what changed, what to check, what is not done).

| Slice | Content | Tier |
|---|---|---|
| 0 | Scaffolding: both apps run, MySQL connected, H2 test profile, one passing test per side, README skeleton, **prove the evidence pipeline works** (see section 7) | Must |
| 1 | FR1 Auth | Tier 1 |
| 2 | FR2 Listings | Tier 1 |
| 3 | FR3 Search/filter | Tier 1 |
| 4 | FR4 Cart → order → mock payment → completed | Tier 1 |
| 5 | FR6 Reviews | Tier 1 |
| 6 | FR5 Bulletin board | Tier 2 |
| 7 | **NFR2a/b: Redis cache + 10k-listing perf dataset + load test** | Tier 2 |
| 8 | **NFR2c stretch: extract the payment capability into a separate `payment-service`** | Tier 3, only if 1–7 are green and tested |

If time runs short, cut from the bottom and record it in the deviations table.

### Slice 7 details (Redis + measured latency)
- Add Spring Cache with Redis for the search results. Cache a DTO, JSON-serialised; key = normalised query params + page + size; **TTL 60 s**; **evict all search entries** whenever a listing is created, edited, deleted, or marked SOLD (a sold item must not keep appearing).
- **The app must still work without Redis** (a marker may not have it): flag `app.cache.enabled`; if Redis is unreachable, log a warning and fall through to the database (custom `CacheErrorHandler`) with short Redis timeouts (e.g. 500 ms connect/command) so a missing Redis does not slow every request. Test profile uses no cache.
- Provide `docker-compose.yml` with MySQL 8 and Redis 7 as an **optional** convenience; README documents the no-Docker path too.
- Add a `perf` Spring profile that seeds ~10,000 varied listings (not part of the default seed).
- Add DB indexes; fix N+1 queries if found.
- Measure with `node scripts/perf-search.mjs` against the same data **twice** (cache OFF, then Redis ON) and let the script record both rows in EVIDENCE.md section 3. Record machine specs. Write an honest interpretation. If p95 ≥ 2 s, investigate and re-measure, and keep the failing run in the table.

### Slice 8 details (stretch: payment as a separate service)
- New module `payment-service` (own Spring Boot app, own port, own tiny datastore or none), exposing e.g. `POST /payments` and `GET /payments/{id}`. The main API calls it through the existing `PaymentGateway` interface via a `RemotePaymentGateway`; `payment.mode=local|remote` (default `local` so one backend process still runs the whole app).
- Provide one script/command to start everything. Document honestly as "two independently deployable services", **not** full microservices. If not done, record NFR2c as a deviation.

## 7. Evidence — maintain `docs/EVIDENCE.md` continuously (single file, matches the portfolio sections)
Read its header rules first. At the end of **every slice** update: Section 1 (traceability and status), 2 (run `node scripts/test-report.mjs` after running tests; add manual test rows as `NOT RUN`), 5 (architecture diagrams that match the actual code), 6 (slice log in plain language so I can explain it), 7 (what AI generated), 8 (defects found and fixed), 9 (decisions), 11 (git commit timestamps per slice; leave the hours column for me), 13 (technical lessons).
- **Never invent or pre-fill results.** Automated results come only from real runs via the script. Manual tests and screenshots are entered by me. If something was not run, it says `NOT RUN`.
- **Slice 0 must prove the pipeline:** run the backend tests, run `node scripts/test-report.mjs`, confirm it picked up the Surefire XML (adjust test config or pass `--dir` if the folder differs), then do the same for the frontend (Vitest JUnit reporter writing `frontend/test-results/junit.xml`).
- Do not hand-edit text between the `<!-- ...:START/END -->` markers.
- Verify the README by following it from a clean clone before the final slice, and record that in section 10.

## 8. Other deliverables you produce
- `README.md`: prerequisites, DB setup, env vars, run backend, run frontend, run tests, run the report/perf scripts, demo logins, optional Redis/Docker.
- Seed data (default profile): 3 demo students (documented logins, `@mycput.ac.za`), ~15 varied listings, a few bulletin posts, one completed order with a review.
- `.github/workflows/ci.yml` is provided (build + test on every push). Keep it working with the real layout; it uses H2 and no Redis.
- Final zip of source must exclude `node_modules`, `target`/`build`, `.env`, `.git`.

## 9. Hard rules
- No paid services, no real payment credentials, no secrets in git.
- Don't add features beyond this file. If something cannot be done, say so plainly so it is reported as a limitation.
- Don't claim a slice is done unless it runs and its tests pass.
- Keep a `docs/screenshots/` folder; I take the screenshots. Do not generate fake ones.
- Do not run `git add`, `git commit` or `git push` unless the person asks for it in that message. At the end of a slice, say it is ready to commit and suggest a message.
