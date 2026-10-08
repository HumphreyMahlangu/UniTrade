# START HERE (delete this file after step 4)

## What this kit is
A starter pack for the UniTrade repo: project context for Claude Code, the assignment brief and rubric, one evidence file, two evidence scripts, and an optional CI workflow.

```
CLAUDE.md                      <- Claude Code reads this automatically every session
docs/EVIDENCE.md               <- the single evidence file (tests, performance, deviations, architecture, AI log, defects...)
docs/context/                  <- brief (.docx), Term 1 PDF, rubric images + rubric.md
docs/screens/                  <- PUT YOUR TERM 1/2 SCREEN DESIGNS HERE (exports or a text file with the Figma link)
docs/screenshots/              <- YOUR screenshots of the running app (evidence)
scripts/test-report.mjs        <- turns real JUnit XML test results into the test report in EVIDENCE.md
scripts/perf-search.mjs        <- measures search latency under load and records it in EVIDENCE.md
.github/workflows/ci.yml       <- optional: GitHub runs the tests on every push
```

## Steps
1. Unzip into the **root of the UniTrade repo** (keep the folder structure). Needs Node 18+ for the scripts.
2. Copy your screen designs into `docs/screens/` (the Term 1 PDF does not contain them; check your Term 2 wireframes or Figma).
3. Open Claude Code in the repo root and paste:

```
Read CLAUDE.md first, then docs/context/rubric.md and docs/EVIDENCE.md. Look at what already exists in the repo and tell me briefly what you found. Then do Slice 0 (scaffolding and proving the evidence pipeline), and stop with a short summary. Do not start Slice 1 until I say so.
```
4. After each slice: run the app yourself, click through it, fix what is wrong, then tell Claude Code to continue with the next slice.

## Commands you will use
```
node scripts/test-report.mjs                                   # after running tests; updates docs/EVIDENCE.md section 2
node scripts/perf-search.mjs --label "cache OFF" --dataset 10000   # backend running with the perf dataset
node scripts/perf-search.mjs --label "Redis ON"  --dataset 10000
```
Both scripts only record real results. If no results exist, they stop with an error and write nothing.

## Verified vs not verified (honest status)
- Verified: both scripts were run against synthetic test data (including failure cases).
- Not verified: `ci.yml` has not been run on GitHub; the Spring/Redis/Docker work is for Claude Code to build and test on your machine.
